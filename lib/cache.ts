// lib/cache.ts - Enhanced Multi-Layer Cache System
import redis from './redis';
import edgeLogger from './edge-logger';
import { encode, decode } from '@msgpack/msgpack';
import { gzipSync, gunzipSync } from 'zlib';

const COMPRESSION_THRESHOLD = 1024; // 1KB

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  layer?: 'memory' | 'redis' | 'both'; // Cache layer strategy
  compress?: boolean; // Compress large values
  serialize?: 'json' | 'msgpack'; // Serialization method
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  memoryHits: number;
  redisHits: number;
  operations: number;
  errors: number;
  avgResponseTime: number;
  totalSize: number;
}

export interface CacheKey {
  key: string;
  hash?: string;
  version?: string;
}

export class CacheManager {
  private prefix: string;
  private memoryCache: Map<
    string,
    { value: any; expiry?: number; size: number }
  > = new Map();
  private metrics: CacheMetrics;
  private maxMemorySize: number;
  private currentMemorySize: number = 0;
  private responseTimes: number[] = [];

  constructor(prefix = 'fisioflow', maxMemorySize = 100 * 1024 * 1024) {
    this.prefix = prefix;
    this.maxMemorySize = maxMemorySize;
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      memoryHits: 0,
      redisHits: 0,
      operations: 0,
      errors: 0,
      avgResponseTime: 0,
      totalSize: 0,
    };
    setInterval(() => this.cleanupMemoryCache(), 60000);
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private getTagKey(tag: string): string {
    return `${this.prefix}:tag:${tag}`;
  }

  async get<T>(
    key: string,
    options: Partial<CacheOptions> = {}
  ): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.operations++;

    try {
      const cacheKey = this.getKey(key);
      const layer = options.layer || 'both';

      if (layer === 'memory' || layer === 'both') {
        const memoryResult = this.getFromMemory<T>(cacheKey);
        if (memoryResult !== null) {
          this.metrics.hits++;
          this.metrics.memoryHits++;
          this.updateMetrics(Date.now() - startTime);
          return memoryResult;
        }
      }

      if (layer === 'redis' || layer === 'both') {
        const value = await redis.getBuffer(cacheKey);
        if (value) {
          const parsed = this.deserialize<T>(value);
          if (layer === 'both') {
            this.setInMemory(cacheKey, parsed, options.ttl);
          }
          this.metrics.hits++;
          this.metrics.redisHits++;
          this.updateMetrics(Date.now() - startTime);
          return parsed;
        }
      }

      this.metrics.misses++;
      this.updateMetrics(Date.now() - startTime);
      return null;
    } catch (error) {
      this.metrics.errors++;
      edgeLogger.error(`Cache get error for key ${key}`, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const startTime = Date.now();
    this.metrics.operations++;

    try {
      const cacheKey = this.getKey(key);
      const layer = options.layer || 'both';
      const serialized = this.serialize(value, options.serialize, options.compress);

      if (layer === 'memory' || layer === 'both') {
        this.setInMemory(cacheKey, value, options.ttl);
      }

      if (layer === 'redis' || layer === 'both') {
        const pipeline = redis.pipeline();
        pipeline.set(cacheKey, serialized);
        if (options.ttl) {
          pipeline.expire(cacheKey, options.ttl);
        }
        if (options.tags && options.tags.length > 0) {
          for (const tag of options.tags) {
            pipeline.sadd(this.getTagKey(tag), cacheKey);
          }
        }
        await pipeline.exec();
      }

      this.updateMetrics(Date.now() - startTime);
    } catch (error) {
      this.metrics.errors++;
      edgeLogger.error(`Cache set error for key ${key}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  async del(key: string): Promise<void> {
    const startTime = Date.now();
    this.metrics.operations++;
    try {
      const cacheKey = this.getKey(key);
      const memoryItem = this.memoryCache.get(cacheKey);
      if (memoryItem) {
        this.currentMemorySize -= memoryItem.size;
        this.memoryCache.delete(cacheKey);
      }
      await redis.del(cacheKey);
      this.updateMetrics(Date.now() - startTime);
    } catch (error) {
      this.metrics.errors++;
      edgeLogger.error(`Cache delete error for key ${key}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  async invalidateTag(tag: string): Promise<void> {
    const startTime = Date.now();
    this.metrics.operations++;
    try {
      const tagKey = this.getTagKey(tag);
      const keysToDelete = await redis.smembers(tagKey);
      if (keysToDelete.length > 0) {
        for (const key of keysToDelete) {
          const memoryItem = this.memoryCache.get(key);
          if (memoryItem) {
            this.currentMemorySize -= memoryItem.size;
            this.memoryCache.delete(key);
          }
        }
        const pipeline = redis.pipeline();
        pipeline.del(keysToDelete);
        pipeline.del(tagKey);
        await pipeline.exec();
      }
      this.updateMetrics(Date.now() - startTime);
      edgeLogger.info(`Cache tag invalidated successfully`, { tag, count: keysToDelete.length });
    } catch (error) {
      this.metrics.errors++;
      edgeLogger.error(`Cache tag invalidation error for tag ${tag}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  async clear(): Promise<void> {
    const startTime = Date.now();
    this.metrics.operations++;
    try {
      const memoryKeysCleared = this.memoryCache.size;
      this.memoryCache.clear();
      this.currentMemorySize = 0;
      const stream = redis.scanStream({ match: `${this.prefix}:*`, count: 100 });
      let keysToDelete: string[] = [];
      let redisKeysCleared = 0;
      for await (const keys of stream) {
        if (keys.length > 0) {
          keysToDelete.push(...keys);
          if (keysToDelete.length >= 500) {
            await redis.del(keysToDelete);
            redisKeysCleared += keysToDelete.length;
            keysToDelete = [];
          }
        }
      }
      if (keysToDelete.length > 0) {
        await redis.del(keysToDelete);
        redisKeysCleared += keysToDelete.length;
      }
      this.updateMetrics(Date.now() - startTime);
      edgeLogger.info('Cache cleared successfully', { prefix: this.prefix, memoryKeysCleared, redisKeysCleared });
    } catch (error) {
      this.metrics.errors++;
      edgeLogger.error(`Cache clear error for prefix ${this.prefix}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  async remember<T>(
    key: string,
    callback: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) return cached;
    const result = await callback();
    await this.set(key, result, options);
    return result;
  }

  async rememberForever<T>(
    key: string,
    callback: () => Promise<T>,
    refreshInterval = 3600,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    const refreshKey = this.getKey(`${key}:refresh`);
    const lastRefresh = await redis.get(refreshKey);
    const now = Date.now();

    const needsRefresh = !lastRefresh || now - parseInt(lastRefresh) > refreshInterval * 1000;

    if (needsRefresh) {
      // This key needs a refresh. If we have stale data, we can serve it while we refresh in the background.
      // If not, we must wait for the data to be generated.
      const lockKey = this.getKey(`${key}:lock`);
      const lockAcquired = await redis.set(lockKey, '1', 'EX', 30, 'NX');

      if (lockAcquired) {
        try {
          edgeLogger.info(`Lock acquired for ${key}. Regenerating cache.`);
          const result = await callback();
          await this.set(key, result, options);
          await redis.set(refreshKey, now.toString());
          return result;
        } catch (error) {
          // If regeneration fails, return stale data if we have it.
          if (cached) {
            edgeLogger.warn(`Cache regeneration failed for ${key}. Serving stale data.`, error);
            return cached;
          }
          throw error;
        } finally {
          // Always release the lock
          await redis.del(lockKey);
        }
      } else {
        // Could not acquire lock, another process is regenerating.
        // We can wait a bit and poll, or just return stale data if available.
        if (cached) {
          edgeLogger.info(`Could not acquire lock for ${key}. Serving stale data while regeneration occurs.`);
          return cached;
        }
        // If there's no stale data, we must wait.
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
        return this.rememberForever(key, callback, refreshInterval, options); // Retry the whole logic
      }
    }

    return cached as T; // We know cached is not null here because needsRefresh is false
  }

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.currentMemorySize -= item.size;
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  private setInMemory<T>(key: string, value: T, ttl?: number): void {
    const serialized = JSON.stringify(value);
    const size = new Blob([serialized]).size;
    if (this.currentMemorySize + size > this.maxMemorySize) {
      this.evictMemoryCache(size);
    }
    const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
    this.memoryCache.set(key, { value, expiry, size });
    this.currentMemorySize += size;
  }

  private evictMemoryCache(neededSize: number): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => (a[1].expiry || Infinity) - (b[1].expiry || Infinity));
    let freedSpace = 0;
    for (const [key, item] of entries) {
      this.memoryCache.delete(key);
      freedSpace += item.size;
      this.currentMemorySize -= item.size;
      if (freedSpace >= neededSize) break;
    }
    edgeLogger.info('Memory cache evicted', { freedSpace, neededSize });
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleanedSize = 0;
    let cleanedCount = 0;
    for (const [key, item] of Array.from(this.memoryCache.entries())) {
      if (item.expiry && now > item.expiry) {
        cleanedSize += item.size;
        cleanedCount++;
        this.memoryCache.delete(key);
      }
    }
    this.currentMemorySize -= cleanedSize;
    if (cleanedCount > 0) {
      edgeLogger.debug('Memory cache cleanup', { cleanedCount, cleanedSize });
    }
  }

  private serialize(value: any, method: 'json' | 'msgpack' = 'msgpack', compress = true): Buffer {
    let data: Uint8Array;
    if (method === 'json') {
      const jsonString = JSON.stringify(value);
      data = Buffer.from(jsonString, 'utf-8');
    } else {
      data = encode(value);
    }
    const isCompressed = compress && data.length > COMPRESSION_THRESHOLD;
    const finalData = isCompressed ? gzipSync(data) : data;
    const header = (method === 'json' ? 1 : 0) | (isCompressed ? 2 : 0);
    return Buffer.concat([Buffer.from([header]), finalData]);
  }

  private deserialize<T>(buffer: Buffer): T {
    const header = buffer[0];
    const method = (header & 1) === 1 ? 'json' : 'msgpack';
    const isCompressed = (header & 2) === 2;
    let data = buffer.slice(1);
    if (isCompressed) {
      data = gunzipSync(data);
    }
    if (method === 'json') {
      return JSON.parse(data.toString('utf-8'));
    } else {
      return decode(data) as T;
    }
  }

  private updateMetrics(responseTime: number): void {
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
    this.metrics.avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    const totalOperations = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = totalOperations > 0 ? (this.metrics.hits / totalOperations) * 100 : 0;
    this.metrics.totalSize = this.currentMemorySize;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  async getRedisStats() {
    try {
      return await redis.info();
    } catch (error) {
      edgeLogger.error('Failed to get Redis stats', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async mget<T>(keys: string[], options: Partial<CacheOptions> = {}): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key, options)));
  }

  async mset<T>(entries: Array<{ key: string; value: T }>, options: CacheOptions = {}): Promise<void> {
    await Promise.all(entries.map(entry => this.set(entry.key, entry.value, options)));
  }
}

// Pre-configured cache managers for different data types - Enhanced
export const patientCache = new CacheManager('patients', 50 * 1024 * 1024);
export const appointmentCache = new CacheManager('appointments', 30 * 1024 * 1024);
export const reportCache = new CacheManager('reports', 100 * 1024 * 1024);
export const analyticsCache = new CacheManager('analytics', 200 * 1024 * 1024);
export const sessionCache = new CacheManager('sessions', 20 * 1024 * 1024);
export const queryCache = new CacheManager('queries', 150 * 1024 * 1024);
export const cache = new CacheManager('default', 100 * 1024 * 1024);

// Cache warming and preloading utilities
export class CacheWarmer {
  static async warmPatientCache(): Promise<void> {
    edgeLogger.info('Starting patient cache warming');
  }
  static async warmAppointmentCache(): Promise<void> {
    edgeLogger.info('Starting appointment cache warming');
  }
  static async getSystemCacheStats(): Promise<any> {
    return {
      patients: patientCache.getMetrics(),
      appointments: appointmentCache.getMetrics(),
      reports: reportCache.getMetrics(),
      analytics: analyticsCache.getMetrics(),
      sessions: sessionCache.getMetrics(),
      queries: queryCache.getMetrics(),
      default: cache.getMetrics(),
      redis: await cache.getRedisStats(),
    };
  }
}

// Smart cache invalidation patterns
export const CachePatterns = {
  patient: (id: string) => ({ key: `patient:${id}`, tags: ['patients', `patient:${id}`] }),
  patientAppointments: (patientId: string) => ({ key: `patient:${patientId}:appointments`, tags: ['appointments', 'patients', `patient:${patientId}`] }),
  appointment: (id: string) => ({ key: `appointment:${id}`, tags: ['appointments', `appointment:${id}`] }),
  dailyAppointments: (date: string) => ({ key: `appointments:daily:${date}`, tags: ['appointments', 'daily-schedule'] }),
  patientReport: (patientId: string, reportType: string) => ({ key: `report:${patientId}:${reportType}`, tags: ['reports', `patient:${patientId}`, reportType] }),
  dashboardMetrics: (timeframe: string) => ({ key: `analytics:dashboard:${timeframe}`, tags: ['analytics', 'dashboard'] }),
};

export default cache;
