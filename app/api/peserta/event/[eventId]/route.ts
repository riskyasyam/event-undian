/**
 * Get Peserta by Event API Route
 * GET /api/peserta/event/[eventId] - Get all participants for an event
 * PATCH /api/peserta/event/[eventId] - Reset failed messages to pending
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPesertaByEvent, getPesertaStats } from '@/services/peserta.service';
import { errorResponse, successResponse } from '@/lib/utils';
import { TipePeserta } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const tipe = searchParams.get('tipe') as TipePeserta | null;
    
    const participants = await getPesertaByEvent(eventId, tipe || undefined);
    const stats = await getPesertaStats(eventId, tipe || undefined);

    return NextResponse.json(
      successResponse({
        participants,
        stats,
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Get participants error:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch participants', error),
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { eventId } = await params;
    const body = await request.json();
    const { reset_failed } = body;

    if (!reset_failed) {
      return NextResponse.json(
        errorResponse('Invalid request'),
        { status: 400 }
      );
    }

    // Reset all FAILED messages to PENDING
    const result = await prisma.peserta.updateMany({
      where: {
        event_id: eventId,
        wa_status: 'FAILED',
      },
      data: {
        wa_status: 'PENDING',
        wa_error: null,
      },
    });

    return NextResponse.json(
      successResponse({
        updated: result.count,
      }, `${result.count} failed messages reset to pending`)
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Reset failed messages error:', error);
    return NextResponse.json(
      errorResponse('Failed to reset messages', error),
      { status: 500 }
    );
  }
}
