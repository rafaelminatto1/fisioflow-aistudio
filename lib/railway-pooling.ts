/**
 * FisioFlow - Railway Connection Pooling Configuration
 * 
 * Configuração otimizada de connection pooling para Railway com Neon DB
 * - Pool de conexões adaptativo
 * - Monitoramento de performance
 * - Retry automático
 * - Graceful shutdown
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Configurações do pool baseadas no ambiente Railway
const RAILWAY_CONFIG = {
  // Configurações básicas
  minConnections: parseInt(process.env.DB_POOL_MIN || '2'),
  maxConnections: parseInt(process.env.DB_POOL_MAX || '10'),
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '30000'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'),
  
  // Configurações Railway específicas
  connectionTimeoutMillis: parseInt(process.env.RAILWAY_DB_TIMEOUT || '20000'),
  statementTimeoutMillis: parseInt(process.env.RAILWAY_STATEMENT_TIMEOUT || '60000'),
  
  // Configurações de retry
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
  retryDelayMs: parseInt(process.env.DB_RETRY_DELAY || '1000'),
  
  // Configurações de monitoramento
  enableMetrics: process.env.DB_ENABLE_METRICS === 'true',
  metricsInterval: parseInt(process.env.DB_METRICS_INTERVAL || '60000'),
};

// Interface para métricas do pool
interface PoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalQueries: number;
  errorCount: number;
  avgQueryTime: number;
  lastError?: string;
  uptime: number;
}

// Classe para gerenciar o pool de conexões
class RailwayConnectionPool {
  private pool!: Pool;
  private prisma!: PrismaClient;
  private metrics!: PoolMetrics;
  private startTime: number;
  private queryTimes: number[] = [];
  private metricsInterval?: NodeJS.Timeout;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      totalConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      errorCount: 0,
      avgQueryTime: 0,
      uptime: 0
    };

    this.initializePool();
    this.initializePrisma();
    
    if (RAILWAY_CONFIG.enableMetrics) {
      this.startMetricsCollection();
    }

    // Graceful shutdown handlers
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  private initializePool() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      min: RAILWAY_CONFIG.minConnections,
      max: RAILWAY_CONFIG.maxConnections,
      idleTimeoutMillis: RAILWAY_CONFIG.idleTimeoutMillis,
      connectionTimeoutMillis: RAILWAY_CONFIG.connectionTimeoutMillis,
      statement_timeout: RAILWAY_CONFIG.statementTimeoutMillis,
      
      // Configurações SSL para Neon
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      
      // Configurações de aplicação
      application_name: 'fisioflow-railway',
      
      // Event handlers
      log: (level, msg, meta) => {
        if (level === 'error') {
          console.error('[Pool Error]', msg, meta);
          this.metrics.errorCount++;
          this.metrics.lastError = msg;
        }
      }
    });

    // Event listeners para métricas
    this.pool.on('connect', () => {
      this.metrics.totalConnections++;
      console.log('[Pool] Nova conexão estabelecida');
    });

    this.pool.on('remove', () => {
      this.metrics.totalConnections--;
      console.log('[Pool] Conexão removida');
    });

    this.pool.on('error', (err) => {
      console.error('[Pool Error]', err);
      this.metrics.errorCount++;
      this.metrics.lastError = err.message;
    });
  }

  private initializePrisma() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });

    // Middleware para métricas
    this.prisma.$use(async (params, next) => {
      const start = Date.now();
      
      try {
        const result = await next(params);
        const duration = Date.now() - start;
        
        this.recordQueryTime(duration);
        this.metrics.totalQueries++;
        
        return result;
      } catch (error) {
        this.metrics.errorCount++;
        this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      }
    });
  }

  private recordQueryTime(duration: number) {
    this.queryTimes.push(duration);
    
    // Manter apenas os últimos 1000 tempos para calcular média
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }
    
    this.metrics.avgQueryTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
  }

  private startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Pool Metrics]', this.getMetrics());
      }
    }, RAILWAY_CONFIG.metricsInterval);
  }

  private updateMetrics() {
    this.metrics.uptime = Date.now() - this.startTime;
    this.metrics.idleConnections = this.pool.idleCount;
    this.metrics.waitingClients = this.pool.waitingCount;
  }

  // Método para executar queries com retry
  async executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= RAILWAY_CONFIG.maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.warn(`[Pool] Query attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < RAILWAY_CONFIG.maxRetries) {
          const delay = RAILWAY_CONFIG.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  // Método para testar conectividade
  async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('[Pool] Connection test failed:', error);
      return false;
    }
  }

  // Método para obter métricas
  getMetrics(): PoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  // Método para health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    metrics: PoolMetrics;
    details: {
      connectionTest: boolean;
      poolStatus: string;
      errorRate: number;
    };
  }> {
    const connectionTest = await this.testConnection();
    const metrics = this.getMetrics();
    
    const errorRate = metrics.totalQueries > 0 
      ? (metrics.errorCount / metrics.totalQueries) * 100 
      : 0;
    
    const isHealthy = connectionTest && 
                     errorRate < 5 && // Menos de 5% de erro
                     metrics.avgQueryTime < 5000; // Menos de 5s de média
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      metrics,
      details: {
        connectionTest,
        poolStatus: `${metrics.totalConnections}/${RAILWAY_CONFIG.maxConnections} connections`,
        errorRate: Math.round(errorRate * 100) / 100
      }
    };
  }

  // Método para graceful shutdown
  async gracefulShutdown(): Promise<void> {
    console.log('[Pool] Iniciando graceful shutdown...');
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    try {
      // Fechar Prisma
      await this.prisma.$disconnect();
      console.log('[Pool] Prisma desconectado');
      
      // Fechar pool
      await this.pool.end();
      console.log('[Pool] Pool de conexões fechado');
      
      console.log('[Pool] Graceful shutdown concluído');
    } catch (error) {
      console.error('[Pool] Erro durante shutdown:', error);
    }
  }

  // Getters para acesso aos clientes
  get client(): PrismaClient {
    return this.prisma;
  }

  get pgPool(): Pool {
    return this.pool;
  }
}

// Singleton instance
let poolInstance: RailwayConnectionPool;

export function getRailwayPool(): RailwayConnectionPool {
  if (!poolInstance) {
    poolInstance = new RailwayConnectionPool();
  }
  return poolInstance;
}

// Export para uso direto
export const railwayPool = getRailwayPool();
export const prisma = railwayPool.client;

// Export tipos
export type { PoolMetrics };
export { RailwayConnectionPool };

// Configuração para Next.js API routes
export const config = {
  api: {
    externalResolver: true,
  },
};