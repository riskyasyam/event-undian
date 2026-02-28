/**
 * Hadiah Service - Business logic for prize management
 */

import { prisma } from '@/lib/prisma';
import { Hadiah } from '@prisma/client';

export interface CreateHadiahInput {
  event_id: string;
  nama_hadiah: string;
  deskripsi?: string;
  gambar_url?: string;
  jumlah_pemenang: number;
  urutan?: number;
}

export interface UpdateHadiahInput {
  nama_hadiah?: string;
  deskripsi?: string;
  gambar_url?: string;
  jumlah_pemenang?: number;
  urutan?: number;
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
export async function getHadiahWithWinnerCounts(eventId: string) {
  const prizes = await prisma.hadiah.findMany({
    where: { event_id: eventId },
    include: {
      _count: {
        select: {
          pemenang: true,
        },
      },
    },
    orderBy: { urutan: 'asc' },
  });

  return prizes.map((prize) => ({
    ...prize,
    winnersDrawn: prize._count.pemenang,
    remainingSlots: prize.jumlah_pemenang - prize._count.pemenang,
    isComplete: prize._count.pemenang >= prize.jumlah_pemenang,
  }));
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
