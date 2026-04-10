/**
 * Presensi Reset API Route
 * POST /api/presensi/reset - Reset all attendance for an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/utils';

const DEFAULT_RESET_PIN = '484210';

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

    const expectedPin = process.env.RESET_PRESENSI_PIN || DEFAULT_RESET_PIN;
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
      const deletedPresensi = await tx.presensi.deleteMany({
        where: {
          event_id,
          peserta: {
            tipe: 'PESERTA',
          },
        },
      });

      const resetPeserta = await tx.peserta.updateMany({
        where: {
          event_id,
          tipe: 'PESERTA',
          status_hadir: true,
        },
        data: {
          status_hadir: false,
        },
      });

      return {
        deletedPresensi: deletedPresensi.count,
        resetPeserta: resetPeserta.count,
      };
    });

    return NextResponse.json(
      successResponse(
        {
          event_id: event.id,
          event_name: event.nama_event,
          deleted_presensi: result.deletedPresensi,
          reset_peserta: result.resetPeserta,
        },
        'Presensi berhasil direset. Peserta kembali ke status belum hadir.'
      )
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Reset presensi error:', error);
    return NextResponse.json(
      errorResponse('Failed to reset presensi', error),
      { status: 500 }
    );
  }
}