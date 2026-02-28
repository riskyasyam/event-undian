/**
 * Prisma Client Singleton for Serverless Environment
 * 
 * This ensures we don't create multiple Prisma Client instances in development
 * due to hot reloading, and properly manages connections in serverless environments.
 * 
 * IMPORTANT: Always use the pooled DATABASE_URL in runtime.
 * DIRECT_URL is only for migrations.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper to ensure Prisma Client is properly disconnected
 * Useful for testing and graceful shutdowns
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
