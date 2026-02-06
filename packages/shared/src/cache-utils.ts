// Caching utilities for Cloudflare KV and browser storage

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  namespace?: string;
}

/**
 * Cache key builder
 */
export function buildCacheKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

/**
 * KV cache wrapper for Cloudflare Workers
 */
export class KVCache {
  constructor(
    private kv: KVNamespace,
    private namespace: string = 'cache'
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const cacheKey = buildCacheKey(this.namespace, key);
    const value = await this.kv.get(cacheKey, 'json');
    return value as T | null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const cacheKey = buildCacheKey(this.namespace, key);
    await this.kv.put(cacheKey, JSON.stringify(value), {
      expirationTtl: ttl,
    });
  }

  async delete(key: string): Promise<void> {
    const cacheKey = buildCacheKey(this.namespace, key);
    await this.kv.delete(cacheKey);
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}

/**
 * Browser cache wrapper using localStorage with TTL
 */
export class BrowserCache {
  constructor(private namespace: string = 'cache') {}

  private getCacheKey(key: string): string {
    return buildCacheKey(this.namespace, key);
  }

  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const item = localStorage.getItem(cacheKey);
      if (!item) return null;

      const { value, expiry } = JSON.parse(item);
      if (expiry && Date.now() > expiry) {
        this.delete(key);
        return null;
      }

      return value as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
      localStorage.setItem(cacheKey, JSON.stringify({ value, expiry }));
    } catch (error) {
      // Handle quota exceeded or other errors
      console.warn('Cache set failed:', error);
    }
  }

  delete(key: string): void {
    const cacheKey = this.getCacheKey(key);
    localStorage.removeItem(cacheKey);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    const prefix = `${this.namespace}:`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }
}

/**
 * Memory cache for short-term caching
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; expiry: number | null }>();

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiry });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Cache strategies
 */
export const CACHE_STRATEGIES = {
  // Short-term cache for frequently accessed data
  SHORT: { ttl: 60 }, // 1 minute

  // Medium-term cache for semi-static data
  MEDIUM: { ttl: 300 }, // 5 minutes

  // Long-term cache for static data
  LONG: { ttl: 3600 }, // 1 hour

  // Session cache (until browser close)
  SESSION: { ttl: 86400 }, // 24 hours
} as const;
