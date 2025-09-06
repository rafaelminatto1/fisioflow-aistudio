import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

/**
 * Configuração otimizada para Neon DB
 * Inclui pooling, retry logic e configurações de performance
 */

export interface NeonConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  statementTimeout: number;
  queryTimeout: number;
}

export const defaultNeonConfig: NeonConfig = {
  host: process.env.NEON_DB_HOST || 'localhost',
  port: parseInt(process.env.NEON_DB_PORT || '5432'),
  database: process.env.NEON_DB_NAME || 'fisioflow',
  user: process.env.NEON_DB_USER || 'postgres',
  password: process.env.NEON_DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production',
  maxConnections: parseInt(process.env.NEON_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.NEON_IDLE_TIMEOUT || '600000'), // 10 minutos
  connectionTimeoutMillis: parseInt(
    process.env.NEON_CONNECTION_TIMEOUT || '30000'
  ), // 30 segundos
  statementTimeout: parseInt(process.env.NEON_STATEMENT_TIMEOUT || '30000'), // 30 segundos
  queryTimeout: parseInt(process.env.NEON_QUERY_TIMEOUT || '30000'), // 30 segundos
};

/**
 * Pool de conexões otimizado para Neon DB
 */
export class NeonConnectionPool {
  private pool!: Pool; // Definitive assignment assertion
  private config: NeonConfig;

  constructor(config: Partial<NeonConfig> = {}) {
    this.config = { ...defaultNeonConfig, ...config };
    this.initializePool();
  }

  private initializePool() {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      statement_timeout: this.config.statementTimeout,
      query_timeout: this.config.queryTimeout,
      // Configurações específicas para Neon
      application_name: 'fisioflow',
    });

    // Event listeners para monitoramento
    this.pool.on('connect', client => {
      console.log(
        `[NeonPool] Nova conexão estabelecida. Total: ${this.pool.totalCount}`
      );
    });

    this.pool.on('remove', client => {
      console.log(
        `[NeonPool] Conexão removida. Total: ${this.pool.totalCount}`
      );
    });

    this.pool.on('error', (err, client) => {
      console.error('[NeonPool] Erro na conexão:', err);
    });
  }

  /**
   * Executa query com retry automático
   */
  async query(text: string, params?: any[], retries = 3): Promise<any> {
    let lastError: Error = new Error('Query failed after all retries');

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const start = Date.now();
        const result = await this.pool.query(text, params);
        const duration = Date.now() - start;

        if (duration > 1000) {
          console.warn(
            `[NeonPool] Query lenta detectada: ${duration}ms - ${text.substring(0, 100)}...`
          );
        }

        return result;
      } catch (error: any) {
        lastError = error;

        // Retry apenas para erros de conexão
        if (this.isRetryableError(error) && attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.warn(
            `[NeonPool] Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`
          );
          await this.sleep(delay);
          continue;
        }

        break;
      }
    }

    throw lastError;
  }

  /**
   * Verifica se o erro é retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      '57P01', // admin_shutdown
      '57P02', // crash_shutdown
      '57P03', // cannot_connect_now
      '08000', // connection_exception
      '08003', // connection_does_not_exist
      '08006', // connection_failure
    ];

    return (
      retryableCodes.includes(error.code) ||
      error.message?.includes('connection') ||
      error.message?.includes('timeout')
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fecha o pool de conexões
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Retorna estatísticas do pool
   */
  getStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: this.config.maxConnections,
    };
  }

  /**
   * Health check do pool
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      return result.rows[0]?.health_check === 1;
    } catch (error) {
      console.error('[NeonPool] Health check falhou:', error);
      return false;
    }
  }
}

/**
 * Cliente Prisma otimizado para Neon
 */
export class NeonPrismaClient extends PrismaClient {
  private connectionPool!: NeonConnectionPool;

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });

    // Inicializa pool de conexões se estiver usando Neon
    if (process.env.NEON_DB_HOST) {
      this.connectionPool = new NeonConnectionPool();
    }

    // Middleware para logging e monitoramento
    this.$use(async (params, next) => {
      const start = Date.now();

      try {
        const result = await next(params);
        const duration = Date.now() - start;

        // Log queries lentas
        if (duration > 1000) {
          console.warn(
            `[Prisma] Query lenta: ${duration}ms - ${params.model}.${params.action}`
          );
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        console.error(
          `[Prisma] Erro na query: ${duration}ms - ${params.model}.${params.action}:`,
          error
        );
        throw error;
      }
    });
  }

  /**
   * Health check do cliente Prisma
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('[Prisma] Health check falhou:', error);
      return false;
    }
  }

  /**
   * Fecha conexões
   */
  async disconnect(): Promise<void> {
    if (this.connectionPool) {
      await this.connectionPool.close();
    }
    await super.$disconnect();
  }
}

// Exporta instância singleton
export const neonPrisma = new NeonPrismaClient();

// Para uso em desenvolvimento/testes
export const createTestPrismaClient = () => {
  return new NeonPrismaClient();
};
