/**
 * Admin Logout API Route
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

export async function POST() {
  try {
    await clearSession();

    return NextResponse.json(
      successResponse(null, 'Logout successful')
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      errorResponse('Logout failed', error),
      { status: 500 }
    );
  }
}
