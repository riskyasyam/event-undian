/**
 * Lottery Service - Business logic for lottery/drawing system
 * 
 * CRITICAL: All lottery operations use Prisma transactions to prevent:
 * - Race conditions
 * - Double winner selection
 * - Inconsistent database state
 * 
 * Lottery process:
 * 1. Get eligible participants:
 *    - JAMAAH: sudah_menang = false (no presensi required)
 *    - PESERTA: status_hadir = true AND sudah_menang = false
 * 2. Randomize server-side (NEVER on client)
 * 3. Select winners based on jumlah_pemenang
 * 4. Within transaction:
 *    - Create Pemenang records
 *    - Update Peserta.sudah_menang = true
 * 5. Return winners
 */

import { prisma } from '@/lib/prisma';
import { shuffleArray } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

export interface DrawLotteryInput {
  hadiah_id: string;
  peserta_id?: string; // Optional: specific participant from wheel
}

export interface DrawLotteryResult {
  success: boolean;
  winners: Array<{
    id: string;
    kode_unik: string;
    nama: string;
    nomor_telepon: string;
    alamat: string;
    pemenang: {
      id: string;
      peserta_id: string;
      hadiah_id: string;
      drawn_at: Date;
      created_at: Date;
    };
  }>;
  message: string;
}

/**
 * Draw lottery for a specific prize
 * Uses transaction to ensure atomicity and prevent duplicate winners
 * If peserta_id is provided, use that specific participant (from wheel selection)
 */
export async function drawLottery(input: DrawLotteryInput): Promise<DrawLotteryResult> {
  const { hadiah_id, peserta_id } = input;

  try {
    // Use Prisma transaction for atomic operation
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Get prize details
      const hadiah = await tx.hadiah.findUnique({
        where: { id: hadiah_id },
        include: {
          event: true,
          _count: {
            select: {
              pemenang: true,
            },
          },
        },
      });

      if (!hadiah) {
        throw new Error('Prize not found');
      }

      // Check if prize already has all winners
      const remainingSlots = hadiah.jumlah_pemenang - hadiah._count.pemenang;
      if (remainingSlots <= 0) {
        throw new Error('All winners have been drawn for this prize');
      }

      let selectedWinners;

      // If specific peserta_id provided (from slot), use it
      if (peserta_id) {
        const peserta = await tx.peserta.findUnique({
          where: { id: peserta_id },
        });

        if (!peserta) {
          throw new Error('Participant not found');
        }

        // JAMAAH tidak perlu presensi, PESERTA perlu presensi
        if (hadiah.tipe_peserta !== 'JAMAAH' && !peserta.status_hadir) {
          throw new Error('Participant has not attended the event');
        }

        if (peserta.sudah_menang) {
          throw new Error('Participant has already won');
        }

        if (peserta.event_id !== hadiah.event_id) {
          throw new Error('Participant is not registered for this event');
        }

        // Validate participant type matches prize type
        if (peserta.tipe !== hadiah.tipe_peserta) {
          throw new Error(`Participant type (${peserta.tipe}) does not match prize type (${hadiah.tipe_peserta})`);
        }

        selectedWinners = [peserta];
      } else {
        // 2. Get eligible participants
        // JAMAAH: Tidak perlu status_hadir (no presensi requirement)
        // PESERTA: Harus status_hadir = true DAN belum menang
        const whereCondition: any = {
          event_id: hadiah.event_id,
          sudah_menang: false,
          tipe: hadiah.tipe_peserta,
        };
        
        // Hanya PESERTA yang perlu presensi
        if (hadiah.tipe_peserta !== 'JAMAAH') {
          whereCondition.status_hadir = true;
        }
        
        const eligiblePeserta = await tx.peserta.findMany({
          where: whereCondition,
        });

        // Check if enough eligible participants
        if (eligiblePeserta.length === 0) {
          throw new Error('No eligible participants found');
        }

        if (eligiblePeserta.length < remainingSlots) {
          throw new Error(
            `Not enough eligible participants. Need ${remainingSlots}, but only ${eligiblePeserta.length} available`
          );
        }

        // 3. Randomize and select winners (SERVER-SIDE ONLY)
        const shuffled = shuffleArray(eligiblePeserta);
        selectedWinners = shuffled.slice(0, remainingSlots);
      }

      // 4. Create winner records and update participants
      const winners = [];
      for (const peserta of selectedWinners) {
        // Create Pemenang record
        const pemenang = await tx.pemenang.create({
          data: {
            peserta_id: peserta.id,
            hadiah_id: hadiah_id,
          },
        });

        // Update Peserta.sudah_menang
        const updatedPeserta = await tx.peserta.update({
          where: { id: peserta.id },
          data: { sudah_menang: true },
        });

        winners.push({
          ...updatedPeserta,
          pemenang,
        });
      }

      return winners;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return {
      success: true,
      winners: result,
      message: `Successfully drew ${result.length} winner(s)`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to draw lottery';
    return {
      success: false,
      winners: [],
      message,
    };
  }
}

/**
 * Get all winners for a prize
 */
export async function getWinnersByHadiah(hadiahId: string) {
  return prisma.pemenang.findMany({
    where: { hadiah_id: hadiahId },
    include: {
      peserta: true,
      hadiah: true,
    },
    orderBy: { drawn_at: 'desc' },
  });
}

/**
 * Get all winners for an event
 */
export async function getWinnersByEvent(eventId: string, limit?: number) {
  return prisma.pemenang.findMany({
    where: {
      hadiah: {
        event_id: eventId,
      },
    },
    select: {
      id: true,
      drawn_at: true,
      peserta: {
        select: {
          id: true,
          kode_unik: true,
          nama: true,
          tipe: true,
          nomor_telepon: true,
          alamat: true,
        },
      },
      hadiah: {
        select: {
          nama_hadiah: true,
          tipe_peserta: true,
        },
      },
    },
    orderBy: { drawn_at: 'desc' },
    ...(typeof limit === 'number' && limit > 0 ? { take: limit } : {}),
  });
}

/**
 * Get winner by participant ID
 */
export async function getWinnerByPeserta(pesertaId: string) {
  return prisma.pemenang.findUnique({
    where: { peserta_id: pesertaId },
    include: {
      peserta: true,
      hadiah: true,
    },
  });
}

/**
 * Delete a winner (undo lottery draw)
 * Uses transaction to ensure consistency
 */
export async function deleteWinner(pemenangId: string): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get winner details
      const pemenang = await tx.pemenang.findUnique({
        where: { id: pemenangId },
      });

      if (!pemenang) {
        throw new Error('Winner not found');
      }

      // Delete winner record
      await tx.pemenang.delete({
        where: { id: pemenangId },
      });

      // Reset participant's sudah_menang flag
      await tx.peserta.update({
        where: { id: pemenang.peserta_id },
        data: { sudah_menang: false },
      });
    });

    return true;
  } catch (error) {
    console.error('Failed to delete winner:', error);
    return false;
  }
}

/**
 * Reset all lottery results for an event
 * WARNING: This deletes all winners and resets all sudah_menang flags
 */
export async function resetLotteryForEvent(eventId: string): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete all winners for this event
      await tx.pemenang.deleteMany({
        where: {
          hadiah: {
            event_id: eventId,
          },
        },
      });

      // Reset all sudah_menang flags
      await tx.peserta.updateMany({
        where: { event_id: eventId },
        data: { sudah_menang: false },
      });
    });

    return true;
  } catch (error) {
    console.error('Failed to reset lottery:', error);
    return false;
  }
}

/**
 * Reset lottery results for a specific prize
 * WARNING: This deletes winners for the prize and resets peserta.sudah_menang for those winners
 */
export async function resetLotteryForPrize(hadiahId: string): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const winners = await tx.pemenang.findMany({
        where: { hadiah_id: hadiahId },
        select: { peserta_id: true },
      });

      await tx.pemenang.deleteMany({
        where: { hadiah_id: hadiahId },
      });

      const pesertaIds = [...new Set(winners.map((winner) => winner.peserta_id))];
      if (pesertaIds.length > 0) {
        await tx.peserta.updateMany({
          where: { id: { in: pesertaIds } },
          data: { sudah_menang: false },
        });
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to reset prize lottery:', error);
    return false;
  }
}

/**
 * Get lottery statistics for an event
 */
export async function getLotteryStats(eventId: string) {
  const totalPrizes = await prisma.hadiah.count({
    where: { event_id: eventId },
  });

  const totalWinnerSlots = await prisma.hadiah.aggregate({
    where: { event_id: eventId },
    _sum: {
      jumlah_pemenang: true,
    },
  });

  const totalWinnersDrawn = await prisma.pemenang.count({
    where: {
      hadiah: {
        event_id: eventId,
      },
    },
  });

  const eligibleParticipants = await prisma.peserta.count({
    where: {
      event_id: eventId,
      status_hadir: true,
      sudah_menang: false,
    },
  });

  return {
    totalPrizes,
    totalWinnerSlots: totalWinnerSlots._sum.jumlah_pemenang || 0,
    totalWinnersDrawn,
    eligibleParticipants,
  };
}
