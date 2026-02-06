// Unit tests for security utilities
import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeInput,
  sanitizeEmail,
  generateCsrfToken,
  verifyCsrfToken,
  checkRateLimit,
  isValidOrigin,
  getCorsHeaders,
  getSecureHeaders,
  getContentSecurityPolicy,
  type RateLimitConfig,
} from './security-utils';

describe('Security Utils - Unit Tests', () => {
  describe('Input Sanitization', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
      expect(sanitizeHtml('<img src=x onerror=alert(1)>')).toContain('&lt;img');
      expect(sanitizeHtml('Hello & goodbye')).toBe('Hello &amp; goodbye');
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeEmail('')).toBe('');
    });

    it('should remove control characters', () => {
      expect(sanitizeInput('hello\x00world')).toBe('helloworld');
      expect(sanitizeInput('test\x1Fdata')).toBe('testdata');
    });

    it('should normalize email addresses', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(sanitizeEmail('User@Domain.COM')).toBe('user@domain.com');
    });
  });

  describe('CSRF Token', () => {
    it('should generate valid hex tokens', () => {
      const token = generateCsrfToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 10; i++) {
        tokens.add(generateCsrfToken());
      }
      expect(tokens.size).toBe(10);
    });

    it('should verify matching tokens', () => {
      const token = generateCsrfToken();
      expect(verifyCsrfToken(token, token)).toBe(true);
    });

    it('should reject mismatched tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(verifyCsrfToken(token1, token2)).toBe(false);
    });

    it('should reject empty tokens', () => {
      expect(verifyCsrfToken('', 'token')).toBe(false);
      expect(verifyCsrfToken('token', '')).toBe(false);
    });

    it('should reject tokens with different lengths', () => {
      expect(verifyCsrfToken('short', 'muchlongertoken')).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 };
      const now = Date.now();

      let state = null;
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(state, config, now);
        expect(result.allowed).toBe(true);
        state = result.newState;
      }
    });

    it('should block requests exceeding limit', () => {
      const config: RateLimitConfig = { maxRequests: 3, windowMs: 60000 };
      const now = Date.now();

      let state = null;
      // Make 3 requests (should all succeed)
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(state, config, now);
        state = result.newState;
      }

      // 4th request should be blocked
      const result = checkRateLimit(state, config, now);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', () => {
      const config: RateLimitConfig = { maxRequests: 2, windowMs: 1000 };
      const now = Date.now();

      let state = null;
      // Fill the limit
      for (let i = 0; i < 2; i++) {
        const result = checkRateLimit(state, config, now);
        state = result.newState;
      }

      // Should be blocked
      const blockedResult = checkRateLimit(state, config, now);
      expect(blockedResult.allowed).toBe(false);

      // After window expires, should allow again
      const afterExpiry = now + 1001;
      const allowedResult = checkRateLimit(state, config, afterExpiry);
      expect(allowedResult.allowed).toBe(true);
    });

    it('should provide accurate retry-after time', () => {
      const config: RateLimitConfig = { maxRequests: 1, windowMs: 10000 };
      const now = Date.now();

      let state = null;
      const result1 = checkRateLimit(state, config, now);
      state = result1.newState;

      const result2 = checkRateLimit(state, config, now);
      expect(result2.allowed).toBe(false);
      expect(result2.retryAfter).toBe(10); // 10 seconds
    });
  });

  describe('Origin Validation', () => {
    it('should validate exact origin matches', () => {
      const origin = 'https://example.com';
      expect(isValidOrigin(origin, [origin])).toBe(true);
      expect(isValidOrigin(origin, ['https://other.com'])).toBe(false);
    });

    it('should allow wildcard origins', () => {
      expect(isValidOrigin('https://example.com', ['*'])).toBe(true);
      expect(isValidOrigin('http://localhost:3000', ['*'])).toBe(true);
    });

    it('should handle wildcard patterns', () => {
      expect(
        isValidOrigin('https://dev.example.com', ['https://*.example.com'])
      ).toBe(true);
      expect(
        isValidOrigin('https://staging.example.com', ['https://*.example.com'])
      ).toBe(true);
      expect(
        isValidOrigin('https://other.com', ['https://*.example.com'])
      ).toBe(false);
    });

    it('should reject null origins', () => {
      expect(isValidOrigin(null, ['https://example.com'])).toBe(false);
    });

    it('should handle multiple allowed origins', () => {
      const allowed = ['https://example.com', 'https://test.com'];
      expect(isValidOrigin('https://example.com', allowed)).toBe(true);
      expect(isValidOrigin('https://test.com', allowed)).toBe(true);
      expect(isValidOrigin('https://other.com', allowed)).toBe(false);
    });
  });

  describe('CORS Headers', () => {
    it('should include origin when valid', () => {
      const origin = 'https://example.com';
      const headers = getCorsHeaders(origin, [origin]);

      expect(headers['Access-Control-Allow-Origin']).toBe(origin);
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should not include origin when invalid', () => {
      const origin = 'https://malicious.com';
      const headers = getCorsHeaders(origin, ['https://example.com']);

      expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
    });

    it('should include standard CORS headers', () => {
      const headers = getCorsHeaders('https://example.com', [
        'https://example.com',
      ]);

      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
      expect(headers['Access-Control-Allow-Headers']).toContain(
        'Authorization'
      );
      expect(headers['Access-Control-Max-Age']).toBe('86400');
    });
  });

  describe('Security Headers', () => {
    it('should include XSS protection', () => {
      const headers = getSecureHeaders();
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    });

    it('should prevent clickjacking', () => {
      const headers = getSecureHeaders();
      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    it('should prevent MIME sniffing', () => {
      const headers = getSecureHeaders();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should enforce HTTPS', () => {
      const headers = getSecureHeaders();
      expect(headers['Strict-Transport-Security']).toContain(
        'max-age=31536000'
      );
      expect(headers['Strict-Transport-Security']).toContain(
        'includeSubDomains'
      );
    });

    it('should set referrer policy', () => {
      const headers = getSecureHeaders();
      expect(headers['Referrer-Policy']).toBe(
        'strict-origin-when-cross-origin'
      );
    });

    it('should restrict permissions', () => {
      const headers = getSecureHeaders();
      expect(headers['Permissions-Policy']).toContain('geolocation=()');
      expect(headers['Permissions-Policy']).toContain('microphone=()');
      expect(headers['Permissions-Policy']).toContain('camera=()');
    });
  });

  describe('Content Security Policy', () => {
    it('should restrict default sources', () => {
      const csp = getContentSecurityPolicy();
      expect(csp).toContain("default-src 'self'");
    });

    it('should allow necessary script sources', () => {
      const csp = getContentSecurityPolicy();
      expect(csp).toContain("script-src 'self'");
    });

    it('should allow necessary style sources', () => {
      const csp = getContentSecurityPolicy();
      expect(csp).toContain("style-src 'self'");
    });

    it('should prevent framing', () => {
      const csp = getContentSecurityPolicy();
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should restrict form actions', () => {
      const csp = getContentSecurityPolicy();
      expect(csp).toContain("form-action 'self'");
    });

    it('should restrict base URI', () => {
      const csp = getContentSecurityPolicy();
      expect(csp).toContain("base-uri 'self'");
    });
  });
});
