/**
 * Presensi Service - Business logic for attendance management
 */

import { prisma } from '@/lib/prisma';
import { Presensi, Prisma } from '@prisma/client';

// Type for Presensi with Peserta relation
export type PresensiWithPeserta = Prisma.PresensiGetPayload<{
  include: {
    peserta: true;
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
 * Get all presensi for an event
 */
export async function getPresensiByEvent(eventId: string): Promise<PresensiWithPeserta[]> {
  return prisma.presensi.findMany({
    where: { event_id: eventId },
    include: {
      peserta: true,
    },
    orderBy: { waktu_hadir: 'desc' },
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
    where: { event_id: eventId },
  });

  const totalHadir = await prisma.peserta.count({
    where: {
      event_id: eventId,
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
    select: { status_hadir: true },
  });

  return peserta?.status_hadir || false;
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

  // Mark as attended
  await prisma.peserta.update({
    where: { id: peserta.id },
    data: { status_hadir: true },
  });

  // Create presensi record
  return prisma.presensi.create({
    data: {
      peserta_id: peserta.id,
      event_id: eventId,
      metode: 'qrcode',
    },
  });
}
