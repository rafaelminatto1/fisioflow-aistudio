// services/ai-economica/cacheService.ts
import { AIResponse, CacheEntry } from './types/ai-economica.types';

const CACHE_TTL = {
    PROTOCOL_SUGGESTION: 7 * 24 * 60 * 60 * 1000, // 7 days
    DIAGNOSIS_HELP: 30 * 24 * 60 * 60 * 1000, // 30 days
    EXERCISE_RECOMMENDATION: 14 * 24 * 60 * 60 * 1000, // 14 days
    GENERAL_QUESTION: 1 * 24 * 60 * 60 * 1000, // 1 day
};

class CacheService {
  private getCacheKey(key: string): string {
    return `ai_cache_${key}`;
  }

  private getDefaultTTL(responseType?: string): number {
    switch (responseType) {
      case 'protocol_suggestion': return CACHE_TTL.PROTOCOL_SUGGESTION;
      case 'diagnosis_help': return CACHE_TTL.DIAGNOSIS_HELP;
      case 'exercise_recommendation': return CACHE_TTL.EXERCISE_RECOMMENDATION;
      default: return CACHE_TTL.GENERAL_QUESTION;
    }
  }

  async set(key: string, response: AIResponse, ttl?: number): Promise<void> {
    const cacheEntry: CacheEntry = {
      key,
      response,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl || this.getDefaultTTL(response.queryId)), // Using queryId for type, assuming it's related
      accessCount: 0,
      lastAccessed: Date.now()
    };
    
    // Using localStorage for all cache for simplicity as IndexedDB implementation is not provided
    localStorage.setItem(this.getCacheKey(key), JSON.stringify(cacheEntry));
  }

  async get(key: string): Promise<AIResponse | null> {
    const localEntry = localStorage.getItem(this.getCacheKey(key));
    if (localEntry) {
      try {
        const entry: CacheEntry = JSON.parse(localEntry);
        if (entry.expiresAt > Date.now()) {
          entry.accessCount++;
          entry.lastAccessed = Date.now();
          localStorage.setItem(this.getCacheKey(key), JSON.stringify(entry));
          return entry.response;
        } else {
          localStorage.removeItem(this.getCacheKey(key));
        }
      } catch(e) {
        // Remove malformed entry
        localStorage.removeItem(this.getCacheKey(key));
      }
    }
    return null;
  }
  
  async cleanup(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('ai_cache_')) {
        try {
            const entry = JSON.parse(localStorage.getItem(key)!);
            if (entry.expiresAt <= Date.now()) {
              keysToRemove.push(key);
            }
        } catch (e) {
            keysToRemove.push(key); // Remove malformed entries
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

export const cacheService = new CacheService();