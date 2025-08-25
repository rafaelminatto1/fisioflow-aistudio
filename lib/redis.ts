// lib/redis.ts
import { createClient } from 'redis';

// Interface para operações Redis comuns
interface RedisInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  flushAll(): Promise<string>;
  ping(): Promise<string>;
  isConnected(): boolean;
}

// Classe MockRedis para simular operações Redis em memória
class MockRedis implements RedisInterface {
  private store: Map<string, { value: string; expiry?: number }> = new Map();
  private connected = true;

  constructor() {
    // Redis Mock: Usando cache em memória (Redis não disponível)
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    // Verifica se expirou
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<string | null> {
    const expiry = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
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

  isConnected(): boolean {
    return this.connected;
  }
}

// Wrapper para Redis real
class RealRedis implements RedisInterface {
  private client: ReturnType<typeof createClient>;
  private connected = false;

  constructor(client: ReturnType<typeof createClient>) {
    this.client = client;
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<string | null> {
    if (options?.EX) {
      return await this.client.setEx(key, options.EX, value);
    }
    return await this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async flushAll(): Promise<string> {
    return await this.client.flushAll();
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  isConnected(): boolean {
    return this.connected && this.client.isReady;
  }

  setConnected(status: boolean) {
    this.connected = status;
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

  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 3000,
        lazyConnect: true,
        reconnectStrategy: false, // Desabilita reconexão automática
      },
    });

    const realRedis = new RealRedis(client);
    let connectionAttempted = false;

    client.on('error', (err) => {
      if (!connectionAttempted) {
        // Redis Error durante conexão inicial
      }
      realRedis.setConnected(false);
    });

    client.on('connect', () => {
      // Redis: Conectado com sucesso
      realRedis.setConnected(true);
    });

    connectionAttempted = true;
    
    // Tenta conectar com timeout mais curto
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      )
    ]);

    // Testa a conexão
    await client.ping();
    // Redis: Conexão testada com sucesso
    
    return realRedis;
  } catch (error) {
    // Redis não disponível, usando cache em memória
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
