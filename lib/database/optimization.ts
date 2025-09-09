// lib/database/optimization.ts
import prisma from '../prisma';
import { cache, CacheOptions } from '../cache';
import { trackDatabaseOperation } from '../middleware/performance';
import { structuredLogger } from '../monitoring/logger';

// Connection pool configuration
const connectionConfig = {
  pool: {
    min: 2,
    max: process.env.NODE_ENV === 'production' ? 20 : 5,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 300000,
    reapIntervalMillis: 10000,
    createRetryIntervalMillis: 200,
  },
  query: {
    timeout: 30000,
  },
};

// Query optimization utilities
export class DatabaseOptimizer {
  // Cache frequently accessed data
  static async cachedQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    options: CacheOptions = { ttl: 300 } // 5 minutes default
  ): Promise<T> {
    return cache.remember(cacheKey, queryFn, options);
  }

  // Paginated queries with cursor-based pagination for better performance
  static async paginatedQuery<T>(
    query: any,
    page: number = 1,
    limit: number = 20,
    cursor?: string
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total?: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      nextCursor?: string;
      previousCursor?: string;
    };
  }> {
    const skip = (page - 1) * limit;

    // Use cursor-based pagination when cursor is provided
    if (cursor) {
      const data = await query
        .cursor({ id: cursor })
        .take(limit + 1) // Take one extra to check if there's a next page
        .skip(1); // Skip the cursor item

      const hasNextPage = data.length > limit;
      const results = hasNextPage ? data.slice(0, -1) : data;
      const nextCursor = hasNextPage
        ? results[results.length - 1]?.id
        : undefined;

      return {
        data: results,
        pagination: {
          page,
          limit,
          hasNextPage,
          hasPreviousPage: page > 1,
          nextCursor,
        },
      };
    }

    // Fallback to offset-based pagination
    const [data, total] = await Promise.all([
      query.skip(skip).take(limit),
      query.count ? query.count() : null,
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total: total || data.length,
        hasNextPage: total ? skip + limit < total : data.length === limit,
        hasPreviousPage: page > 1,
      },
    };
  }

  // Batch operations for better performance
  static async batchInsert<T>(
    model: any,
    data: T[],
    batchSize: number = 100
  ): Promise<void> {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    await Promise.all(
      batches.map(batch =>
        trackDatabaseOperation('batch_insert', () =>
          model.createMany({
            data: batch,
            skipDuplicates: true,
          })
        )
      )
    );
  }

  // Optimized search with full-text search when available
  static async searchPatients(
    searchTerm: string,
    limit: number = 10,
    filters: any = {}
  ) {
    const cacheKey = `search:patients:${searchTerm}:${JSON.stringify(filters)}:${limit}`;

    return this.cachedQuery(
      cacheKey,
      async () => {
        // Try full-text search first (if available)
        try {
          return await trackDatabaseOperation('search_patients_fulltext', () =>
            prisma.patient.findMany({
              where: {
                ...filters,
                OR: [
                  { name: { search: searchTerm } },
                  { email: { search: searchTerm } },
                  { cpf: { search: searchTerm } },
                ],
              },
              take: limit,
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                status: true,
                lastVisit: true,
              },
            })
          );
        } catch (error) {
          // Fallback to ILIKE search
          structuredLogger.debug('Full-text search not available, using ILIKE');

          return await trackDatabaseOperation('search_patients_ilike', () =>
            prisma.patient.findMany({
              where: {
                ...filters,
                OR: [
                  { name: { contains: searchTerm, mode: 'insensitive' } },
                  { email: { contains: searchTerm, mode: 'insensitive' } },
                  { cpf: { contains: searchTerm, mode: 'insensitive' } },
                ],
              },
              take: limit,
              select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                status: true,
                lastVisit: true,
              },
            })
          );
        }
      },
      { ttl: 60, tags: ['patients', 'search'] }
    );
  }

  // Optimized appointment queries
  static async getAppointmentsByDateRange(
    startDate: Date,
    endDate: Date,
    therapistId?: string
  ) {
    const cacheKey = `appointments:${startDate.toISOString()}:${endDate.toISOString()}:${therapistId || 'all'}`;

    return this.cachedQuery(
      cacheKey,
      () =>
        trackDatabaseOperation('get_appointments_by_date', () =>
          prisma.appointment.findMany({
            where: {
              startTime: { gte: startDate },
              endTime: { lte: endDate },
              ...(therapistId && { therapistId }),
            },
            include: {
              patient: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  medicalAlerts: true,
                },
              },
              therapist: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              startTime: 'asc',
            },
          })
        ),
      { ttl: 300, tags: ['appointments'] }
    );
  }

  // Analytics queries with aggregations
  static async getPatientStats(patientId: string) {
    const cacheKey = `patient_stats:${patientId}`;

    return this.cachedQuery(
      cacheKey,
      async () => {
        const [appointmentStats, recentMetrics] = await Promise.all([
          trackDatabaseOperation('patient_appointment_stats', () =>
            prisma.appointment.groupBy({
              by: ['status'],
              where: { patientId },
              _count: { status: true },
            })
          ),
          trackDatabaseOperation('patient_recent_metrics', () =>
            prisma.metricResult.findMany({
              where: { patientId },
              orderBy: { measuredAt: 'desc' },
              take: 10,
            })
          ),
        ]);

        return {
          appointmentStats: (appointmentStats as any[]).reduce(
            (acc: Record<string, number>, stat: any) => {
              acc[stat.status] = stat._count.status;
              return acc;
            },
            {} as Record<string, number>
          ),
          recentMetrics,
        };
      },
      { ttl: 600, tags: [`patient:${patientId}`, 'stats'] }
    );
  }

  // Cache invalidation helpers
  static async invalidatePatientCache(patientId: string) {
    await Promise.all([
      cache.invalidateTag(`patient:${patientId}`),
      cache.invalidateTag('patients'),
      cache.invalidateTag('search'),
    ]);
  }

  static async invalidateAppointmentCache() {
    await cache.invalidateTag('appointments');
  }

  // Database health check
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    activeConnections?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1 as health_check`;
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
      };
    }
  }

  // Query performance analysis (development only)
  static async analyzeSlowQueries() {
    if (process.env.NODE_ENV !== 'development') {
      return { message: 'Query analysis only available in development' };
    }

    try {
      // This would work with PostgreSQL's pg_stat_statements extension
      const slowQueries = await prisma.$queryRaw`
        SELECT query, calls, total_time, mean_time, rows
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `;

      return { slowQueries };
    } catch (error) {
      return {
        message: 'pg_stat_statements extension not available',
        error: (error as Error).message,
      };
    }
  }
}

// Export singleton instance
export const dbOptimizer = new DatabaseOptimizer();
export default dbOptimizer;
