// src/lib/redis.ts - Build-safe Redis client
let redis: any = null;

// Create a mock redis client for build time
const mockRedis = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 0,
  exists: async () => 0,
  connect: async () => {},
  disconnect: async () => {},
  on: () => {},
  isReady: false
};

// Only create real Redis client at runtime if needed
if (typeof window === 'undefined' && process.env.REDIS_URL && process.env.NODE_ENV !== 'test') {
  try {
    const { createClient } = require('redis');
    
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: false // Prevent connection attempts during build
      }
    });
    
    client.on('error', (err: any) => console.error('Redis Client Error', err));
    
    redis = client;
  } catch (error) {
    console.warn('Redis not available, using mock client');
    redis = mockRedis;
  }
} else {
  redis = mockRedis;
}

export default redis;
