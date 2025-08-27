/**
 * Edge Runtime Compatible Logger
 * Substitui o winston para compatibilidade com Next.js Edge Runtime
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  error?: Error;
}

interface LoggerMetrics {
  requestCount: number;
  errorCount: number;
  errorRate: number;
  uptime: number;
  startTime: number;
}

class EdgeLogger {
  private metrics: LoggerMetrics;
  private logLevel: LogLevel;
  private serviceName: string;
  private environment: string;

  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      errorRate: 0,
      uptime: 0,
      startTime: Date.now()
    };
    
    // Usar valores padrão seguros para Edge Runtime
    this.logLevel = 'info';
    this.serviceName = 'fisioflow';
    this.environment = 'development';
    
    // Tentar acessar process.env de forma segura
    if (typeof process !== 'undefined' && process.env) {
      this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
      this.serviceName = process.env.RAILWAY_SERVICE_NAME || 'fisioflow';
      this.environment = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, metadata, error } = entry;
    
    const logData = {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      environment: this.environment,
      message,
      ...(metadata && { metadata }),
      ...(error && { 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };

    return JSON.stringify(logData);
  }

  private log(level: LogLevel, message: string, error?: Error, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      error
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
        this.metrics.errorCount++;
        break;
    }

    // Atualizar métricas
    this.updateMetrics();
  }

  private updateMetrics(): void {
    this.metrics.requestCount++;
    this.metrics.uptime = Date.now() - this.metrics.startTime;
    this.metrics.errorRate = this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
      : 0;
  }

  // Métodos públicos
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, undefined, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, undefined, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, undefined, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('error', message, error, metadata);
  }

  getMetrics(): LoggerMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime
    };
  }

  // Middleware para requisições
  createRequestMiddleware() {
    return (request: Request) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substring(7);
      
      // Log da requisição
      this.info('Requisição recebida', {
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });

      // Retorna função para log da resposta
      return (status: number, error?: Error) => {
        const duration = Date.now() - startTime;
        
        if (error) {
          this.error('Erro na requisição', error, {
            requestId,
            status,
            duration,
            method: request.method,
            url: request.url
          });
        } else {
          this.info('Resposta enviada', {
            requestId,
            status,
            duration,
            method: request.method,
            url: request.url
          });
        }
      };
    };
  }

  // Performance measurement compatível com Edge Runtime
  measurePerformance<T>(operation: string, fn: () => T | Promise<T>): T | Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - startTime;
            this.debug(`Performance: ${operation}`, { duration });
            return value;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            this.error(`Performance error: ${operation}`, error, { duration });
            throw error;
          });
      } else {
        const duration = Date.now() - startTime;
        this.debug(`Performance: ${operation}`, { duration });
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Performance error: ${operation}`, error as Error, { duration });
      throw error;
    }
  }
}

// Instância singleton
const edgeLogger = new EdgeLogger();

export default edgeLogger;
export { EdgeLogger, type LogLevel, type LoggerMetrics };