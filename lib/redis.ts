// lib/redis.ts - Enhanced Redis with Clustering and Failover
import { createClient, createCluster } from 'redis';
import edgeLogger from './edge-logger';

// Interface para operações Redis comuns - Enhanced
interface RedisInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  sadd(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  expire(key: string, seconds: number): Promise<boolean>;
  flushAll(): Promise<string>;
  ping(): Promise<string>;
  isConnected(): boolean;
  getStats(): CacheStats;
}

// Interface para métricas de cache
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  operations: number;
  errors: number;
  uptime: number;
  connected: boolean;
  clusterNodes?: number;
}

// Classe MockRedis para simular operações Redis em memória - Enhanced
class MockRedis implements RedisInterface {
  private store: Map<string, { value: string; expiry?: number }> = new Map();
  private connected = true;
  private stats: CacheStats;
  private startTime = Date.now();

  constructor() {
    // Redis Mock: Usando cache em memória (Redis não disponível)
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      operations: 0,
      errors: 0,
      uptime: 0,
      connected: true,
    };
  }

  async get(key: string): Promise<string | null> {
    this.stats.operations++;
    
    const item = this.store.get(key);
    if (!item) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // Verifica se expirou
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    this.stats.hits++;
    this.updateHitRate();
    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<string | null> {
    const expiry = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    this.stats.operations++;
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) deleted++;
    }
    return deleted;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    
    // Verifica se expirou
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return 0;
    }
    
    return 1;
  }

  async flushAll(): Promise<string> {
    this.store.clear();
    return 'OK';
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  // Novos métodos para MockRedis
  async keys(pattern: string): Promise<string[]> {
    this.stats.operations++;
    const keys = Array.from(this.store.keys());
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    this.stats.operations++;
    const existing = this.store.get(key);
    const set = existing ? new Set(JSON.parse(existing.value)) : new Set();
    const initialSize = set.size;
    
    members.forEach(member => set.add(member));
    
    this.store.set(key, { value: JSON.stringify(Array.from(set)) });
    return set.size - initialSize;
  }

  async smembers(key: string): Promise<string[]> {
    this.stats.operations++;
    const item = this.store.get(key);
    if (!item) return [];
    
    try {
      return JSON.parse(item.value);
    } catch {
      return [];
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    this.stats.operations++;
    const item = this.store.get(key);
    if (!item) return false;
    
    item.expiry = Date.now() + (seconds * 1000);
    return true;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime,
      connected: this.connected,
    };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// Wrapper para Redis real com clustering e failover
class RealRedis implements RedisInterface {
  private client: ReturnType<typeof createClient> | ReturnType<typeof createCluster>;
  private connected = false;
  private stats: CacheStats;
  private startTime = Date.now();
  private isCluster: boolean;
  private fallbackClients: Array<ReturnType<typeof createClient>> = [];

  constructor(
    client: ReturnType<typeof createClient> | ReturnType<typeof createCluster>, 
    isCluster = false,
    fallbackClients: Array<ReturnType<typeof createClient>> = []
  ) {
    this.client = client;
    this.isCluster = isCluster;
    this.fallbackClients = fallbackClients;
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      operations: 0,
      errors: 0,
      uptime: 0,
      connected: false,
      clusterNodes: isCluster ? 1 : undefined,
    };
  }

  async get(key: string): Promise<string | null> {
    return await this.executeWithFallback(async (client) => {
      this.stats.operations++;
      const result = await client.get(key);
      
      if (result === null) {
        this.stats.misses++;
      } else {
        this.stats.hits++;
      }
      
      this.updateHitRate();
      return result;
    });
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<string | null> {
    if (options?.EX) {
      return await this.client.setEx(key, options.EX, value);
    }
    return await this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    return await this.executeWithFallback(async (client) => {
      this.stats.operations++;
      return await client.del(keys);
    });
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async flushAll(): Promise<string> {
    return await this.executeWithFallback(async (client) => {
      this.stats.operations++;
      return await client.sendCommand(['FLUSHDB']);
    });
  }

  async ping(): Promise<string> {
    return await this.executeWithFallback(async (client) => {
      this.stats.operations++;
      return await client.sendCommand(['PING']);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Novos métodos para RealRedis
  async keys(pattern: string): Promise<string[]> {
    return await this.executeWithFallback(async (client) => {
      this.stats.operations++;
      return await client.keys(pattern);
    });
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return await this.executeWithFallback(async (client) => {
      this.stats.operations++;
      return await client.sAdd(key, members);
    });
  }

  async smembers(key: string): Promise<string[]> {
    return await this.executeWithFallback(async (client) => {
      this.stats.operations++;
      return await client.sMembers(key);
    });
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return await this.executeWithFallback(async (client) => {
      this.stats.operations++;
      return await client.expire(key, seconds);
    });
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime,
      connected: this.connected,
    };
  }

  setConnected(status: boolean) {
    this.connected = status;
    this.stats.connected = status;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  // Executa operação com fallback para outros nós
  private async executeWithFallback<T>(
    operation: (client: any) => Promise<T>
  ): Promise<T> {
    try {
      return await operation(this.client);
    } catch (error) {
      this.stats.errors++;
      edgeLogger.warn('Redis operation failed, trying fallback', { error });
      
      // Tenta fallback clients
      for (const fallbackClient of this.fallbackClients) {
        try {
          if (fallbackClient.isReady) {
            return await operation(fallbackClient);
          }
        } catch (fallbackError) {
          edgeLogger.warn('Fallback client failed', { error: fallbackError });
        }
      }
      
      throw error;
    }
  }
}

// Declaração para garantir que a variável global do Redis seja reconhecida pelo TypeScript
const globalForRedis = globalThis as unknown as {
  redis: RedisInterface | undefined;
};

const createRedisClient = async (): Promise<RedisInterface> => {
  // Em ambiente de teste, sempre usar mock
  if (process.env.NODE_ENV === 'test') {
    return new MockRedis();
  }

  // Verifica se deve tentar conectar ao Redis
  const shouldTryRedis = process.env.REDIS_URL || process.env.NODE_ENV === 'production';
  
  if (!shouldTryRedis) {
    // Redis: Usando cache em memória (desenvolvimento local)
    return new MockRedis();
  }

  // Configuração do clustering
  const clusterNodes = process.env.REDIS_CLUSTER_NODES?.split(',') || [];
  const useCluster = clusterNodes.length > 1;

  try {
    if (useCluster) {
      // Configuração de cluster
      const cluster = createCluster({
        rootNodes: clusterNodes.map(node => ({
          url: node.trim(),
        })),
        defaults: {
          socket: {
            connectTimeout: 5000,
            reconnectStrategy: (retries) => {
              if (retries > 3) return false;
              return Math.min(retries * 200, 1000);
            },
          },
        },
      });

      const realRedis = new RealRedis(cluster, true);
      let connectionAttempted = false;

      cluster.on('error', (err) => {
        if (!connectionAttempted) {
          edgeLogger.error('Redis Cluster Error durante conexão inicial', err);
        }
        realRedis.setConnected(false);
      });

      cluster.on('connect', () => {
        edgeLogger.info('Redis Cluster: Conectado com sucesso');
        realRedis.setConnected(true);
      });

      connectionAttempted = true;
      
      await Promise.race([
        cluster.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cluster connection timeout')), 10000)
        )
      ]);

      // Testa a conexão usando um comando simples
      try {
        await cluster.get('__ping_test__');
        edgeLogger.info('Redis Cluster: Conexão testada com sucesso');
      } catch (error) {
        edgeLogger.info('Redis Cluster: Conexão estabelecida');
      }
      
      return realRedis;
      
    } else {
      // Configuração single node com fallbacks
      const mainClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 3000,
          reconnectStrategy: (retries) => {
            if (retries > 3) return false;
            return Math.min(retries * 200, 1000);
          },
        },
      });

      // Criar clientes de fallback se URLs fornecidas
      const fallbackUrls = process.env.REDIS_FALLBACK_URLS?.split(',') || [];
      const fallbackClients = fallbackUrls.map(url => 
        createClient({
          url: url.trim(),
          socket: {
            connectTimeout: 3000,
            reconnectStrategy: false,
          },
        })
      );

      const realRedis = new RealRedis(mainClient, false, fallbackClients);
      let connectionAttempted = false;

      mainClient.on('error', (err) => {
        if (!connectionAttempted) {
          edgeLogger.error('Redis Error durante conexão inicial', err);
        }
        realRedis.setConnected(false);
      });

      mainClient.on('connect', () => {
        edgeLogger.info('Redis: Conectado com sucesso');
        realRedis.setConnected(true);
      });

      // Conectar clientes de fallback
      for (const fallbackClient of fallbackClients) {
        try {
          await fallbackClient.connect();
          edgeLogger.info('Redis Fallback: Cliente conectado');
        } catch (error) {
          edgeLogger.warn('Redis Fallback: Falha na conexão', { error });
        }
      }

      connectionAttempted = true;
      
      // Tenta conectar com timeout mais curto
      await Promise.race([
        mainClient.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        )
      ]);

      // Testa a conexão usando um comando simples
      try {
        await mainClient.get('__ping_test__');
        edgeLogger.info('Redis: Conexão testada com sucesso');
      } catch (error) {
        edgeLogger.info('Redis: Conexão estabelecida');
      }
      
      return realRedis;
    }
  } catch (error) {
    edgeLogger.warn('Redis não disponível, usando cache em memória', { error });
    return new MockRedis();
  }
};

const redisClientSingleton = async (): Promise<RedisInterface> => {
  if (globalForRedis.redis) {
    return globalForRedis.redis;
  }

  const client = await createRedisClient();
  
  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = client;
  }

  return client;
};

// Exporta uma promise que resolve para o cliente Redis
const redis = redisClientSingleton();

export default redis;
