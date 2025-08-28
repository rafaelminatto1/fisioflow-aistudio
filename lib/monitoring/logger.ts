// lib/monitoring/logger.ts
import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: productionFormat,
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: productionFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format: productionFormat,
  transports,
  exitOnError: false,
});

// Add context to logger
export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

class ContextualLogger {
  private baseLogger: winston.Logger;

  constructor(baseLogger: winston.Logger) {
    this.baseLogger = baseLogger;
  }

  private log(level: string, message: string, context?: LogContext) {
    this.baseLogger.log(level, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  http(message: string, context?: LogContext): void {
    this.log('http', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  // Specialized logging methods
  logAPICall(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    this.http(`${method} ${url} ${statusCode}`, {
      ...context,
      method,
      url,
      statusCode,
      duration,
    });
  }

  logDatabaseQuery(
    query: string,
    duration: number,
    context?: LogContext
  ): void {
    this.debug('Database query executed', {
      ...context,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
    });
  }

  logCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete',
    key: string,
    context?: LogContext
  ): void {
    this.debug(`Cache ${operation}`, {
      ...context,
      operation,
      key,
    });
  }

  logBusinessEvent(
    event: string,
    details: Record<string, any>,
    context?: LogContext
  ): void {
    this.info(`Business event: ${event}`, {
      ...context,
      event,
      ...details,
    });
  }

  logSecurityEvent(
    event: string,
    details: Record<string, any>,
    context?: LogContext
  ): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      event,
      ...details,
    });
  }
}

export const structuredLogger = new ContextualLogger(logger);

// Export both for flexibility
export { logger };
export default structuredLogger;
