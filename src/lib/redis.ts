// src/lib/redis.ts - Build-safe Redis client
type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<string>;
  del: (key: string) => Promise<number>;
  exists: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (err?: Error) => void) => void;
  isReady: boolean;
};

let redis: RedisClient;

// Create a mock redis client for build time
const mockRedis: RedisClient = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 0,
  exists: async () => 0,
  incr: async () => 1,
  expire: async () => 1,
  connect: async () => {},
  disconnect: async () => {},
  on: () => {},
  isReady: false
};

// Only create real Redis client at runtime if needed
async function initializeRedis() {
  if (typeof window === 'undefined' && process.env.REDIS_URL && process.env.NODE_ENV !== 'test') {
    try {
      const { createClient } = await import('redis');
      
      const client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: false // Prevent connection attempts during build
        }
      });
      
      client.on('error', (err: Error) => console.error('Redis Client Error', err));
      
      return client;
    } catch (error) {
      console.warn('Redis not available, using mock client');
      return mockRedis;
    }
  } else {
    return mockRedis;
  }
}

// Initialize Redis lazily
redis = mockRedis;

export default redis;
