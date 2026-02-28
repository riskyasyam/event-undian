/**
 * Get Peserta by Event API Route
 * GET /api/peserta/event/[eventId] - Get all participants for an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPesertaByEvent, getPesertaStats } from '@/services/peserta.service';
import { errorResponse, successResponse } from '@/lib/utils';

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { eventId } = await params;
    
    const participants = await getPesertaByEvent(eventId);
    const stats = await getPesertaStats(eventId);

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
