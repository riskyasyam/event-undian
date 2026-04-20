/**
 * Get Winners API Route
 * GET /api/lottery/winners/[eventId] - Get all winners for an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getWinnersByEvent } from '@/services/lottery.service';
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
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : undefined;
    const winners = await getWinnersByEvent(
      eventId,
      Number.isFinite(limit) && (limit || 0) > 0 ? limit : undefined
    );

    return NextResponse.json(successResponse(winners));
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Get winners error:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch winners', error),
      { status: 500 }
    );
  }
}
