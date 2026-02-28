/**
 * Check Auth Session API Route
 * GET /api/auth/session
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        errorResponse('Not authenticated'),
        { status: 401 }
      );
    }

    return NextResponse.json(
      successResponse({
        adminId: session.adminId,
        username: session.username,
      })
    );
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      errorResponse('Session check failed', error),
      { status: 500 }
    );
  }
}
