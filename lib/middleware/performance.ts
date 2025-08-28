// lib/middleware/performance.ts
import { NextRequest, NextResponse } from 'next/server';
import { structuredLogger } from '../monitoring/logger';
import { BusinessMetrics, timeAsyncOperation } from '../monitoring/metrics';

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  statusCode: number;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
}

// Performance monitoring middleware for API routes
export function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    const method = req.method || 'GET';
    const url = req.url || '';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    let response: NextResponse;
    let statusCode = 200;

    try {
      response = await timeAsyncOperation(
        `api.${method.toLowerCase()}.${url.split('?')[0]}`,
        () => handler(req)
      );

      statusCode = response.status;

      // Record business metrics
      BusinessMetrics.recordAPICall(url, method, statusCode);
    } catch (error: any) {
      statusCode = 500;

      structuredLogger.error('API handler error', {
        method,
        url,
        error: error.message,
        stack: error.stack,
        userAgent,
        ip,
      });

      response = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const endMemory = process.memoryUsage();

    // Calculate memory delta
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    };

    // Log performance metrics
    structuredLogger.logAPICall(method, url, statusCode, duration, {
      ip,
      userAgent,
      memoryDelta,
    });

    // Add performance headers to response
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('X-Memory-Usage', JSON.stringify(memoryDelta));

    // Warning for slow requests
    if (duration > 1000) {
      structuredLogger.warn('Slow API request detected', {
        method,
        url,
        duration,
        statusCode,
        memoryDelta,
      });
    }

    return response;
  };
}

// Database query performance tracking
export async function trackDatabaseOperation<T>(
  operation: string,
  query: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return timeAsyncOperation(`database.${operation}`, query);
}

// Cache operation performance tracking
export async function trackCacheOperation<T>(
  operation: 'get' | 'set' | 'del',
  key: string,
  cacheOperation: () => Promise<T>
): Promise<T> {
  return timeAsyncOperation(`cache.${operation}`, async () => {
    const result = await cacheOperation();

    // Map operation types to logger expected types
    let logOperation: 'hit' | 'miss' | 'set' | 'delete';
    if (operation === 'get') {
      logOperation = result !== null ? 'hit' : 'miss';
    } else if (operation === 'del') {
      logOperation = 'delete';
    } else {
      logOperation = operation as 'set';
    }

    structuredLogger.logCacheOperation(logOperation, key);
    return result;
  });
}

// Performance monitoring for external API calls
export async function trackExternalAPICall<T>(
  service: string,
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> {
  return timeAsyncOperation(`external.${service}.${endpoint}`, apiCall);
}

// Utility to measure function execution time
export async function measureExecutionTime<T>(
  operation: string,
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;

  return { result, duration };
}

// Health check with performance metrics
export function createHealthCheckHandler() {
  return withPerformanceMonitoring(async (req: NextRequest) => {
    const healthData = await measureExecutionTime('health.check', async () => {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Basic health checks
      const checks = {
        database: { status: 'unknown', responseTime: 0 },
        redis: { status: 'unknown', responseTime: 0 },
        memory: {
          status:
            memoryUsage.heapUsed / memoryUsage.heapTotal < 0.9
              ? 'healthy'
              : 'warning',
          usage: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            percentage: Math.round(
              (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
            ),
          },
        },
        system: {
          status: 'healthy',
          nodeVersion: process.version,
          platform: process.platform,
        },
      };

      // Test database connection
      try {
        const { duration: dbDuration } = await measureExecutionTime(
          'database.ping',
          async () => {
            // Add your database ping logic here
            await new Promise(resolve => setTimeout(resolve, 10)); // Mock ping
            return true;
          }
        );

        checks.database = {
          status: 'healthy',
          responseTime: dbDuration,
        };
      } catch (error: any) {
        checks.database = {
          status: 'unhealthy',
          responseTime: 0,
          error: error.message,
        } as any;
      }

      // Test Redis connection
      try {
        const { duration: redisDuration } = await measureExecutionTime(
          'redis.ping',
          async () => {
            // Add your Redis ping logic here
            await new Promise(resolve => setTimeout(resolve, 5)); // Mock ping
            return true;
          }
        );

        checks.redis = {
          status: 'healthy',
          responseTime: redisDuration,
        };
      } catch (error: any) {
        checks.redis = {
          status: 'unhealthy',
          responseTime: 0,
          error: error.message,
        } as any;
      }

      const overallStatus = Object.values(checks).every(
        check => check.status === 'healthy'
      )
        ? 'healthy'
        : 'unhealthy';

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks,
      };
    });

    return NextResponse.json({
      ...healthData.result,
      responseTime: healthData.duration,
    });
  });
}

export default withPerformanceMonitoring;
