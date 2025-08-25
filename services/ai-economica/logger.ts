// services/ai-economica/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    };

    // Add to internal logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Console output
    const logMessage = `[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(logMessage, data || '');
        break;
      case 'info':
        console.info(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }

  public debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  public info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  public getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = level ? this.logs.filter(log => log.level === level) : this.logs;
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to: ${level}`);
  }

  public getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

export const logger = new Logger();
export { Logger };
export type { LogLevel, LogEntry };