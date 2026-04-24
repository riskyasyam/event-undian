/**
 * Peserta Service - Business logic for participant management
 */

import { prisma } from '@/lib/prisma';
import { Peserta, Prisma, TipePeserta } from '@prisma/client';
import { generateToken } from '@/lib/utils';

// Type for Peserta with Event relation
export type PesertaWithEvent = Prisma.PesertaGetPayload<{
  include: {
    event: true;
  };
}>;

export interface CreatePesertaInput {
  event_id: string;
  nama: string;
  nomor_telepon: string;
  alamat: string;
  tipe?: TipePeserta;
}

export interface BulkCreatePesertaInput {
  event_id: string;
  participants: Array<{
    nama: string;
    nomor_telepon: string;
    alamat: string;
  }>;
  tipe?: TipePeserta;
}

export interface GetPesertaByEventOptions {
  tipe?: TipePeserta;
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: 'all' | 'attended' | 'eligible';
}

/**
 * Get current max numeric suffix from kode_unik (MU-001 -> 1)
 */
async function getMaxKodeUnikNumber(): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ max_number: number | null }>>`
    SELECT MAX(CAST(SUBSTRING(kode_unik FROM 4) AS INTEGER)) AS max_number
    FROM "peserta"
    WHERE kode_unik ~ '^MU-[0-9]+$'
  `;

  return Number(result[0]?.max_number ?? 0);
}

/**
 * Generate next unique code for participant (e.g., MU-001, MU-002)
 */
async function generateKodeUnik(): Promise<string> {
  const nextNumber = (await getMaxKodeUnikNumber()) + 1;
  return `MU-${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Detect Prisma unique constraint on kode_unik
 */
function isKodeUnikConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== 'P2002') return false;

  const target = (error.meta as { target?: string[] } | undefined)?.target;
  return Array.isArray(target) && target.includes('kode_unik');
}

/**
 * Create a single participant with auto-generated token and unique code
 */
export async function createPeserta(data: CreatePesertaInput): Promise<Peserta> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const kode_unik = await generateKodeUnik();

    try {
      return await prisma.peserta.create({
        data: {
          ...data,
          kode_unik,
          token: generateToken(),
        },
      });
    } catch (error) {
      if (isKodeUnikConflict(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Gagal membuat kode unik peserta setelah beberapa percobaan');
}

/**
 * Bulk create participants from Excel upload
 * Each participant gets a unique UUID token and sequential code (MU-001, MU-002, etc.)
 */
export async function bulkCreatePeserta(data: BulkCreatePesertaInput): Promise<number> {
  // Start from current global maximum to avoid collisions after deletions
  let nextNumber = (await getMaxKodeUnikNumber()) + 1;

  // Create participants one by one to keep deterministic code assignment
  let createdCount = 0;
  for (let i = 0; i < data.participants.length; i++) {
    const participant = data.participants[i];

    let created = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      const kode_unik = `MU-${nextNumber.toString().padStart(3, '0')}`;

      try {
        await prisma.peserta.create({
          data: {
            event_id: data.event_id,
            nama: participant.nama,
            nomor_telepon: participant.nomor_telepon,
            alamat: participant.alamat,
            tipe: data.tipe || TipePeserta.PESERTA,
            kode_unik,
            token: generateToken(),
          },
        });

        createdCount++;
        nextNumber++;
        created = true;
        break;
      } catch (error) {
        if (isKodeUnikConflict(error)) {
          nextNumber = (await getMaxKodeUnikNumber()) + 1;
          continue;
        }
        throw error;
      }
    }

    if (!created) {
      throw new Error(`Gagal membuat kode unik peserta untuk ${participant.nama}`);
    }
  }

  return createdCount;
}

/**
 * Get participants for an event with pagination and optional filtering
 */
export async function getPesertaByEvent(
  eventId: string,
  options: GetPesertaByEventOptions = {}
): Promise<{ participants: Peserta[]; total: number; page: number; pageSize: number }> {
  const {
    tipe,
    page = 1,
    pageSize = 10,
    search,
    filter = 'all',
  } = options;

  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const skip = (safePage - 1) * safePageSize;

  const where: Prisma.PesertaWhereInput = {
    event_id: eventId,
    ...(tipe && { tipe }),
  };

  if (filter === 'attended') {
    where.status_hadir = true;
  }

  if (filter === 'eligible') {
    where.status_hadir = true;
    where.sudah_menang = false;
  }

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    where.OR = [
      { nama: { contains: trimmedSearch, mode: 'insensitive' } },
      { kode_unik: { contains: trimmedSearch, mode: 'insensitive' } },
      { nomor_telepon: { contains: trimmedSearch } },
      { alamat: { contains: trimmedSearch, mode: 'insensitive' } },
    ];
  }

  const [participants, total] = await Promise.all([
    prisma.peserta.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: safePageSize,
    }),
    prisma.peserta.count({ where }),
  ]);

  return {
    participants,
    total,
    page: safePage,
    pageSize: safePageSize,
  };
}

/**
 * Get participant by ID
 */
export async function getPesertaById(id: string): Promise<Peserta | null> {
  return prisma.peserta.findUnique({
    where: { id },
    include: {
      event: true,
      pemenang: {
        include: {
          hadiah: true,
        },
      },
    },
  });
}

/**
 * Get participant by token
 */
export async function getPesertaByToken(token: string): Promise<PesertaWithEvent | null> {
  return prisma.peserta.findUnique({
    where: { token },
    include: {
      event: true,
    },
  });
}

/**
 * Get participant by kode_unik
 */
export async function getPesertaByKode(kode_unik: string): Promise<PesertaWithEvent | null> {
  return prisma.peserta.findUnique({
    where: { kode_unik },
    include: {
      event: true,
    },
  });
}

/**
 * Mark participant as attended (when QR is scanned)
 */
export async function markAttendance(token: string): Promise<Peserta> {
  return prisma.peserta.update({
    where: { token },
    data: { status_hadir: true },
  });
}

/**
 * Get attended participants for an event (eligible for lottery)
 */
export async function getAttendedPeserta(eventId: string): Promise<Peserta[]> {
  return prisma.peserta.findMany({
    where: {
      event_id: eventId,
      status_hadir: true,
    },
  });
}

/**
 * Get eligible participants for lottery (attended and not won yet)
 */
export async function getEligiblePeserta(eventId: string, tipe?: TipePeserta): Promise<Peserta[]> {
  return prisma.peserta.findMany({
    where: {
      event_id: eventId,
      status_hadir: true,
      sudah_menang: false,
      ...(tipe && { tipe }),
    },
  });
}

/**
 * Update participant
 */
export async function updatePeserta(
  id: string,
  data: Partial<CreatePesertaInput>
): Promise<Peserta> {
  return prisma.peserta.update({
    where: { id },
    data,
  });
}

/**
 * Delete participant
 */
export async function deletePeserta(id: string): Promise<Peserta> {
  return prisma.peserta.delete({
    where: { id },
  });
}

/**
 * Get participant statistics for an event
 */
export async function getPesertaStats(eventId: string, tipe?: TipePeserta) {
  const tipeFilter = tipe ? Prisma.sql`AND tipe = ${tipe}::"TipePeserta"` : Prisma.empty;

  const result = await prisma.$queryRaw<Array<{
    total: number;
    attended: number;
    winners: number;
    eligible: number;
  }>>(Prisma.sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status_hadir = true)::int AS attended,
      COUNT(*) FILTER (WHERE sudah_menang = true)::int AS winners,
      COUNT(*) FILTER (WHERE status_hadir = true AND sudah_menang = false)::int AS eligible
    FROM "peserta"
    WHERE event_id = ${eventId}
    ${tipeFilter}
  `);

  return result[0] ?? {
    total: 0,
    attended: 0,
    winners: 0,
    eligible: 0,
  };
}

/**
 * Delete all participants for an event
 */
export async function deleteAllPesertaByEvent(eventId: string, tipe?: TipePeserta): Promise<number> {
  const result = await prisma.peserta.deleteMany({
    where: {
      event_id: eventId,
      ...(tipe && { tipe }),
    },
  });

  return result.count;
}
