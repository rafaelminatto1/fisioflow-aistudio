import { AIResponse } from '../../types';

interface CacheEntry {
  response: AIResponse;
  expiry: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class CacheService {
  private getCacheKey(prompt: string): string {
    // Simple key for demonstration. In a real app, a hash would be better.
    return `fisioflow_ai_cache_${prompt.toLowerCase().trim()}`;
  }

  /**
   * Retrieves a response from the session cache if it exists and is not expired.
   * @param prompt The original user prompt.
   * @returns The cached AIResponse or null.
   */
  get(prompt: string): AIResponse | null {
    const key = this.getCacheKey(prompt);
    const item = sessionStorage.getItem(key);
    if (!item) {
      return null;
    }

    try {
      const entry: CacheEntry = JSON.parse(item);
      if (Date.now() > entry.expiry) {
        sessionStorage.removeItem(key);
        return null;
      }
      return entry.response;
    } catch (error) {
      console.error('Failed to parse cache entry:', error);
      return null;
    }
  }

  /**
   * Stores an AI response in the session cache with an expiry time.
   * @param prompt The original user prompt.
   * @param response The AIResponse to cache.
   */
  set(prompt: string, response: AIResponse): void {
    const key = this.getCacheKey(prompt);
    const entry: CacheEntry = {
      response,
      expiry: Date.now() + CACHE_TTL_MS,
    };

    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Failed to set cache entry:', error);
    }
  }
}

// Export a singleton instance of the service
export const cacheService = new CacheService();
