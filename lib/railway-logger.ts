/**
 * FisioFlow - Railway Structured Logging & Graceful Shutdown
 * Edge Runtime Compatible Version
 *
 * Sistema de logs estruturados otimizado para Railway e Edge Runtime
 * - Logs em formato JSON para Railway
 * - Diferentes níveis de log
 * - Correlação de requests
 * - Métricas de performance
 * - Compatível com Edge Runtime
 */

import { NextRequest } from 'next/server';

// Tipos para contexto de logging
interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  timestamp?: string;
  environment?: string;
  service?: string;
}

interface PerformanceMetrics {
  duration: number;
  requestCount?: number;
  errorCount?: number;
  errorRate?: number;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Configuração do logger baseada no ambiente Railway
const RAILWAY_LOG_CONFIG = {
  level: (typeof process !== 'undefined' && process.env?.LOG_LEVEL) || 'info',
  service:
    (typeof process !== 'undefined' && process.env?.RAILWAY_SERVICE_NAME) ||
    'fisioflow',
  environment:
    (typeof process !== 'undefined' &&
      (process.env?.RAILWAY_ENVIRONMENT || process.env?.NODE_ENV)) ||
    'development',
};

// Classe principal do logger compatível com Edge Runtime
class RailwayLogger {
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private currentContext: LogContext | null = null;

  constructor() {
    this.startTime = Date.now();
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return (
      levels.indexOf(level) >=
      levels.indexOf(RAILWAY_LOG_CONFIG.level as LogLevel)
    );
  }

  private formatLog(entry: LogEntry): string {
    const logData: Record<string, any> = {
      timestamp: entry.timestamp,
      level: entry.level.toUpperCase(),
      message: entry.message,
      service: RAILWAY_LOG_CONFIG.service,
      environment: RAILWAY_LOG_CONFIG.environment,
      ...entry.context,
      ...(entry.metadata && { meta: entry.metadata }),
      ...(entry.error && { error: entry.error }),
    };

    // Adicionar Railway specific fields se disponíveis
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.RAILWAY_GIT_COMMIT_SHA) {
        logData.commit = process.env.RAILWAY_GIT_COMMIT_SHA;
      }
      if (process.env.RAILWAY_DEPLOYMENT_ID) {
        logData.deploymentId = process.env.RAILWAY_DEPLOYMENT_ID;
      }
    }

    return JSON.stringify(logData);
  }

  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    meta?: any
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.currentContext || undefined,
      metadata: meta,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    const formattedLog = this.formatLog(entry);

    // Usar console apropriado para cada nível
    switch (level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        this.errorCount++;
        break;
    }
  }

  // Middleware para Next.js compatível com Edge Runtime
  createRequestMiddleware() {
    return (req: NextRequest) => {
      const requestId = this.generateRequestId();
      const context: LogContext = {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers.get('user-agent') || undefined,
        ip:
          req.headers.get('x-forwarded-for') ||
          req.headers.get('x-real-ip') ||
          undefined,
        timestamp: new Date().toISOString(),
        environment: RAILWAY_LOG_CONFIG.environment,
        service: RAILWAY_LOG_CONFIG.service,
      };

      this.currentContext = context;
      this.requestCount++;

      const startTime = Date.now();

      this.info('Request iniciado', {
        method: req.method,
        url: req.url,
        requestId,
      });

      // Retornar função para log de resposta
      return (statusCode: number, error?: Error) => {
        const duration = Date.now() - startTime;

        if (error) {
          this.error('Request falhou', error, {
            method: req.method,
            url: req.url,
            requestId,
            statusCode,
            duration,
          });
        } else {
          this.info('Request concluído', {
            method: req.method,
            url: req.url,
            requestId,
            statusCode,
            duration,
          });
        }

        // Limpar contexto após o request
        this.currentContext = null;
      };
    };
  }

  // Métodos de logging
  info(message: string, meta?: any) {
    this.log('info', message, undefined, meta);
  }

  error(message: string, error?: Error | any, meta?: any) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log('error', message, errorObj, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, undefined, meta);
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, undefined, meta);
  }

  // Log de performance
  performance(operation: string, metrics: PerformanceMetrics, meta?: any) {
    this.info(`Performance: ${operation}`, {
      operation,
      ...metrics,
      ...meta,
    });
  }

  // Log de métricas do sistema (simplificado para Edge Runtime)
  systemMetrics() {
    const uptime = Date.now() - this.startTime;
    const errorRate =
      this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

    this.info('System metrics', {
      uptime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate,
    });
  }

  // Gerar ID único para request
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Getter para métricas
  getMetrics() {
    return {
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate:
        this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
    };
  }

  // Método para definir contexto manualmente (substitui AsyncLocalStorage)
  setContext(context: LogContext) {
    this.currentContext = context;
  }

  // Método para limpar contexto
  clearContext() {
    this.currentContext = null;
  }
}

// Singleton instance
let loggerInstance: RailwayLogger;

export function getRailwayLogger(): RailwayLogger {
  if (!loggerInstance) {
    loggerInstance = new RailwayLogger();
  }
  return loggerInstance;
}

// Export para uso direto
export const railwayLogger = getRailwayLogger();

// Export tipos
export type { LogContext, PerformanceMetrics };
export { RailwayLogger };

// Utility para medir performance compatível com Edge Runtime
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T> | T
): Promise<T> | T {
  const startTime = Date.now();

  try {
    const result = fn();

    if (result instanceof Promise) {
      return result
        .then(value => {
          const duration = Date.now() - startTime;
          railwayLogger.performance(operation, { duration });
          return value;
        })
        .catch(error => {
          const duration = Date.now() - startTime;
          railwayLogger.error(
            `Performance measurement failed for ${operation}`,
            error,
            { duration }
          );
          throw error;
        });
    } else {
      const duration = Date.now() - startTime;
      railwayLogger.performance(operation, { duration });
      return result;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    railwayLogger.error(
      `Performance measurement failed for ${operation}`,
      error as Error,
      { duration }
    );
    throw error;
  }
}
