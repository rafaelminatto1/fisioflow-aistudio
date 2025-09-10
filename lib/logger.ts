import pino from 'pino';

// Configuração otimizada do Pino para produção
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'fisioflow-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  },
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Interfaces para logs estruturados
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

interface DatabaseLogContext extends LogContext {
  query?: string;
  duration?: number;
  table?: string;
  operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
}

interface SecurityLogContext extends LogContext {
  event:
    | 'login'
    | 'logout'
    | 'failed_login'
    | 'unauthorized_access'
    | 'permission_denied';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Classe Logger estruturado
class StructuredLogger {
  private logger: pino.Logger;

  constructor(logger: pino.Logger) {
    this.logger = logger;
  }

  // Logs gerais
  info(message: string, context?: LogContext) {
    this.logger.info(context, message);
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(context, message);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;
    this.logger.error(errorContext, message);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(context, message);
  }

  // Logs específicos para HTTP
  http(message: string, context: LogContext) {
    this.logger.info({
      ...context,
      type: 'http_request',
    }, message);
  }

  // Logs de banco de dados
  database(message: string, context: DatabaseLogContext) {
    this.logger.info({
      ...context,
      type: 'database',
    }, message);
  }

  // Logs de segurança
  security(message: string, context: SecurityLogContext) {
    const level =
      context.severity === 'critical' || context.severity === 'high'
        ? 'error'
        : 'warn';
    
    if (level === 'error') {
      this.logger.error({
        ...context,
        type: 'security',
      }, message);
    } else {
      this.logger.warn({
        ...context,
        type: 'security',
      }, message);
    }
  }

  // Logs de performance
  performance(
    message: string,
    context: LogContext & { duration: number; operation: string }
  ) {
    this.logger.info({
      ...context,
      type: 'performance',
    }, message);
  }

  // Logs de auditoria
  audit(
    message: string,
    context: LogContext & { action: string; resource: string }
  ) {
    this.logger.info({
      ...context,
      type: 'audit',
    }, message);
  }
}

// Instância do logger estruturado
const structuredLogger = new StructuredLogger(logger);

// Middleware para logging de requisições HTTP
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

// Função para criar child logger com contexto
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