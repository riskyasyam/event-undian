/**
 * Hadiah Service - Business logic for prize management
 */

import { prisma } from '@/lib/prisma';
import { Hadiah, TipePeserta, KecepatanUndian } from '@prisma/client';

export interface CreateHadiahInput {
  event_id: string;
  nama_hadiah: string;
  deskripsi?: string;
  gambar_url?: string;
  jumlah_pemenang: number;
  urutan?: number;
  tipe_peserta?: TipePeserta;
  kecepatan_undian?: KecepatanUndian;
  mode_undian?: 'SATU' | 'SEMUA';
}

export interface UpdateHadiahInput {
  nama_hadiah?: string;
  deskripsi?: string;
  gambar_url?: string;
  jumlah_pemenang?: number;
  urutan?: number;
  tipe_peserta?: TipePeserta;
  kecepatan_undian?: KecepatanUndian;
  mode_undian?: 'SATU' | 'SEMUA';
}

export interface GetHadiahOptions {
  imageMode?: 'full' | 'proxy' | 'none';
}

/**
 * Create a new prize
 */
export async function createHadiah(data: CreateHadiahInput): Promise<Hadiah> {
  return prisma.hadiah.create({
    data,
  });
}

/**
 * Get all prizes for an event
 */
export async function getHadiahByEvent(eventId: string): Promise<Hadiah[]> {
  return prisma.hadiah.findMany({
    where: { event_id: eventId },
    orderBy: { urutan: 'asc' },
  });
}

/**
 * Get prize by ID
 */
export async function getHadiahById(id: string): Promise<Hadiah | null> {
  return prisma.hadiah.findUnique({
    where: { id },
  });
}

/**
 * Get prize with winner information
 */
export async function getHadiahWithWinners(id: string) {
  return prisma.hadiah.findUnique({
    where: { id },
    include: {
      pemenang: {
        include: {
          peserta: true,
        },
        orderBy: {
          drawn_at: 'desc',
        },
      },
      event: true,
    },
  });
}

/**
 * Get all prizes with winner counts for an event
 */
export async function getHadiahWithWinnerCounts(eventId: string, options: GetHadiahOptions = {}) {
  const imageMode = options.imageMode || 'proxy';

  const prizes = await prisma.hadiah.findMany({
    where: { event_id: eventId },
    select: {
      id: true,
      event_id: true,
      nama_hadiah: true,
      deskripsi: true,
      jumlah_pemenang: true,
      urutan: true,
      tipe_peserta: true,
      kecepatan_undian: true,
      mode_undian: true,
      created_at: true,
      updated_at: true,
      ...(imageMode === 'full' ? { gambar_url: true } : {}),
    },
    orderBy: { urutan: 'asc' },
  });

  if (prizes.length === 0) {
    return [];
  }

  const prizeIdsWithImage =
    imageMode === 'proxy'
      ? new Set(
          (
            await prisma.hadiah.findMany({
              where: {
                event_id: eventId,
                NOT: { gambar_url: null },
              },
              select: { id: true },
            })
          ).map((item) => item.id)
        )
      : null;

  const prizeIds = prizes.map((prize) => prize.id);
  const winnerCounts = await prisma.pemenang.groupBy({
    by: ['hadiah_id'],
    where: {
      hadiah_id: {
        in: prizeIds,
      },
    },
    _count: {
      _all: true,
    },
  });

  const winnerCountMap = new Map(
    winnerCounts.map((item) => [item.hadiah_id, item._count._all])
  );

  return prizes.map((prize) => {
    const winnersDrawn = winnerCountMap.get(prize.id) ?? 0;
    const mappedImageUrl =
      imageMode === 'none'
        ? null
        : imageMode === 'proxy'
          ? (prizeIdsWithImage?.has(prize.id) ? `/api/hadiah/${prize.id}/image` : null)
          : ('gambar_url' in prize ? prize.gambar_url : null);

    return {
      ...prize,
      gambar_url: mappedImageUrl,
      winnersDrawn,
      remainingSlots: prize.jumlah_pemenang - winnersDrawn,
      isComplete: winnersDrawn >= prize.jumlah_pemenang,
    };
  });
}

/**
 * Update prize
 */
export async function updateHadiah(id: string, data: UpdateHadiahInput): Promise<Hadiah> {
  return prisma.hadiah.update({
    where: { id },
    data,
  });
}

/**
 * Delete prize
 */
export async function deleteHadiah(id: string): Promise<Hadiah> {
  return prisma.hadiah.delete({
    where: { id },
  });
}

/**
 * Check if prize has remaining slots for winners
 */
export async function hasPrizeRemainingSlots(hadiahId: string): Promise<boolean> {
  const hadiah = await prisma.hadiah.findUnique({
    where: { id: hadiahId },
    include: {
      _count: {
        select: {
          pemenang: true,
        },
      },
    },
  });

  if (!hadiah) {
    return false;
  }

  return hadiah._count.pemenang < hadiah.jumlah_pemenang;
}

/**
 * Get remaining slots for a prize
 */
export async function getPrizeRemainingSlots(hadiahId: string): Promise<number> {
  const hadiah = await prisma.hadiah.findUnique({
    where: { id: hadiahId },
    include: {
      _count: {
        select: {
          pemenang: true,
        },
      },
    },
  });

  if (!hadiah) {
    return 0;
  }

  return Math.max(0, hadiah.jumlah_pemenang - hadiah._count.pemenang);
}
