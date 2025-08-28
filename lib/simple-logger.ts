// lib/simple-logger.ts - Edge Runtime Compatible Logger
// Simple logger that works with Next.js Edge Runtime

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
}

export class SimpleLogger {
  private prefix: string;

  constructor(prefix = 'FisioFlow') {
    this.prefix = prefix;
  }

  private formatLog(level: string, message: string, metadata?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(metadata && { metadata }),
    };

    return `[${this.prefix}] ${JSON.stringify(entry)}`;
  }

  info(message: string, metadata?: any): void {
    console.log(this.formatLog('info', message, metadata));
  }

  warn(message: string, metadata?: any): void {
    console.warn(this.formatLog('warn', message, metadata));
  }

  error(message: string, error?: any, metadata?: any): void {
    const errorData =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;

    console.error(
      this.formatLog('error', message, {
        error: errorData,
        ...metadata,
      })
    );
  }

  debug(message: string, metadata?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, metadata));
    }
  }

  // Métrica simple
  getMetrics() {
    return {
      uptime: Date.now(),
      requestCount: 0,
      errorCount: 0,
      errorRate: 0,
    };
  }

  // Request middleware compatible
  createRequestMiddleware() {
    return (request: Request) => {
      const requestId = crypto.randomUUID();
      const startTime = Date.now();

      this.debug('Request started', {
        requestId,
        method: request.method,
        url: request.url,
      });

      return (status: number, error?: Error) => {
        const duration = Date.now() - startTime;

        if (error) {
          this.error('Request failed', error, {
            requestId,
            status,
            duration,
          });
        } else {
          this.debug('Request completed', {
            requestId,
            status,
            duration,
          });
        }
      };
    };
  }
}

// Performance measurement utility
export async function measurePerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Performance] ${label}: ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[Performance] ${label} failed after ${duration}ms:`, error);
    throw error;
  }
}

// Export singleton
const edgeLogger = new SimpleLogger();
export default edgeLogger;
export const simpleLogger = edgeLogger;
