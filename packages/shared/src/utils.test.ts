import { describe, it, expect } from 'vitest';
import { generateId, validateEmail, formatDate, parseDate } from './utils';

describe('Utility Functions', () => {
  it('should generate a valid UUID', () => {
    const id = generateId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(36);
  });

  it('should validate email addresses correctly', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('should format and parse dates correctly', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const formatted = formatDate(date);
    const parsed = parseDate(formatted);
    expect(parsed.getTime()).toBe(date.getTime());
  });
});
