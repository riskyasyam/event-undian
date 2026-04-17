/**
 * Presensi Mark All API Route
 * POST /api/presensi/mark-all - Mark all PESERTA in event as attended manually
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/utils';

const DEFAULT_MARK_ALL_PIN = '484210';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { event_id, pin } = body;

    if (!event_id) {
      return NextResponse.json(
        errorResponse('event_id is required'),
        { status: 400 }
      );
    }

    if (!pin) {
      return NextResponse.json(
        errorResponse('PIN is required'),
        { status: 400 }
      );
    }

    const expectedPin = process.env.MARK_ALL_PRESENSI_PIN || process.env.RESET_PRESENSI_PIN || DEFAULT_MARK_ALL_PIN;
    if (pin !== expectedPin) {
      return NextResponse.json(
        errorResponse('PIN tidak valid'),
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: { id: true, nama_event: true },
    });

    if (!event) {
      return NextResponse.json(
        errorResponse('Event not found'),
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const pesertaList = await tx.peserta.findMany({
        where: {
          event_id,
          tipe: 'PESERTA',
        },
        select: {
          id: true,
        },
      });

      const pesertaIds = pesertaList.map((peserta) => peserta.id);

      if (pesertaIds.length === 0) {
        return {
          totalPeserta: 0,
          createdPresensi: 0,
          updatedMetode: 0,
          markedHadir: 0,
        };
      }

      const existingPresensi = await tx.presensi.findMany({
        where: {
          event_id,
          peserta_id: {
            in: pesertaIds,
          },
        },
        select: {
          peserta_id: true,
        },
      });

      const existingPesertaIds = new Set(existingPresensi.map((item) => item.peserta_id));
      const missingPesertaIds = pesertaIds.filter((id) => !existingPesertaIds.has(id));

      if (missingPesertaIds.length > 0) {
        await tx.presensi.createMany({
          data: missingPesertaIds.map((pesertaId) => ({
            peserta_id: pesertaId,
            event_id,
            metode: 'manual',
          })),
        });
      }

      const updatedMetode = await tx.presensi.updateMany({
        where: {
          event_id,
          peserta_id: {
            in: pesertaIds,
          },
        },
        data: {
          metode: 'manual',
        },
      });

      const markedHadir = await tx.peserta.updateMany({
        where: {
          event_id,
          tipe: 'PESERTA',
          status_hadir: false,
        },
        data: {
          status_hadir: true,
        },
      });

      return {
        totalPeserta: pesertaIds.length,
        createdPresensi: missingPesertaIds.length,
        updatedMetode: updatedMetode.count,
        markedHadir: markedHadir.count,
      };
    });

    return NextResponse.json(
      successResponse(
        {
          event_id: event.id,
          event_name: event.nama_event,
          total_peserta: result.totalPeserta,
          created_presensi: result.createdPresensi,
          updated_metode: result.updatedMetode,
          marked_hadir: result.markedHadir,
        },
        'Semua peserta berhasil dipresensikan manual.'
      )
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Mark all presensi error:', error);
    return NextResponse.json(
      errorResponse('Failed to mark all presensi', error),
      { status: 500 }
    );
  }
}
