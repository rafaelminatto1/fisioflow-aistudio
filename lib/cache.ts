// lib/cache.ts
import redis from './redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export class CacheManager {
  private prefix: string;
  
  constructor(prefix = 'fisioflow') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.getKey(key);
      const serialized = JSON.stringify(value);
      
      if (options.ttl) {
        await redis.set(cacheKey, serialized, { EX: options.ttl });
      } else {
        await redis.set(cacheKey, serialized);
      }

      // Store tags for later invalidation
      if (options.tags) {
        for (const tag of options.tags) {
          const tagKey = this.getKey(`tag:${tag}`);
          await redis.sadd(tagKey, cacheKey);
          if (options.ttl) {
            await redis.expire(tagKey, options.ttl + 300); // Tag lives 5 minutes longer
          }
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redis.del(this.getKey(key));
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidateTag(tag: string): Promise<void> {
    try {
      const tagKey = this.getKey(`tag:${tag}`);
      const keys = await redis.smembers(tagKey);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        await redis.del(tagKey);
      }
    } catch (error) {
      console.error('Cache tag invalidation error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.prefix}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Utility method for caching function results
  async remember<T>(
    key: string, 
    callback: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    let cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const result = await callback();
    await this.set(key, result, options);
    return result;
  }

  // Cache with automatic refresh
  async rememberForever<T>(
    key: string,
    callback: () => Promise<T>,
    refreshInterval = 3600 // 1 hour
  ): Promise<T> {
    const refreshKey = `${key}:refresh`;
    const lastRefresh = await redis.get(this.getKey(refreshKey));
    const now = Date.now();
    
    let cached = await this.get<T>(key);
    
    // If no cache or refresh needed
    if (!cached || !lastRefresh || now - parseInt(lastRefresh) > refreshInterval * 1000) {
      try {
        const result = await callback();
        await this.set(key, result);
        await redis.set(this.getKey(refreshKey), now.toString());
        return result;
      } catch (error) {
        // If callback fails, return cached value if available
        if (cached) return cached;
        throw error;
      }
    }

    return cached;
  }
}

// Pre-configured cache managers for different data types
export const patientCache = new CacheManager('patients');
export const appointmentCache = new CacheManager('appointments');
export const reportCache = new CacheManager('reports');
export const analyticsCache = new CacheManager('analytics');

export const cache = new CacheManager();

export default cache;