// lib/middleware/performance.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple logger replacement
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '')
};

/**
 * @interface PerformanceMetrics
 * @description Estrutura para armazenar métricas de desempenho de uma requisição.
 * @property {number} startTime - Timestamp do início da requisição.
 * @property {number} endTime - Timestamp do fim da requisição.
 * @property {number} duration - Duração total da requisição em milissegundos.
 * @property {NodeJS.MemoryUsage} memoryUsage - Uso de memória ao final da requisição.
 * @property {number} statusCode - Código de status da resposta HTTP.
 * @property {string} method - Método HTTP da requisição.
 * @property {string} url - URL da requisição.
 * @property {string} [userAgent] - User agent do cliente.
 * @property {string} [ip] - Endereço IP do cliente.
 */
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

/**
 * Middleware de alta ordem (HOC) para monitorar o desempenho de um handler de rota da API Next.js.
 * Mede o tempo de execução, o uso de memória e loga as informações.
 *
 * @param {(req: NextRequest) => Promise<NextResponse>} handler - O handler da rota da API a ser envolvido.
 * @returns {(req: NextRequest) => Promise<NextResponse>} O handler envolvido com monitoramento de desempenho.
 */
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
      response = await handler(req);
      statusCode = response.status;
    } catch (error: any) {
      statusCode = 500;

      logger.error('API handler error', {
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
    logger.info('API request completed', {
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent,
      memoryDelta,
    });

    // Add performance headers to response
    response.headers.set('X-Response-Time', `${duration}ms`);

    // Warning for slow requests
    if (duration > 1000) {
      logger.warn('Slow API request detected', {
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

/**
 * Rastreia o tempo de execução de uma operação de banco de dados.
 *
 * @template T - O tipo de retorno da operação.
 * @param {string} operation - O nome da operação (ex: 'findUserById').
 * @param {() => Promise<T>} query - A função que executa a query no banco de dados.
 * @param {Record<string, any>} [context] - Contexto adicional para o log.
 * @returns {Promise<T>} O resultado da operação de banco de dados.
 */
export async function trackDatabaseOperation<T>(
  operation: string,
  query: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  const result = await query();
  const duration = Date.now() - startTime;
  
  logger.info(`Database operation: ${operation}`, { duration, context });
  return result;
}

/**
 * Utilitário para medir o tempo de execução de qualquer função (síncrona ou assíncrona).
 *
 * @template T - O tipo de retorno da função.
 * @param {string} operation - O nome da operação para identificação.
 * @param {() => Promise<T> | T} fn - A função a ser medida.
 * @returns {Promise<{ result: T; duration: number }>} Um objeto com o resultado e a duração da execução.
 */
export async function measureExecutionTime<T>(
  operation: string,
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;

  return { result, duration };
}

/**
 * Cria um handler de rota para health check que inclui métricas de desempenho.
 *
 * @returns {(req: NextRequest) => Promise<NextResponse>} O handler da rota de health check.
 */
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
            // Real database ping using improved health check
            const { checkDatabaseConnection } = await import('@/lib/prisma');
            const isHealthy = await checkDatabaseConnection();
            if (!isHealthy) {
              throw new Error('Database connection failed');
            }
            return true;
          }
        );

        checks.database = {
          status: 'healthy',
          responseTime: dbDuration,
        };
      } catch (error: any) {
        console.error('Database health check failed:', error);
        checks.database = {
          status: 'unhealthy',
          responseTime: 0,
          error: error.message || 'Database connection failed',
        } as any;
      }

      // Test Redis connection
      try {
        const { duration: redisDuration } = await measureExecutionTime(
          'redis.ping',
          async () => {
            // Real Redis ping
            const redis = await import('@/lib/redis').then(m => m.default);
            await redis.ping();
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
