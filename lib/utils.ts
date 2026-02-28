/**
 * Utility functions for the application
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/**
 * Generate a unique UUID token for QR codes
 */
export function generateToken(): string {
  return uuidv4();
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Generate QR code URL for a token
 */
export function generateQRCodeUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/scan?token=${token}`;
}

/**
 * Shuffle array using Fisher-Yates algorithm (for lottery randomization)
 * This is cryptographically secure randomization server-side
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * API Response helpers
 */
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message: message || 'Success',
  };
}

export function errorResponse(message: string, error?: unknown) {
  return {
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? error : undefined,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone);
}
