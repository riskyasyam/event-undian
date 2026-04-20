/**
 * Hadiah API Route
 * GET /api/hadiah/event/[eventId] - Get all prizes for an event
 * POST /api/hadiah - Create new prize
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getHadiahWithWinnerCounts, createHadiah } from '@/services/hadiah.service';
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
    const { searchParams } = new URL(request.url);
    const imageModeParam = searchParams.get('images');
    const imageMode = imageModeParam === 'full' || imageModeParam === 'none' ? imageModeParam : 'proxy';
    const prizes = await getHadiahWithWinnerCounts(eventId, { imageMode });

    return NextResponse.json(successResponse(prizes));
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Get prizes error:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch prizes', error),
      { status: 500 }
    );
  }
}
