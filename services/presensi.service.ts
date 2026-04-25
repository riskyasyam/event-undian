/**
 * Presensi Service - Business logic for attendance management
 */

import { prisma } from '@/lib/prisma';
import { Presensi, Prisma, TipePeserta } from '@prisma/client';

// Type for Presensi with Peserta relation
export type PresensiWithPeserta = Prisma.PresensiGetPayload<{
  include: {
    peserta: {
      select: {
        id: true;
        kode_unik: true;
        nama: true;
        nomor_telepon: true;
        alamat: true;
        tipe: true;
      };
    };
  };
}>;

export interface CreatePresensiInput {
  peserta_id: string;
  event_id: string;
  metode?: string;
}

/**
 * Create presensi record
 */
export async function createPresensi(data: CreatePresensiInput): Promise<Presensi> {
  return prisma.presensi.create({
    data: {
      peserta_id: data.peserta_id,
      event_id: data.event_id,
      metode: data.metode || 'manual',
    },
  });
}

/**
 * Get presensi for an event
 */
export async function getPresensiByEvent(
  eventId: string,
  options: {
    limit?: number;
    page?: number;
    pageSize?: number;
    all?: boolean;
    tipe?: TipePeserta;
    search?: string;
  } = {}
): Promise<PresensiWithPeserta[]> {
  const isAll = options.all === true;
  const limit = isAll
    ? undefined
    : options.limit
      ? Math.max(1, options.limit)
      : undefined;
  const page = !isAll && options.page ? Math.max(1, options.page) : 1;
  const pageSize = !isAll && options.pageSize ? Math.max(1, options.pageSize) : undefined;
  const tipe = options.tipe;
  const search = options.search?.trim();
  const skip = pageSize ? (page - 1) * pageSize : undefined;

  return prisma.presensi.findMany({
    where: {
      event_id: eventId,
      ...(tipe && { peserta: { tipe } }),
      ...(search && {
        peserta: {
          ...(tipe && { tipe }),
          OR: [
            {
              nama: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              kode_unik: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              nomor_telepon: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      }),
    },
    include: {
      peserta: {
        select: {
          id: true,
          kode_unik: true,
          nama: true,
          nomor_telepon: true,
          alamat: true,
          tipe: true,
        },
      },
    },
    orderBy: { waktu_hadir: 'desc' },
    ...(limit ? { take: limit } : {}),
    ...(pageSize ? { take: pageSize, skip } : {}),
  });
}

/**
 * Get presensi by participant
 */
export async function getPresensiByPeserta(pesertaId: string): Promise<Presensi[]> {
  return prisma.presensi.findMany({
    where: { peserta_id: pesertaId },
    orderBy: { waktu_hadir: 'desc' },
  });
}

/**
 * Get presensi statistics for an event
 */
export async function getPresensiStats(eventId: string) {
  const totalPeserta = await prisma.peserta.count({
    where: { event_id: eventId, tipe: TipePeserta.PESERTA },
  });

  const totalHadir = await prisma.peserta.count({
    where: {
      event_id: eventId,
      tipe: TipePeserta.PESERTA,
      status_hadir: true,
    },
  });

  const totalBelumHadir = totalPeserta - totalHadir;
  const persentaseHadir = totalPeserta > 0 ? Math.round((totalHadir / totalPeserta) * 100) : 0;

  return {
    total_peserta: totalPeserta,
    total_hadir: totalHadir,
    total_belum_hadir: totalBelumHadir,
    persentase_hadir: persentaseHadir,
  };
}

/**
 * Check if participant has attended
 */
export async function checkAttendance(pesertaId: string): Promise<boolean> {
  const peserta = await prisma.peserta.findUnique({
    where: { id: pesertaId },
    select: { status_hadir: true, tipe: true },
  });

  return peserta?.tipe === TipePeserta.PESERTA ? (peserta.status_hadir || false) : false;
}

/**
 * Mark attendance by token (for QR code scanning)
 */
export async function presensiByToken(token: string, eventId: string): Promise<Presensi> {
  // Find participant by token
  const peserta = await prisma.peserta.findUnique({
    where: { token },
  });

  if (!peserta) {
    throw new Error('Participant not found');
  }

  // Check if already attended
  if (peserta.status_hadir) {
    throw new Error('Peserta sudah melakukan presensi sebelumnya');
  }

  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Mark as attended
      await tx.peserta.update({
        where: { id: peserta.id },
        data: { status_hadir: true },
      });

      // Create presensi record
      const presensi = await tx.presensi.create({
        data: {
          peserta_id: peserta.id,
          event_id: eventId,
          metode: 'qrcode',
        },
      });

      return presensi;
    });

    return result;
  } catch (error: any) {
    // Handle unique constraint violation (duplicate presensi)
    if (error.code === 'P2002' && error.meta?.target?.includes('peserta_id')) {
      throw new Error('Peserta sudah melakukan presensi sebelumnya');
    }
    throw error;
  }
}
