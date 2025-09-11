// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, validateDatabaseConfig } from './database-config';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Create Prisma Client with enhanced configuration for production
const createPrismaClient = () => {
  try {
    // Validate database configuration first
    validateDatabaseConfig();
    
    const databaseUrl = getDatabaseUrl();
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : process.env.NODE_ENV === 'production' 
          ? ['error'] 
          : [],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      transactionOptions: {
        timeout: 10000, // 10 seconds
        maxWait: 5000,   // 5 seconds
        isolationLevel: 'ReadCommitted',
      },
      // Enhanced error handling
      errorFormat: 'pretty',
    });
  } catch (error) {
    console.error('Failed to create Prisma Client:', error);
    throw error;
  }
};

// Lazy initialization of Prisma Client
let prismaInstance: PrismaClient | undefined;

const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    if (globalThis.__prisma) {
      prismaInstance = globalThis.__prisma;
    } else {
      prismaInstance = createPrismaClient();
      if (process.env.NODE_ENV !== 'production') {
        globalThis.__prisma = prismaInstance;
      }
    }
  }
  return prismaInstance;
};

// Export getter instead of direct instance
export const getPrisma = getPrismaClient;

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful disconnect
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
  }
}

// --- PRISMA MIDDLEWARE ---
// No middleware currently configured

// Export multiple aliases for compatibility
export const cachedPrisma = getPrismaClient();
export const prismaClient = getPrismaClient();
export const prisma = getPrismaClient();

export default getPrismaClient();
