/**
 * Next.js Middleware
 * Protects admin routes from unauthorized access
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

const SESSION_COOKIE_NAME = 'admin_session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if accessing admin routes (except login)
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const session = await verifySession(token);

    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Redirect authenticated users away from login page
  if (path === '/admin/login') {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const session = await verifySession(token);

      if (session) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
