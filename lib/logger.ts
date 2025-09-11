import winston from 'winston';
import path from 'path';

/**
 * @constant logLevels
 * @description Níveis de log personalizados para o Winston.
 */
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * @constant logColors
 * @description Cores personalizadas para cada nível de log no console.
 */
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Adicionar cores ao winston
winston.addColors(logColors);

/**
 * @constant logFormat
 * @description Formato de log estruturado (JSON) para arquivos e console em produção.
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;

    const logEntry = {
      timestamp,
      level,
      message,
      service: 'fisioflow-api',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      ...meta,
    };

    return JSON.stringify(logEntry);
  })
);

/**
 * @constant consoleFormat
 * @description Formato de log para o console em ambiente de desenvolvimento, com cores.
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

/**
 * @constant transports
 * @description Array de transports do Winston, configurados dinamicamente com base no ambiente.
 */
const transports: winston.transport[] = [];

// Console transport (sempre ativo em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'debug',
    })
  );
}

// File transports (produção)
if (process.env.NODE_ENV === 'production') {
  // Log de erros
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Log combinado
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Console em produção (formato JSON)
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: process.env.LOG_LEVEL || 'info',
    })
  );
}

/**
 * @constant logger
 * @description Instância principal do logger Winston.
 */
const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

/**
 * @interface LogContext
 * @description Contexto base para logs estruturados.
 */
interface LogContext {
  userId?: string;
  patientId?: string;
  appointmentId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

/**
 * @interface DatabaseLogContext
 * @description Contexto específico para logs de banco de dados.
 */
interface DatabaseLogContext extends LogContext {
  query?: string;
  duration?: number;
  table?: string;
  operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
}

/**
 * @interface SecurityLogContext
 * @description Contexto específico para logs de segurança.
 */
interface SecurityLogContext extends LogContext {
  event:
    | 'login'
    | 'logout'
    | 'failed_login'
    | 'unauthorized_access'
    | 'permission_denied';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * @class StructuredLogger
 * @description Wrapper em torno do logger Winston para fornecer métodos de log estruturado.
 */
class StructuredLogger {
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
  }

  // Logs gerais
  info(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.logger.error(message, {
      ...context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  // Logs específicos para HTTP
  http(message: string, context: LogContext) {
    this.logger.http(message, {
      ...context,
      type: 'http_request',
    });
  }

  // Logs de banco de dados
  database(message: string, context: DatabaseLogContext) {
    this.logger.info(message, {
      ...context,
      type: 'database',
    });
  }

  // Logs de segurança
  security(message: string, context: SecurityLogContext) {
    const level =
      context.severity === 'critical' || context.severity === 'high'
        ? 'error'
        : 'warn';
    this.logger.log(level, message, {
      ...context,
      type: 'security',
    });
  }

  // Logs de performance
  performance(
    message: string,
    context: LogContext & { duration: number; operation: string }
  ) {
    this.logger.info(message, {
      ...context,
      type: 'performance',
    });
  }

  // Logs de auditoria
  audit(
    message: string,
    context: LogContext & { action: string; resource: string }
  ) {
    this.logger.info(message, {
      ...context,
      type: 'audit',
    });
  }
}

/**
 * @constant structuredLogger
 * @description Instância singleton do StructuredLogger.
 */
const structuredLogger = new StructuredLogger(logger);

/**
 * Cria um middleware para logging de requisições HTTP (compatível com Express/Connect).
 * @returns {(req: any, res: any, next: any) => void} A função de middleware.
 */
export function createHttpLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId =
      req.headers['x-request-id'] ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Adicionar requestId ao request
    req.requestId = requestId;

    // Log da requisição
    structuredLogger.http('HTTP Request', {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
    });

    // Override do res.end para capturar resposta
    const originalEnd = res.end;
    res.end = function (chunk: any, encoding: any) {
      const duration = Date.now() - start;

      structuredLogger.http('HTTP Response', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: duration,
        userId: req.user?.id,
      });

      originalEnd.call(res, chunk, encoding);
    };

    next();
  };
}

/**
 * Cria um "child logger" com um contexto pré-definido.
 * @param {LogContext} context - O contexto a ser adicionado a todos os logs criados pelo child logger.
 * @returns {object} Um objeto com os métodos de log (info, warn, error, debug).
 */
export function createChildLogger(context: LogContext) {
  return {
    info: (message: string, additionalContext?: LogContext) =>
      structuredLogger.info(message, { ...context, ...additionalContext }),
    warn: (message: string, additionalContext?: LogContext) =>
      structuredLogger.warn(message, { ...context, ...additionalContext }),
    error: (message: string, error?: Error, additionalContext?: LogContext) =>
      structuredLogger.error(message, error, {
        ...context,
        ...additionalContext,
      }),
    debug: (message: string, additionalContext?: LogContext) =>
      structuredLogger.debug(message, { ...context, ...additionalContext }),
  };
}

export default structuredLogger;
export { logger };
export type { LogContext, DatabaseLogContext, SecurityLogContext };
