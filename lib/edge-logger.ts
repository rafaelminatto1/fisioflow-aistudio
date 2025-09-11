/**
 * Edge Logger - Sistema de logging compatível com Edge Runtime
 * Otimizado para Railway e Vercel Edge Functions
 */

/**
 * @interface LogEntry
 * @description Representa uma entrada de log estruturada.
 * @property {string} timestamp - O timestamp do log.
 * @property {'info' | 'warn' | 'error' | 'debug'} level - O nível do log.
 * @property {string} message - A mensagem de log.
 * @property {any} [data] - Dados adicionais associados ao log.
 * @property {string} [requestId] - ID da requisição, para rastreamento.
 * @property {string} [ip] - Endereço IP do cliente.
 * @property {string} [userAgent] - User agent do cliente.
 */
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * @interface Metrics
 * @description Métricas de desempenho e saúde do logger.
 * @property {number} requestCount - Número total de requisições rastreadas.
 * @property {number} errorCount - Número total de erros registrados.
 * @property {number} errorRate - Taxa de erros (em porcentagem).
 * @property {number} uptime - Tempo de atividade do logger (em ms).
 * @property {number} startTime - Timestamp de quando o logger foi iniciado.
 */
interface Metrics {
  requestCount: number;
  errorCount: number;
  errorRate: number;
  uptime: number;
  startTime: number;
}

/**
 * @class EdgeLogger
 * @description Um logger leve e compatível com Edge Runtimes (Vercel, Railway).
 * Mantém um buffer de logs em memória e coleta métricas básicas.
 */
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

  private log(
    level: LogEntry['level'],
    message: string,
    data?: any,
    context?: any
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      ...context,
    };

    // Adicionar ao buffer interno
    this.logs.push(entry);

    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console em desenvolvimento
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      const logMethod =
        level === 'error'
          ? console.error
          : level === 'warn'
            ? console.warn
            : console.log;

      logMethod(`[${level.toUpperCase()}] ${message}`, data || '');
    }

    // Atualizar métricas
    if (level === 'error') {
      this.metrics.errorCount++;
    }

    this.updateMetrics();
  }

  private updateMetrics() {
    this.metrics.uptime = Date.now() - this.metrics.startTime;
    this.metrics.errorRate =
      this.metrics.requestCount > 0
        ? (this.metrics.errorCount / this.metrics.requestCount) * 100
        : 0;
  }

  /**
   * Registra uma mensagem de log com o nível 'info'.
   * @param {string} message - A mensagem de log.
   * @param {any} [data] - Dados adicionais a serem registrados.
   */
  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  /**
   * Registra uma mensagem de log com o nível 'warn'.
   * @param {string} message - A mensagem de log.
   * @param {any} [data] - Dados adicionais a serem registrados.
   */
  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  /**
   * Registra uma mensagem de log com o nível 'error'.
   * @param {string} message - A mensagem de log.
   * @param {any} [data] - Dados adicionais a serem registrados.
   */
  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  /**
   * Registra uma mensagem de log com o nível 'debug'.
   * @param {string} message - A mensagem de log.
   * @param {any} [data] - Dados adicionais a serem registrados.
   */
  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  /**
   * Obtém as métricas atuais do logger.
   * @returns {Metrics} Um objeto com as métricas de desempenho.
   */
  getMetrics(): Metrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Obtém os logs recentes do buffer em memória.
   * @param {'info' | 'warn' | 'error' | 'debug'} [level] - Filtra os logs por nível.
   * @param {number} [limit=100] - O número máximo de logs a serem retornados.
   * @returns {LogEntry[]} Um array de entradas de log.
   */
  getLogs(level?: LogEntry['level'], limit = 100): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    return filteredLogs.slice(-limit);
  }

  /**
   * Cria um middleware para rastrear uma requisição HTTP.
   * Retorna uma função que deve ser chamada no final da requisição para registrar o resultado.
   * @returns {(request: any) => (statusCode: number, responseData?: any) => void} A função de middleware.
   */
  createRequestMiddleware() {
    const requestId = this.generateRequestId();

    return (request: any) => {
      this.metrics.requestCount++;

      const startTime = Date.now();
      const ip =
        request.headers?.get?.('x-forwarded-for') ||
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

      return (statusCode: number, responseData?: any) => {
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

  /**
   * Mede o tempo de execução de uma operação assíncrona.
   * @template T - O tipo de retorno da operação.
   * @param {string} operation - O nome da operação a ser medida.
   * @param {() => Promise<T>} fn - A função assíncrona a ser executada e medida.
   * @returns {Promise<T>} O resultado da função.
   * @throws Lança o erro original se a função falhar.
   */
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
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
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  private generateRequestId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Exporta as métricas e logs atuais como uma string JSON.
   * @returns {string} Uma string JSON contendo o estado atual do logger.
   */
  exportLogs(): string {
    return JSON.stringify(
      {
        metrics: this.getMetrics(),
        logs: this.getLogs(),
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Limpa o buffer de logs em memória.
   */
  clearLogs() {
    this.logs = [];
    this.info('Logs limpos');
  }
}

/**
 * @constant edgeLogger
 * @description Instância singleton do EdgeLogger.
 */
const edgeLogger = new EdgeLogger();

export default edgeLogger;
export type { LogEntry, Metrics };
