// src/lib/redis.ts
import { createClient } from 'redis';

declare global {
  var redis: ReturnType<typeof createClient> | undefined;
}

const redisClientSingleton = () => {
  const client = createClient({
    url: process.env.REDIS_URL,
  });
  
  client.on('error', (err) => console.error('Redis Client Error', err));
  
  client.connect().catch(console.error);

  return client;
};

const redis = globalThis.redis ?? redisClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.redis = redis;
}

export default redis;
