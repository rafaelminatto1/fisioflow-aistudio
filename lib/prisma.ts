import { PrismaClient } from '@prisma/client'
import { queryCache, CachePatterns } from './cache'
import edgeLogger from './edge-logger'
import crypto from 'crypto'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  cachedPrisma: CachedPrismaClient | undefined
}

// Interface para queries cacheadas
interface CacheableQuery {
  model: string;
  operation: string;
  args: any;
  ttl?: number;
  tags?: string[];
}

// Wrapper para Prisma com cache inteligente
class CachedPrismaClient {
  private prisma: PrismaClient;
  private defaultTTL = 300; // 5 minutes
  private queryStats = {
    total: 0,
    cached: 0,
    fresh: 0,
  };

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  // Create proxy for all Prisma models with caching
  private createCachedProxy() {
    return new Proxy(this.prisma, {
      get: (target: any, model: string) => {
        if (typeof target[model] === 'object' && target[model] !== null) {
          return this.createModelProxy(target[model], model as string);
        }
        return target[model];
      }
    });
  }

  private createModelProxy(modelClient: any, modelName: string) {
    return new Proxy(modelClient, {
      get: (target: any, operation: string) => {
        if (this.isCacheableOperation(operation as string)) {
          return this.createCachedOperation(target, modelName, operation as string);
        }
        return target[operation];
      }
    });
  }

  private isCacheableOperation(operation: string): boolean {
    const readOperations = [
      'findFirst', 'findFirstOrThrow', 'findMany', 'findUnique', 
      'findUniqueOrThrow', 'count', 'aggregate', 'groupBy'
    ];
    return readOperations.includes(operation);
  }

  private createCachedOperation(target: any, modelName: string, operation: string) {
    return async (args: any = {}) => {
      this.queryStats.total++;
      
      // Generate cache key from query
      const cacheKey = this.generateCacheKey(modelName, operation, args);
      const cacheTags = this.generateCacheTags(modelName, operation, args);
      
      // Try to get from cache first
      const cached = await queryCache.get(cacheKey, {
        tags: cacheTags,
        layer: 'both'
      });
      
      if (cached !== null) {
        this.queryStats.cached++;
        edgeLogger.debug('Query served from cache', {
          model: modelName,
          operation,
          cacheKey
        });
        return cached;
      }
      
      // Execute fresh query
      const startTime = Date.now();
      const result = await target[operation](args);
      const queryTime = Date.now() - startTime;
      
      this.queryStats.fresh++;
      
      // Determine TTL based on operation and model
      const ttl = this.determineTTL(modelName, operation, args);
      
      // Cache the result
      await queryCache.set(cacheKey, result, {
        ttl,
        tags: cacheTags,
        layer: 'both',
        compress: this.shouldCompress(result)
      });
      
      edgeLogger.debug('Query executed and cached', {
        model: modelName,
        operation,
        queryTime,
        ttl,
        cacheKey
      });
      
      return result;
    };
  }

  private generateCacheKey(model: string, operation: string, args: any): string {
    const argsString = JSON.stringify(args, Object.keys(args).sort());
    const hash = crypto.createHash('md5').update(argsString).digest('hex');
    return `query:${model}:${operation}:${hash}`;
  }

  private generateCacheTags(model: string, operation: string, args: any): string[] {
    const tags = [`model:${model}`, `operation:${operation}`];
    
    // Add specific tags based on query parameters
    if (args.where) {
      if (args.where.id) {
        tags.push(`${model}:${args.where.id}`);
      }
      if (args.where.userId) {
        tags.push(`user:${args.where.userId}`);
      }
    }
    
    return tags;
  }

  private determineTTL(model: string, operation: string, args: any): number {
    // Different TTL strategies based on data type
    const modelTTLs: Record<string, number> = {
      User: 1800,        // 30 minutes - user data changes less frequently
      Patient: 900,      // 15 minutes - patient data changes moderately  
      Appointment: 300,  // 5 minutes - appointments change frequently
      Report: 3600,      // 1 hour - reports are mostly static
      Analytics: 600,    // 10 minutes - analytics need regular updates
    };
    
    // Operation-specific TTL adjustments
    const operationMultipliers: Record<string, number> = {
      count: 2,          // Count queries can be cached longer
      aggregate: 2,      // Aggregations can be cached longer
      findMany: 1,       // List queries use base TTL
      findUnique: 1.5,   // Single records can be cached a bit longer
    };
    
    const baseTTL = modelTTLs[model] || this.defaultTTL;
    const multiplier = operationMultipliers[operation] || 1;
    
    return Math.floor(baseTTL * multiplier);
  }

  private shouldCompress(result: any): boolean {
    const serialized = JSON.stringify(result);
    return serialized.length > 1024; // Compress if larger than 1KB
  }

  // Invalidation methods
  async invalidateModel(modelName: string): Promise<void> {
    await queryCache.invalidateTag(`model:${modelName}`);
    edgeLogger.info('Model cache invalidated', { model: modelName });
  }

  async invalidateRecord(modelName: string, id: string): Promise<void> {
    await queryCache.invalidateTag(`${modelName}:${id}`);
    edgeLogger.info('Record cache invalidated', { model: modelName, id });
  }

  async invalidateUser(userId: string): Promise<void> {
    await queryCache.invalidateTag(`user:${userId}`);
    edgeLogger.info('User cache invalidated', { userId });
  }

  // Stats and monitoring
  getQueryStats() {
    const hitRate = this.queryStats.total > 0 
      ? (this.queryStats.cached / this.queryStats.total) * 100 
      : 0;
    
    return {
      ...this.queryStats,
      hitRate: parseFloat(hitRate.toFixed(2))
    };
  }

  // Direct Prisma access for non-cacheable operations
  get direct(): PrismaClient {
    return this.prisma;
  }

  // Proxy all Prisma methods
  get client() {
    return this.createCachedProxy();
  }

  // Prisma transaction support
  async $transaction<T>(queries: any[]): Promise<any> {
    // Transactions bypass cache for consistency
    return this.prisma.$transaction(queries);
  }

  // Other Prisma methods
  async $disconnect(): Promise<void> {
    return this.prisma.$disconnect();
  }

  async $connect(): Promise<void> {
    return this.prisma.$connect();
  }

  $executeRaw(query: any): any {
    return this.prisma.$executeRaw(query);
  }

  $queryRaw(query: any): any {
    return this.prisma.$queryRaw(query);
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Cached Prisma client
export const cachedPrisma = 
  globalForPrisma.cachedPrisma ??
  new CachedPrismaClient(prisma)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.cachedPrisma = cachedPrisma
}

// Connection pooling configuration for Neon DB - Enhanced
export const prismaWithPool = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Cached version with connection pooling
export const cachedPrismaWithPool = new CachedPrismaClient(prismaWithPool)

// Enhanced graceful shutdown - only in Node.js runtime, not Edge Runtime
if (typeof process !== 'undefined' && process.on) {
  const gracefulShutdown = async (signal: string) => {
    edgeLogger.info(`Received ${signal}, starting graceful shutdown`);
    
    try {
      // Log final cache stats
      const queryStats = cachedPrisma.getQueryStats();
      const cacheStats = await queryCache.getMetrics();
      
      edgeLogger.info('Final cache statistics', {
        queryStats,
        cacheStats
      });
      
      // Disconnect Prisma clients
      await prisma.$disconnect();
      await prismaWithPool.$disconnect();
      await cachedPrisma.$disconnect();
      await cachedPrismaWithPool.$disconnect();
      
      edgeLogger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      edgeLogger.error('Error during graceful shutdown', error as Error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

// Cache management utilities
export const PrismaCache = {
  // Model-level invalidation
  async invalidatePatients(): Promise<void> {
    await cachedPrisma.invalidateModel('Patient');
  },
  
  async invalidateAppointments(): Promise<void> {
    await cachedPrisma.invalidateModel('Appointment');
  },
  
  async invalidateReports(): Promise<void> {
    await cachedPrisma.invalidateModel('Report');
  },
  
  // User-specific invalidation
  async invalidateUserData(userId: string): Promise<void> {
    await cachedPrisma.invalidateUser(userId);
  },
  
  // Record-specific invalidation
  async invalidatePatient(patientId: string): Promise<void> {
    await cachedPrisma.invalidateRecord('Patient', patientId);
  },
  
  async invalidateAppointment(appointmentId: string): Promise<void> {
    await cachedPrisma.invalidateRecord('Appointment', appointmentId);
  },
  
  // Bulk invalidation for common scenarios
  async invalidatePatientRelated(patientId: string): Promise<void> {
    await Promise.all([
      cachedPrisma.invalidateRecord('Patient', patientId),
      queryCache.invalidateTag(`user:${patientId}`),
      queryCache.invalidateTag('model:Appointment'), // Patient appointments might be affected
      queryCache.invalidateTag('model:Report'), // Patient reports might be affected
    ]);
  },
  
  async invalidateDailySchedule(date: string): Promise<void> {
    await queryCache.invalidateTag('daily-schedule');
    await cachedPrisma.invalidateModel('Appointment');
  },
  
  // Get comprehensive cache statistics
  async getStats() {
    return {
      queryCache: await queryCache.getMetrics(),
      redisStats: await queryCache.getRedisStats(),
      queryStats: cachedPrisma.getQueryStats(),
    };
  }
};

// Export the main cached client as default
export default cachedPrisma