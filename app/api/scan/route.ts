/**
 * QR Code Scan API Route (PUBLIC)
 * POST /api/scan - Process QR code scan
 */

import { NextRequest, NextResponse } from 'next/server';
import { processScan } from '@/services/scan.service';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        errorResponse('Token is required'),
        { status: 400 }
      );
    }

    const result = await processScan(token);

    if (!result.success) {
      return NextResponse.json(
        errorResponse(result.message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      successResponse(result.peserta, result.message)
    );
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      errorResponse('Failed to process scan', error),
      { status: 500 }
    );
  }
}
