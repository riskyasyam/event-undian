/**
 * Lottery Draw API Route
 * POST /api/lottery/draw - Draw winners for a prize
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { drawLottery } from '@/services/lottery.service';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { hadiah_id, peserta_id } = body;

    if (!hadiah_id) {
      return NextResponse.json(
        errorResponse('hadiah_id is required'),
        { status: 400 }
      );
    }

    // Draw lottery (server-side randomization with transaction)
    // If peserta_id provided, use that specific participant (from wheel)
    const result = await drawLottery({ hadiah_id, peserta_id });

    if (!result.success) {
      return NextResponse.json(
        errorResponse(result.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      successResponse(
        {
          winners: result.winners,
          count: result.winners.length,
        },
        result.message
      )
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Lottery draw error:', error);
    return NextResponse.json(
      errorResponse('Failed to draw lottery', error),
      { status: 500 }
    );
  }
}
