'use client';

import { cache } from '../cache';

export interface CacheConfig {
  ttl: number;
  staleWhileRevalidate?: number;
  maxAge?: number;
  tags?: string[];
}

export class AdvancedCache {
  private static instance: AdvancedCache;
  private memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestCache = new Map<string, Promise<any>>();

  static getInstance(): AdvancedCache {
    if (!AdvancedCache.instance) {
      AdvancedCache.instance = new AdvancedCache();
    }
    return AdvancedCache.instance;
  }

  // Multi-layer caching: Memory -> Redis -> Database
  async get<T>(key: string, config: CacheConfig): Promise<T | null> {
    // Layer 1: Memory cache
    const memoryData = this.getFromMemory<T>(key);
    if (memoryData) return memoryData;

    // Layer 2: Redis cache
    try {
      const redisData = await cache.get<T>(key);
      if (redisData) {
        // Store in memory for faster next access
        this.setInMemory(key, redisData, config.ttl);
        return redisData;
      }
    } catch (error) {
      console.warn('Redis cache miss:', error);
    }

    return null;
  }

  async set<T>(key: string, data: T, config: CacheConfig): Promise<void> {
    // Store in memory
    this.setInMemory(key, data, config.ttl);

    // Store in Redis with TTL
    try {
      await cache.set(key, data, { ttl: config.ttl });
    } catch (error) {
      console.warn('Redis cache set failed:', error);
    }
  }

  // Request-level caching to prevent duplicate API calls
  async withRequestCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Check if request is already in flight
    if (this.requestCache.has(key)) {
      return this.requestCache.get(key)!;
    }

    // Start the request and cache the promise
    const promise = this.executeWithCache(key, fetcher, config);
    this.requestCache.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up the request cache
      this.requestCache.delete(key);
    }
  }

  private async executeWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, config);
    if (cached) return cached;

    // Execute fetcher and cache result
    const data = await fetcher();
    await this.set(key, data, config);
    return data;
  }

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl * 1000) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.data;
  }

  private setInMemory<T>(key: string, data: T, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Auto-cleanup expired entries
    setTimeout(() => {
      this.memoryCache.delete(key);
    }, ttl * 1000);
  }

  // Cache invalidation by tags
  async invalidateByTag(tag: string): Promise<void> {
    // Clear memory cache entries with this tag
    for (const [key, value] of Array.from(this.memoryCache.entries())) {
      // This would require storing tags with data - simplified for now
      if (key.includes(tag)) {
        this.memoryCache.delete(key);
      }
    }

    try {
      // Note: Pattern-based Redis invalidation not available with current cache
      console.warn(`Redis invalidation for tag ${tag} not supported with current cache implementation`);
    } catch (error) {
      console.warn('Redis invalidation failed:', error);
    }
  }

  // Background revalidation
  async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<void> {
    try {
      const freshData = await fetcher();
      await this.set(key, freshData, config);
    } catch (error) {
      console.warn('Background revalidation failed:', error);
    }
  }

  // Bulk operations for better performance
  async getBulk<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    // Get from memory first
    const memoryResults = keys.map(key => ({
      key,
      data: this.getFromMemory<T>(key)
    }));

    const missingKeys = memoryResults
      .filter(item => item.data === null)
      .map(item => item.key);

    // Add memory hits to results
    memoryResults
      .filter(item => item.data !== null)
      .forEach(item => results.set(item.key, item.data));

    // Fetch missing keys from Redis
    if (missingKeys.length > 0) {
      try {
        // Fallback to individual gets since getBulk not available
        const redisResults = new Map();
        for (const key of missingKeys) {
          const value = await cache.get(key);
          redisResults.set(key, value);
        }
        redisResults.forEach((value, key) => {
          results.set(key, value);
          if (value) {
            this.setInMemory(key, value, 300); // Default TTL
          }
        });
      } catch (error) {
        console.warn('Redis bulk get failed:', error);
        // Set null for missing keys
        missingKeys.forEach(key => results.set(key, null));
      }
    }

    return results;
  }

  // Cache statistics for monitoring
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      requestsInFlight: this.requestCache.size,
      memoryKeys: Array.from(this.memoryCache.keys()),
    };
  }

  // Clear all caches
  clear(): void {
    this.memoryCache.clear();
    this.requestCache.clear();
  }
}

// Singleton instance
export const advancedCache = AdvancedCache.getInstance();

// React hook for cache-aware data fetching
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = { ttl: 300 }
) {
  return {
    getData: () => advancedCache.withRequestCache(key, fetcher, config),
    invalidate: () => advancedCache.invalidateByTag(key),
    revalidate: () => advancedCache.revalidateInBackground(key, fetcher, config),
  };
}

// Cache decorators for API routes
export function withCache(config: CacheConfig) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      return advancedCache.withRequestCache(
        cacheKey,
        () => method.apply(this, args),
        config
      );
    };
  };
}