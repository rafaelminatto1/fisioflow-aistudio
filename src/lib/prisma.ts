// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __globalPrisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as {
  __globalPrisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.__globalPrisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : [],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__globalPrisma = prisma;
}

// --- PRISMA MIDDLEWARE ---
// No middleware currently configured

export default prisma;
