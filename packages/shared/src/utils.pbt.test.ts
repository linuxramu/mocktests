import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { generateId, validateEmail, formatDate, parseDate } from './utils';
import {
  runPropertyTest,
  arbitraryEmail,
  arbitraryInvalidEmail,
  PBT_CONFIG,
} from './test-utils/property-generators';

/**
 * Property-Based Tests for Shared Utilities
 * Feature: eamcet-mock-test-platform, Property-Based Testing Foundation
 *
 * These tests validate universal properties that should hold across all inputs
 * using fast-check with minimum 100 iterations as specified in requirements.
 */

describe('Shared Utilities - Property-Based Tests', () => {
  describe('generateId', () => {
    it('should always generate valid UUIDs', () => {
      runPropertyTest(
        'generateId produces valid UUIDs',
        fc.constant(null), // No input needed
        () => {
          const id = generateId();
          // Check UUID format manually since custom matcher isn't working
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          expect(uuidRegex.test(id)).toBe(true);
          expect(typeof id).toBe('string');
          expect(id.length).toBe(36);
        }
      );
    });

    it('should generate unique IDs', () => {
      runPropertyTest(
        'generateId produces unique values',
        fc.integer({ min: 2, max: 100 }),
        count => {
          const ids = Array.from({ length: count }, () => generateId());
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }
      );
    });
  });

  describe('validateEmail', () => {
    it('should accept all valid email formats', () => {
      runPropertyTest(
        'validateEmail accepts valid emails',
        arbitraryEmail(),
        email => {
          expect(validateEmail(email)).toBe(true);
          // Check email format manually
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          expect(emailRegex.test(email)).toBe(true);
        }
      );
    });

    it('should reject clearly invalid email formats', () => {
      runPropertyTest(
        'validateEmail rejects clearly invalid emails',
        fc.oneof(
          fc.constant(''),
          fc.constant('invalid'),
          fc.constant('@example.com'),
          fc.constant('test@'),
          fc.string().filter(s => !s.includes('@'))
        ),
        invalidEmail => {
          expect(validateEmail(invalidEmail)).toBe(false);
        }
      );
    });

    it('should be consistent for the same input', () => {
      runPropertyTest('validateEmail is deterministic', fc.string(), email => {
        const result1 = validateEmail(email);
        const result2 = validateEmail(email);
        expect(result1).toBe(result2);
      });
    });
  });

  describe('date formatting and parsing', () => {
    it('should maintain date integrity through format/parse cycle', () => {
      runPropertyTest(
        'formatDate/parseDate round trip preserves date',
        fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') }),
        originalDate => {
          const formatted = formatDate(originalDate);
          const parsed = parseDate(formatted);

          // Check if parsed is a valid date
          expect(parsed instanceof Date).toBe(true);
          expect(!isNaN(parsed.getTime())).toBe(true);

          // Allow for small precision differences (milliseconds)
          expect(
            Math.abs(parsed.getTime() - originalDate.getTime())
          ).toBeLessThan(1000);
        }
      );
    });

    it('should produce consistent string format', () => {
      runPropertyTest(
        'formatDate produces consistent format',
        fc.date(),
        date => {
          const formatted = formatDate(date);
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);

          // Should be parseable back to a valid date
          const parsed = parseDate(formatted);
          expect(parsed instanceof Date).toBe(true);
          expect(!isNaN(parsed.getTime())).toBe(true);
        }
      );
    });

    it('should handle edge case dates correctly', () => {
      const edgeCases = [
        new Date('1970-01-01T00:00:00.000Z'), // Unix epoch
        new Date('2000-01-01T00:00:00.000Z'), // Y2K
        new Date('2038-01-19T03:14:07.000Z'), // Unix timestamp limit (32-bit)
      ];

      edgeCases.forEach(date => {
        const formatted = formatDate(date);
        const parsed = parseDate(formatted);
        expect(parsed instanceof Date).toBe(true);
        expect(!isNaN(parsed.getTime())).toBe(true);
        expect(Math.abs(parsed.getTime() - date.getTime())).toBeLessThan(1000);
      });
    });
  });

  describe('cross-function properties', () => {
    it('should maintain data type consistency across all utilities', () => {
      runPropertyTest(
        'all utilities return expected types',
        fc.record({
          email: fc.string(),
          date: fc.date(),
        }),
        ({ email, date }) => {
          // generateId always returns string
          expect(typeof generateId()).toBe('string');

          // validateEmail always returns boolean
          expect(typeof validateEmail(email)).toBe('boolean');

          // formatDate always returns string
          expect(typeof formatDate(date)).toBe('string');

          // parseDate with valid input returns Date
          const formatted = formatDate(date);
          const parsed = parseDate(formatted);
          expect(parsed instanceof Date).toBe(true);
        }
      );
    });
  });
});

/**
 * Performance Property Tests
 * Validates that utilities perform within acceptable time limits
 */
describe('Shared Utilities - Performance Properties', () => {
  it('should execute within performance bounds', () => {
    runPropertyTest(
      'utilities execute within time limits',
      fc.record({
        email: arbitraryEmail(),
        date: fc.date(),
      }),
      ({ email, date }) => {
        const start = performance.now();

        // All operations should complete quickly
        generateId();
        validateEmail(email);
        const formatted = formatDate(date);
        parseDate(formatted);

        const duration = performance.now() - start;
        expect(duration).toBeLessThan(10); // 10ms max for all operations
      },
      { numRuns: 50 } // Fewer runs for performance tests
    );
  });
});
