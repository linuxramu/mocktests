/**
 * Property-Based Tests for Authentication System
 * Feature: eamcet-mock-test-platform, Property 1: Authentication System Integrity
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * For any valid user registration data, the authentication system should:
 * - Create a secure account
 * - Allow login with correct credentials
 * - Prevent access to protected resources without authentication
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyToken,
  isValidEmail,
  isValidPassword,
} from './auth-utils';

describe('Property 1: Authentication System Integrity', () => {
  /**
   * Property: Password hashing should be deterministic and verifiable
   * For any valid password, hashing and then verifying should succeed
   */
  it('should hash and verify passwords correctly for any valid password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 100 }),
        async password => {
          const hash = await hashPassword(password);
          const isValid = await verifyPassword(password, hash);
          expect(isValid).toBe(true);

          // Wrong password should fail
          const wrongPassword = password + 'wrong';
          const isInvalid = await verifyPassword(wrongPassword, hash);
          expect(isInvalid).toBe(false);
        }
      ),
      { numRuns: 20 } // Reduced runs due to bcrypt performance
    );
  }, 30000); // 30 second timeout for bcrypt operations

  /**
   * Property: JWT tokens should encode and decode user information correctly
   * For any valid userId and email, token generation and verification should preserve data
   */
  it('should generate and verify JWT tokens correctly for any user data', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.emailAddress(),
        fc.string({ minLength: 32, maxLength: 64 }),
        (userId, email, secret) => {
          const tokens = generateTokenPair(userId, email, secret);

          // Verify access token
          const accessPayload = verifyToken(tokens.accessToken, secret);
          expect(accessPayload).not.toBeNull();
          expect(accessPayload?.userId).toBe(userId);
          expect(accessPayload?.email).toBe(email);

          // Verify refresh token
          const refreshPayload = verifyToken(tokens.refreshToken, secret);
          expect(refreshPayload).not.toBeNull();
          expect(refreshPayload?.userId).toBe(userId);
          expect(refreshPayload?.email).toBe(email);

          // Wrong secret should fail
          const wrongSecret = secret + 'wrong';
          const invalidPayload = verifyToken(tokens.accessToken, wrongSecret);
          expect(invalidPayload).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Email validation should correctly identify valid and invalid emails
   * For any string, email validation should be consistent
   */
  it('should validate email formats correctly', () => {
    fc.assert(
      fc.property(fc.emailAddress(), email => {
        // Valid emails should pass (unless they have consecutive dots)
        const result = isValidEmail(email);
        if (email.includes('..')) {
          expect(result).toBe(false);
        } else {
          expect(result).toBe(true);
        }
      }),
      { numRuns: 100 }
    );

    // Invalid emails should fail
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('invalid'),
          fc.constant('no-at-sign.com'),
          fc.constant('@no-local.com'),
          fc.constant('no-domain@'),
          fc.constant('spaces in@email.com'),
          fc.constant('consecutive..dots@email.com')
        ),
        invalidEmail => {
          expect(isValidEmail(invalidEmail)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Password validation should enforce security requirements
   * For any password, validation should check all security criteria
   */
  it('should validate password strength correctly', () => {
    // Valid passwords should pass
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 20 }),
        fc.integer({ min: 0, max: 9 }),
        fc.constantFrom('A', 'B', 'C', 'D', 'E'),
        fc.constantFrom('a', 'b', 'c', 'd', 'e'),
        (base, num, upper, lower) => {
          const password = `${base}${num}${upper}${lower}`;
          const result = isValidPassword(password);

          // Check if password meets all requirements
          const hasUpper = /[A-Z]/.test(password);
          const hasLower = /[a-z]/.test(password);
          const hasNumber = /[0-9]/.test(password);
          const isLongEnough = password.length >= 8;

          const shouldBeValid =
            hasUpper && hasLower && hasNumber && isLongEnough;

          if (shouldBeValid) {
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          } else {
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );

    // Weak passwords should fail
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('short'), // Too short
          fc.constant('nouppercase123'), // No uppercase
          fc.constant('NOLOWERCASE123'), // No lowercase
          fc.constant('NoNumbers') // No numbers
        ),
        weakPassword => {
          const result = isValidPassword(weakPassword);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Token verification should fail for tampered tokens
   * For any valid token, modifying it should cause verification to fail
   */
  it('should reject tampered tokens', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.emailAddress(),
        fc.string({ minLength: 32, maxLength: 64 }),
        (userId, email, secret) => {
          const tokens = generateTokenPair(userId, email, secret);

          // Tamper with token by modifying a character
          const tamperedToken = tokens.accessToken.slice(0, -5) + 'XXXXX';

          const payload = verifyToken(tamperedToken, secret);
          expect(payload).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Different users should get different tokens
   * For any two different user credentials, tokens should be unique
   */
  it('should generate unique tokens for different users', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.emailAddress(),
        fc.emailAddress(),
        fc.string({ minLength: 32, maxLength: 64 }),
        (userId1, userId2, email1, email2, secret) => {
          fc.pre(userId1 !== userId2 || email1 !== email2);

          const tokens1 = generateTokenPair(userId1, email1, secret);
          const tokens2 = generateTokenPair(userId2, email2, secret);

          // Tokens should be different
          expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
          expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);

          // Each token should decode to correct user
          const payload1 = verifyToken(tokens1.accessToken, secret);
          const payload2 = verifyToken(tokens2.accessToken, secret);

          expect(payload1?.userId).toBe(userId1);
          expect(payload1?.email).toBe(email1);
          expect(payload2?.userId).toBe(userId2);
          expect(payload2?.email).toBe(email2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
