/**
 * Edge Logger - Sistema de logging compatível com Edge Runtime
 * Otimizado para Railway e Vercel Edge Functions
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
}

interface Metrics {
  requestCount: number;
  errorCount: number;
  errorRate: number;
  uptime: number;
  startTime: number;
}

class EdgeLogger {
  private metrics: Metrics;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Limite para evitar memory leak

  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      errorRate: 0,
      uptime: 0,
      startTime: Date.now(),
    };
  }

  private log(level: LogEntry['level'], message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      // Context would be added here if available
    };

    // Adicionar ao buffer interno
    this.logs.push(entry);
    
    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Em produção, você pode enviar para um serviço de logging
    // eslint-disable-next-line no-console
    console.log(`[${level.toUpperCase()}] ${message}`, data);

    // Atualizar métricas
    if (level === 'error') {
      this.metrics.errorCount++;
    }
    
    this.updateMetrics();
  }

  private updateMetrics() {
    this.metrics.uptime = Date.now() - this.metrics.startTime;
    this.metrics.errorRate = this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
      : 0;
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  getMetrics(): Metrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  getLogs(level?: LogEntry['level'], limit = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  createRequestMiddleware() {
    const requestId = this.generateRequestId();
    
    return (request: Request) => {
      this.metrics.requestCount++;
      
      const startTime = Date.now();
      const ip = request.headers?.get?.('x-forwarded-for') || 
                request.headers?.get?.('x-real-ip') || 
                'unknown';
      const userAgent = request.headers?.get?.('user-agent') || 'unknown';
      
      this.info('Request iniciado', {
        requestId,
        method: request.method,
        url: request.url,
        ip,
        userAgent,
      });
      
      return (statusCode: number, responseData?: unknown) => {
        const duration = Date.now() - startTime;
        
        const logData = {
          requestId,
          statusCode,
          duration,
          ip,
          userAgent,
          responseData,
        };
        
        if (statusCode >= 400) {
          this.error(`Request falhou com status ${statusCode}`, logData);
        } else {
          this.info(`Request concluído em ${duration}ms`, logData);
        }
      };
    };
  }

  async measurePerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.info(`Operação '${operation}' concluída`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`Operação '${operation}' falhou`, { 
        duration, 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Método para exportar logs (útil para debugging)
  exportLogs(): string {
    return JSON.stringify({
      metrics: this.getMetrics(),
      logs: this.getLogs(),
      timestamp: new Date().toISOString(),
    }, null, 2);
  }

  // Limpar logs antigos
  clearLogs() {
    this.logs = [];
    this.info('Logs limpos');
  }
}

// Instância singleton
const edgeLogger = new EdgeLogger();

export default edgeLogger;
export type { LogEntry, Metrics };