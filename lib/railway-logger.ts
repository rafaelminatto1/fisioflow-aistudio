/**
 * FisioFlow - Railway Structured Logging & Graceful Shutdown
 * 
 * Sistema de logs estruturados e graceful shutdown otimizado para Railway
 * - Logs em formato JSON para Railway
 * - Diferentes níveis de log
 * - Correlação de requests
 * - Graceful shutdown com cleanup
 * - Métricas de performance
 */

import { createLogger, format, transports, Logger } from 'winston';
import { AsyncLocalStorage } from 'async_hooks';
import { NextRequest } from 'next/server';
// import { railwayPool } from './railway-pooling'; // Commented out temporarily

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
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
  activeConnections?: number;
  requestCount?: number;
}

// AsyncLocalStorage para contexto de request
const requestContext = new AsyncLocalStorage<LogContext>();

// Configuração do logger baseada no ambiente Railway
const RAILWAY_LOG_CONFIG = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.RAILWAY_STRUCTURED_LOGGING === 'true' ? 'json' : 'simple',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
  maxSize: process.env.LOG_MAX_SIZE || '10m',
  service: process.env.RAILWAY_SERVICE_NAME || 'fisioflow',
  environment: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development',
};

// Classe principal do logger
class RailwayLogger {
  private logger!: Logger; // Using definite assignment assertion
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private shutdownHandlers: Array<() => Promise<void>> = [];
  private isShuttingDown: boolean = false;

  constructor() {
    this.startTime = Date.now();
    this.initializeLogger();
    this.setupGracefulShutdown();
  }

  private initializeLogger() {
    // Formato customizado para Railway
    const railwayFormat = format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      format.errors({ stack: true }),
      format.json(),
      format.printf((info) => {
        const context = requestContext.getStore() || {};
        
        const logEntry = {
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
          service: RAILWAY_LOG_CONFIG.service,
          environment: RAILWAY_LOG_CONFIG.environment,
          ...context,
          ...info.meta,
        };

        // Adicionar stack trace para erros
        if (info.stack) {
          logEntry.stack = info.stack;
        }

        // Adicionar Railway specific fields
        if (process.env.RAILWAY_GIT_COMMIT_SHA) {
          logEntry.commit = process.env.RAILWAY_GIT_COMMIT_SHA;
        }

        if (process.env.RAILWAY_DEPLOYMENT_ID) {
          logEntry.deploymentId = process.env.RAILWAY_DEPLOYMENT_ID;
        }

        return JSON.stringify(logEntry);
      })
    );

    // Formato simples para desenvolvimento
    const simpleFormat = format.combine(
      format.colorize(),
      format.timestamp({
        format: 'HH:mm:ss'
      }),
      format.printf((info) => {
        const context = requestContext.getStore();
        const requestInfo = context?.requestId ? `[${context.requestId}] ` : '';
        return `${info.timestamp} ${info.level}: ${requestInfo}${info.message}`;
      })
    );

    // Configurar transports
    const logTransports: any[] = [];

    // Console transport
    if (RAILWAY_LOG_CONFIG.enableConsole) {
      logTransports.push(
        new transports.Console({
          format: RAILWAY_LOG_CONFIG.format === 'json' ? railwayFormat : simpleFormat,
          handleExceptions: true,
          handleRejections: true,
        })
      );
    }

    // File transport para produção
    if (RAILWAY_LOG_CONFIG.enableFile) {
      logTransports.push(
        new transports.File({
          filename: '/app/logs/error.log',
          level: 'error',
          format: railwayFormat,
          maxsize: RAILWAY_LOG_CONFIG.maxSize,
          maxFiles: RAILWAY_LOG_CONFIG.maxFiles,
        }),
        new transports.File({
          filename: '/app/logs/combined.log',
          format: railwayFormat,
          maxsize: RAILWAY_LOG_CONFIG.maxSize,
          maxFiles: RAILWAY_LOG_CONFIG.maxFiles,
        })
      );
    }

    this.logger = createLogger({
      level: RAILWAY_LOG_CONFIG.level,
      transports: logTransports,
      exitOnError: false,
    });
  }

  private setupGracefulShutdown() {
    // Registrar handlers de shutdown
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;
    
    signals.forEach((signal) => {
      process.on(signal, async () => {
        if (this.isShuttingDown) {
          this.logger.warn('Shutdown já em progresso, forçando saída...');
          process.exit(1);
        }

        this.isShuttingDown = true;
        this.logger.info(`Recebido sinal ${signal}, iniciando graceful shutdown...`);
        
        await this.gracefulShutdown();
      });
    });

    // Handler para uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
      this.gracefulShutdown().then(() => process.exit(1));
    });

    // Handler para unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection:', { reason, promise });
    });
  }

  // Método para adicionar handlers de shutdown
  addShutdownHandler(handler: () => Promise<void>) {
    this.shutdownHandlers.push(handler);
  }

  // Graceful shutdown
  private async gracefulShutdown() {
    const shutdownTimeout = parseInt(process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '30000');
    
    this.logger.info('Iniciando graceful shutdown...', {
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
    });

    // Timeout para forçar shutdown
    const forceShutdownTimer = setTimeout(() => {
      this.logger.error('Graceful shutdown timeout, forçando saída...');
      process.exit(1);
    }, shutdownTimeout);

    try {
      // Executar handlers de shutdown
      await Promise.all(
        this.shutdownHandlers.map(async (handler, index) => {
          try {
            await handler();
            this.logger.debug(`Shutdown handler ${index} executado com sucesso`);
          } catch (error) {
            this.logger.error(`Erro no shutdown handler ${index}:`, { error });
          }
        })
      );

      // Fechar pool de conexões
      // await railwayPool.gracefulShutdown(); // Commented out temporarily

      this.logger.info('Graceful shutdown concluído com sucesso');
      clearTimeout(forceShutdownTimer);
      process.exit(0);
    } catch (error) {
      this.logger.error('Erro durante graceful shutdown:', { error });
      clearTimeout(forceShutdownTimer);
      process.exit(1);
    }
  }

  // Middleware para Next.js
  createRequestMiddleware() {
    return (req: NextRequest) => {
      const requestId = this.generateRequestId();
      const context: LogContext = {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers.get('user-agent') || undefined,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        timestamp: new Date().toISOString(),
        environment: RAILWAY_LOG_CONFIG.environment,
        service: RAILWAY_LOG_CONFIG.service,
      };

      this.requestCount++;

      return requestContext.run(context, () => {
        const startTime = Date.now();
        
        this.logger.info('Request iniciado', {
          method: req.method,
          url: req.url,
          requestId,
        });

        // Retornar função para log de resposta
        return (statusCode: number, error?: Error) => {
          const duration = Date.now() - startTime;
          
          if (error) {
            this.errorCount++;
            this.logger.error('Request falhou', {
              method: req.method,
              url: req.url,
              requestId,
              statusCode,
              duration,
              error: error.message,
              stack: error.stack,
            });
          } else {
            this.logger.info('Request concluído', {
              method: req.method,
              url: req.url,
              requestId,
              statusCode,
              duration,
            });
          }
        };
      });
    };
  }

  // Métodos de logging
  info(message: string, meta?: any) {
    this.logger.info(message, { meta });
  }

  error(message: string, error?: Error | any, meta?: any) {
    this.errorCount++;
    this.logger.error(message, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      meta,
    });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, { meta });
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, { meta });
  }

  // Log de performance
  performance(operation: string, metrics: PerformanceMetrics, meta?: any) {
    this.logger.info(`Performance: ${operation}`, {
      operation,
      ...metrics,
      meta,
    });
  }

  // Log de métricas do sistema
  systemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = Date.now() - this.startTime;

    this.logger.info('System metrics', {
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      uptime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
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
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      isShuttingDown: this.isShuttingDown,
    };
  }
}

// Singleton instance
let loggerInstance: RailwayLogger;

export function getRailwayLogger(): RailwayLogger {
  if (!loggerInstance) {
    loggerInstance = new RailwayLogger();
    
    // Iniciar coleta de métricas do sistema
    if (process.env.RAILWAY_METRICS_ENABLED === 'true') {
      setInterval(() => {
        loggerInstance.systemMetrics();
      }, parseInt(process.env.RAILWAY_METRICS_INTERVAL || '60000'));
    }
  }
  return loggerInstance;
}

// Export para uso direto
export const railwayLogger = getRailwayLogger();

// Export tipos
export type { LogContext, PerformanceMetrics };
export { RailwayLogger };

// Utility para medir performance
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    try {
      const result = await fn();
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      railwayLogger.performance(operation, {
        duration: endTime - startTime,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        },
        cpuUsage: endCpu,
      });

      resolve(result);
    } catch (error) {
      railwayLogger.error(`Performance measurement failed for ${operation}`, error);
      reject(error);
    }
  });
}