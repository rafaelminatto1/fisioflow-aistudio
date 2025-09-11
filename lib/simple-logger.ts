// lib/simple-logger.ts - Edge Runtime Compatible Logger
// Simple logger that works with Next.js Edge Runtime

/**
 * @interface LogEntry
 * @description Estrutura de uma entrada de log para o SimpleLogger.
 */
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
}

/**
 * @class SimpleLogger
 * @description Um logger simples, compatível com o Edge Runtime do Next.js, que loga no console.
 */
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

  /**
   * Registra uma mensagem de log com o nível 'info'.
   * @param {string} message - A mensagem de log.
   * @param {any} [metadata] - Dados adicionais.
   */
  info(message: string, metadata?: any): void {
    console.log(this.formatLog('info', message, metadata));
  }

  /**
   * Registra uma mensagem de log com o nível 'warn'.
   * @param {string} message - A mensagem de log.
   * @param {any} [metadata] - Dados adicionais.
   */
  warn(message: string, metadata?: any): void {
    console.warn(this.formatLog('warn', message, metadata));
  }

  /**
   * Registra uma mensagem de log com o nível 'error'.
   * @param {string} message - A mensagem de log.
   * @param {any} [error] - O objeto de erro.
   * @param {any} [metadata] - Dados adicionais.
   */
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

  /**
   * Registra uma mensagem de log com o nível 'debug', apenas em ambiente de desenvolvimento.
   * @param {string} message - A mensagem de log.
   * @param {any} [metadata] - Dados adicionais.
   */
  debug(message: string, metadata?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, metadata));
    }
  }

  /**
   * Obtém métricas básicas (mock).
   * @returns {object} Um objeto com métricas mock.
   */
  getMetrics() {
    return {
      uptime: Date.now(),
      requestCount: 0,
      errorCount: 0,
      errorRate: 0,
    };
  }

  /**
   * Cria um middleware de log para requisições.
   * @returns {function} Uma função que, quando chamada com um objeto de requisição, retorna outra função para logar o final da requisição.
   */
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

/**
 * Mede e loga o tempo de execução de uma função assíncrona.
 * @template T - O tipo de retorno da função.
 * @param {string} label - Um rótulo para identificar a operação.
 * @param {() => Promise<T>} fn - A função a ser medida.
 * @returns {Promise<T>} O resultado da função.
 */
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

/**
 * @constant edgeLogger
 * @description Instância singleton do SimpleLogger.
 */
const edgeLogger = new SimpleLogger();
export default edgeLogger;
export const simpleLogger = edgeLogger;
