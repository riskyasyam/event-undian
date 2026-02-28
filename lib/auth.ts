/**
 * Authentication utilities for admin session management
 * Using cookie-based sessions for simplicity in serverless environment
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds
const SESSION_COOKIE_NAME = 'admin_session';

interface SessionPayload {
  adminId: string;
  username: string;
  exp: number;
}

/**
 * Create a JWT token for admin session
 */
export async function createSession(adminId: string, username: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
  
  const token = await new SignJWT({ adminId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Date.now() / 1000 + SESSION_DURATION)
    .sign(secret);
  
  return token;
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      adminId: payload.adminId as string,
      username: payload.username as string,
      exp: payload.exp as number,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

/**
 * Get session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return verifySession(token);
}

/**
 * Clear session cookie (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Require authentication - use in server components or API routes
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}
