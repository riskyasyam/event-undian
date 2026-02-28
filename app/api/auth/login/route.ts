/**
 * Admin Login API Route
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin } from '@/services/admin.service';
import { createSession, setSessionCookie } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        errorResponse('Username and password are required'),
        { status: 400 }
      );
    }

    const result = await loginAdmin({ username, password });

    if (!result.success || !result.admin) {
      return NextResponse.json(
        errorResponse(result.message),
        { status: 401 }
      );
    }

    // Create session token
    const token = await createSession(result.admin.id, result.admin.username);

    // Set session cookie
    await setSessionCookie(token);

    return NextResponse.json(
      successResponse(
        {
          admin: {
            id: result.admin.id,
            username: result.admin.username,
            nama: result.admin.nama,
          },
        },
        'Login successful'
      )
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      errorResponse('Login failed', error),
      { status: 500 }
    );
  }
}
