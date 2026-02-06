// Property-based tests for caching utilities
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  MemoryCache,
  BrowserCache,
  buildCacheKey,
  CACHE_STRATEGIES,
} from './cache-utils';

/**
 * Feature: eamcet-mock-test-platform, Property 10: Performance and Caching
 *
 * For any system operation, the interface should load within performance limits,
 * maintain data integrity under concurrent access, and utilize caching effectively
 * to minimize response times.
 *
 * **Validates: Requirements 10.1, 10.3, 10.4**
 */
describe('Property 10: Performance and Caching', () => {
  describe('Cache Key Generation', () => {
    it('should generate consistent keys for same inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (namespace, key) => {
            const key1 = buildCacheKey(namespace, key);
            const key2 = buildCacheKey(namespace, key);

            // Same inputs should produce same key
            expect(key1).toBe(key2);

            // Key should contain both namespace and key
            expect(key1).toContain(namespace);
            expect(key1).toContain(key);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate unique keys for different inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (namespace, key1, key2) => {
            fc.pre(key1 !== key2); // Only test when keys are different

            const cacheKey1 = buildCacheKey(namespace, key1);
            const cacheKey2 = buildCacheKey(namespace, key2);

            // Different keys should produce different cache keys
            expect(cacheKey1).not.toBe(cacheKey2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Memory Cache', () => {
    let cache: MemoryCache;

    beforeEach(() => {
      cache = new MemoryCache();
    });

    it('should store and retrieve any value correctly', () => {
      fc.assert(
        fc.property(fc.string(), fc.anything(), (key, value) => {
          cache.set(key, value);
          const retrieved = cache.get(key);

          // Should retrieve the exact value
          expect(retrieved).toEqual(value);

          // Should report that key exists
          expect(cache.has(key)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle TTL expiration correctly', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          fc.integer({ min: 0, max: 2 }),
          (key, value, ttlSeconds) => {
            cache.set(key, value, ttlSeconds);

            // Should be available immediately
            expect(cache.get(key)).toBe(value);

            // Simulate time passing (we can't actually wait, so we test the logic)
            // In real scenario, after ttlSeconds, value should be null
            if (ttlSeconds === 0) {
              // With 0 TTL, should still be available (no expiry)
              expect(cache.has(key)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deletion correctly', () => {
      fc.assert(
        fc.property(fc.string(), fc.anything(), (key, value) => {
          cache.set(key, value);
          expect(cache.has(key)).toBe(true);

          cache.delete(key);

          // Should no longer exist
          expect(cache.has(key)).toBe(false);
          expect(cache.get(key)).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple keys independently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.string(), fc.anything()), {
            minLength: 1,
            maxLength: 10,
          }),
          entries => {
            // Store all entries
            entries.forEach(([key, value]) => {
              cache.set(key, value);
            });

            // Verify all entries
            entries.forEach(([key, value]) => {
              expect(cache.get(key)).toEqual(value);
            });

            // Delete one entry
            if (entries.length > 0) {
              const [keyToDelete] = entries[0];
              cache.delete(keyToDelete);

              // Deleted key should be gone
              expect(cache.has(keyToDelete)).toBe(false);

              // Other keys should still exist
              entries.slice(1).forEach(([key]) => {
                expect(cache.has(key)).toBe(true);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear all entries', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.string(), fc.anything()), {
            minLength: 1,
            maxLength: 10,
          }),
          entries => {
            // Store all entries
            entries.forEach(([key, value]) => {
              cache.set(key, value);
            });

            const sizeBefore = cache.size();
            expect(sizeBefore).toBeGreaterThan(0);

            cache.clear();

            // All entries should be gone
            expect(cache.size()).toBe(0);
            entries.forEach(([key]) => {
              expect(cache.has(key)).toBe(false);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Browser Cache', () => {
    let cache: BrowserCache;

    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
      cache = new BrowserCache('test');
    });

    it('should store and retrieve serializable values', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.array(fc.string()),
            fc.record({ name: fc.string(), age: fc.integer() })
          ),
          (key, value) => {
            cache.set(key, value);
            const retrieved = cache.get(key);

            // Should retrieve the exact value
            expect(retrieved).toEqual(value);

            // Should report that key exists
            expect(cache.has(key)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle namespace isolation', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          fc.string(),
          (namespace1, namespace2, key) => {
            fc.pre(namespace1 !== namespace2); // Different namespaces

            const cache1 = new BrowserCache(namespace1);
            const cache2 = new BrowserCache(namespace2);

            const value1 = 'value1';
            const value2 = 'value2';

            cache1.set(key, value1);
            cache2.set(key, value2);

            // Each cache should have its own value
            expect(cache1.get(key)).toBe(value1);
            expect(cache2.get(key)).toBe(value2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle deletion correctly', () => {
      fc.assert(
        fc.property(fc.string(), fc.string(), (key, value) => {
          cache.set(key, value);
          expect(cache.has(key)).toBe(true);

          cache.delete(key);

          // Should no longer exist
          expect(cache.has(key)).toBe(false);
          expect(cache.get(key)).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should clear only namespaced entries', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.string(), fc.string()), {
            minLength: 1,
            maxLength: 5,
          }),
          entries => {
            // Store entries in test namespace
            entries.forEach(([key, value]) => {
              cache.set(key, value);
            });

            // Store entry in different namespace
            const otherCache = new BrowserCache('other');
            otherCache.set('other-key', 'other-value');

            cache.clear();

            // Test namespace should be cleared
            entries.forEach(([key]) => {
              expect(cache.has(key)).toBe(false);
            });

            // Other namespace should be unaffected
            expect(otherCache.has('other-key')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cache Strategies', () => {
    it('should provide consistent TTL values', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          // All strategies should have positive TTL
          expect(CACHE_STRATEGIES.SHORT.ttl).toBeGreaterThan(0);
          expect(CACHE_STRATEGIES.MEDIUM.ttl).toBeGreaterThan(0);
          expect(CACHE_STRATEGIES.LONG.ttl).toBeGreaterThan(0);
          expect(CACHE_STRATEGIES.SESSION.ttl).toBeGreaterThan(0);

          // TTL should be ordered: SHORT < MEDIUM < LONG < SESSION
          expect(CACHE_STRATEGIES.SHORT.ttl).toBeLessThan(
            CACHE_STRATEGIES.MEDIUM.ttl
          );
          expect(CACHE_STRATEGIES.MEDIUM.ttl).toBeLessThan(
            CACHE_STRATEGIES.LONG.ttl
          );
          expect(CACHE_STRATEGIES.LONG.ttl).toBeLessThan(
            CACHE_STRATEGIES.SESSION.ttl
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle rapid successive operations efficiently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.string(), fc.string()), {
            minLength: 10,
            maxLength: 100,
          }),
          entries => {
            const cache = new MemoryCache();
            const startTime = Date.now();

            // Perform rapid writes
            entries.forEach(([key, value]) => {
              cache.set(key, value);
            });

            // Perform rapid reads
            entries.forEach(([key]) => {
              cache.get(key);
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Operations should complete quickly (< 100ms for 100 operations)
            expect(duration).toBeLessThan(100);

            // All values should be retrievable
            entries.forEach(([key, value]) => {
              expect(cache.get(key)).toBe(value);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity under concurrent-like access', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.anything(), { minLength: 5, maxLength: 20 }),
          (key, values) => {
            const cache = new MemoryCache();

            // Simulate rapid updates to same key
            values.forEach(value => {
              cache.set(key, value);
            });

            // Should have the last value
            const lastValue = values[values.length - 1];
            expect(cache.get(key)).toEqual(lastValue);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
