// lib/cache.ts - Enhanced Multi-Layer Cache System
import redis from './redis';
import edgeLogger from './edge-logger';

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
    // 100MB default
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

    // Cleanup expired memory cache periodically
    setInterval(() => this.cleanupMemoryCache(), 60000); // Every minute
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
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

      // Try memory cache first (L1)
      if (layer === 'memory' || layer === 'both') {
        const memoryResult = this.getFromMemory<T>(cacheKey);
        if (memoryResult !== null) {
          this.metrics.hits++;
          this.metrics.memoryHits++;
          this.updateMetrics(Date.now() - startTime);
          return memoryResult;
        }
      }

      // Try Redis cache (L2)
      if (layer === 'redis' || layer === 'both') {
        const redisClient = await redis;
        const value = await redisClient.get(cacheKey);

        if (value) {
          const parsed = this.deserialize<T>(value, options.serialize);

          // Store in memory for faster future access
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
      edgeLogger.error(
        `Cache get error for key ${key} with prefix ${this.prefix}`,
        error instanceof Error ? error : new Error(String(error))
      );
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
      const serialized = this.serialize(
        value,
        options.serialize,
        options.compress
      );

      // Set in memory cache (L1)
      if (layer === 'memory' || layer === 'both') {
        this.setInMemory(cacheKey, value, options.ttl);
      }

      // Set in Redis cache (L2)
      if (layer === 'redis' || layer === 'both') {
        const redisClient = await redis;

        await redisClient.set(cacheKey, serialized);
        if (options.ttl) {
          await redisClient.expire(cacheKey, options.ttl);
        }

        // Note: Tag functionality not available with current Redis client mock
      }

      this.updateMetrics(Date.now() - startTime);
    } catch (error) {
      this.metrics.errors++;
      edgeLogger.error(
        `Cache set error for key ${key} with prefix ${this.prefix}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async del(key: string): Promise<void> {
    const startTime = Date.now();
    this.metrics.operations++;

    try {
      const cacheKey = this.getKey(key);

      // Delete from memory
      const memoryItem = this.memoryCache.get(cacheKey);
      if (memoryItem) {
        this.currentMemorySize -= memoryItem.size;
        this.memoryCache.delete(cacheKey);
      }

      // Delete from Redis
      const redisClient = await redis;
      await redisClient.del(cacheKey);

      this.updateMetrics(Date.now() - startTime);
    } catch (error) {
      this.metrics.errors++;
      edgeLogger.error(
        `Cache delete error for key ${key} with prefix ${this.prefix}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async invalidateTag(tag: string): Promise<void> {
    const startTime = Date.now();
    this.metrics.operations++;

    try {
      const redisClient = await redis;
      const tagKey = this.getKey(`tag:${tag}`);
      // Note: Tag-based invalidation not available with mock Redis client
      // For now, we skip Redis tag invalidation
      edgeLogger.warn(`Tag invalidation for '${tag}' skipped - Redis mock client limited`);

      this.updateMetrics(Date.now() - startTime);
      edgeLogger.info('Cache tag invalidation skipped', { tag });
    } catch (error) {
      this.metrics.errors++;
      edgeLogger.error(
        `Cache tag invalidation error for tag ${tag}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  async clear(): Promise<void> {
    const startTime = Date.now();
    this.metrics.operations++;

    try {
      // Clear memory cache
      this.memoryCache.clear();
      this.currentMemorySize = 0;

      // Clear Redis cache
      const redisClient = await redis;
      // Note: keys() and del(...) not supported by mock Redis client
      edgeLogger.warn('Cache clear skipped - Redis mock client limited');

      this.updateMetrics(Date.now() - startTime);
      edgeLogger.info('Cache cleared', {
        prefix: this.prefix,
        memoryKeysCleared: this.memoryCache.size,
      });
    } catch (error) {
      this.metrics.errors++;
      edgeLogger.error(
        `Cache clear error for prefix ${this.prefix}`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Utility method for caching function results
  async remember<T>(
    key: string,
    callback: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const result = await callback();
    await this.set(key, result, options);
    return result;
  }

  // Cache with automatic refresh - Enhanced
  async rememberForever<T>(
    key: string,
    callback: () => Promise<T>,
    refreshInterval = 3600, // 1 hour
    options: CacheOptions = {}
  ): Promise<T> {
    const refreshKey = `${key}:refresh`;
    const redisClient = await redis;
    const lastRefresh = await redisClient.get(this.getKey(refreshKey));
    const now = Date.now();

    const cached = await this.get<T>(key, options);

    // If no cache or refresh needed
    if (
      !cached ||
      !lastRefresh ||
      now - parseInt(lastRefresh) > refreshInterval * 1000
    ) {
      try {
        const result = await callback();
        await this.set(key, result, options);
        await redisClient.set(this.getKey(refreshKey), now.toString());
        return result;
      } catch (error) {
        // If callback fails, return cached value if available
        if (cached) return cached;
        throw error;
      }
    }

    return cached;
  }

  // New methods for enhanced cache management

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    // Check expiry
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

    // Check memory limit
    if (this.currentMemorySize + size > this.maxMemorySize) {
      this.evictMemoryCache(size);
    }

    const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
    this.memoryCache.set(key, { value, expiry, size });
    this.currentMemorySize += size;
  }

  private evictMemoryCache(neededSize: number): void {
    const entries = Array.from(this.memoryCache.entries());

    // Sort by expiry (oldest first)
    entries.sort((a, b) => {
      const aExpiry = a[1].expiry || Infinity;
      const bExpiry = b[1].expiry || Infinity;
      return aExpiry - bExpiry;
    });

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

  private serialize(
    value: any,
    method: 'json' | 'msgpack' = 'json',
    compress = false
  ): string {
    let serialized = JSON.stringify(value); // Default to JSON for now

    //  Add msgpack and compression support
    if (method === 'msgpack') {
      // Placeholder for msgpack serialization
      serialized = JSON.stringify(value);
    }

    if (compress && serialized.length > 1024) {
      //  Add compression support (gzip/brotli)
      // For now, just return as-is
    }

    return serialized;
  }

  private deserialize<T>(
    value: string,
    method: 'json' | 'msgpack' = 'json'
  ): T {
    //  Add proper deserialization logic
    return JSON.parse(value);
  }

  private updateMetrics(responseTime: number): void {
    this.responseTimes.push(responseTime);

    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    this.metrics.avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    const totalOperations = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate =
      totalOperations > 0 ? (this.metrics.hits / totalOperations) * 100 : 0;
    this.metrics.totalSize = this.currentMemorySize;
  }

  // Public methods for monitoring
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  async getRedisStats() {
    try {
      const redisClient = await redis;
      // return redisClient.getStats(); // Not supported by mock Redis client
      return { message: 'Redis stats not available with mock client' };
    } catch (error) {
      edgeLogger.error(
        'Failed to get Redis stats',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  // Batch operations for better performance
  async mget<T>(
    keys: string[],
    options: Partial<CacheOptions> = {}
  ): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key, options)));
  }

  async mset<T>(
    entries: Array<{ key: string; value: T }>,
    options: CacheOptions = {}
  ): Promise<void> {
    await Promise.all(
      entries.map(entry => this.set(entry.key, entry.value, options))
    );
  }
}

// Pre-configured cache managers for different data types - Enhanced
export const patientCache = new CacheManager('patients', 50 * 1024 * 1024); // 50MB for patients
export const appointmentCache = new CacheManager(
  'appointments',
  30 * 1024 * 1024
); // 30MB for appointments
export const reportCache = new CacheManager('reports', 100 * 1024 * 1024); // 100MB for reports
export const analyticsCache = new CacheManager('analytics', 200 * 1024 * 1024); // 200MB for analytics
export const sessionCache = new CacheManager('sessions', 20 * 1024 * 1024); // 20MB for sessions
export const queryCache = new CacheManager('queries', 150 * 1024 * 1024); // 150MB for database queries

export const cache = new CacheManager('default', 100 * 1024 * 1024);

// Cache warming and preloading utilities
export class CacheWarmer {
  static async warmPatientCache(): Promise<void> {
    edgeLogger.info('Starting patient cache warming');
    //  Implement cache warming logic
  }

  static async warmAppointmentCache(): Promise<void> {
    edgeLogger.info('Starting appointment cache warming');
    //  Implement cache warming logic
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
  // Patient-related cache keys
  patient: (id: string) => ({
    key: `patient:${id}`,
    tags: ['patients', `patient:${id}`],
  }),

  patientAppointments: (patientId: string) => ({
    key: `patient:${patientId}:appointments`,
    tags: ['appointments', 'patients', `patient:${patientId}`],
  }),

  // Appointment-related cache keys
  appointment: (id: string) => ({
    key: `appointment:${id}`,
    tags: ['appointments', `appointment:${id}`],
  }),

  dailyAppointments: (date: string) => ({
    key: `appointments:daily:${date}`,
    tags: ['appointments', 'daily-schedule'],
  }),

  // Report-related cache keys
  patientReport: (patientId: string, reportType: string) => ({
    key: `report:${patientId}:${reportType}`,
    tags: ['reports', `patient:${patientId}`, reportType],
  }),

  // Analytics cache keys
  dashboardMetrics: (timeframe: string) => ({
    key: `analytics:dashboard:${timeframe}`,
    tags: ['analytics', 'dashboard'],
  }),
};

export default cache;
