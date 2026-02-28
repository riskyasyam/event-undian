/**
 * Prisma Configuration for Prisma 7.x
 * Database connection URLs moved here from schema.prisma
 */

import { defineConfig } from 'prisma';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
      directUrl: process.env.DIRECT_URL!,
    },
  },
});
