/**
 * Lottery Reset API Route
 * POST /api/lottery/reset - Reset all lottery winners for an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resetLotteryForEvent } from '@/services/lottery.service';
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

    const expectedPin = process.env.RESET_LOTTERY_PIN || DEFAULT_RESET_PIN;
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

    const resetSuccess = await resetLotteryForEvent(event_id);

    if (!resetSuccess) {
      return NextResponse.json(
        errorResponse('Failed to reset lottery'),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse(
        { event_id: event.id, event_name: event.nama_event },
        'Undian berhasil direset. Semua peserta bisa diundi kembali.'
      )
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Reset lottery error:', error);
    return NextResponse.json(
      errorResponse('Failed to reset lottery', error),
      { status: 500 }
    );
  }
}