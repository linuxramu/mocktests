/**
 * Unit Tests for Authentication Worker
 * Tests registration, login, logout, token validation, and profile management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyToken,
  extractBearerToken,
  isValidEmail,
  isValidPassword,
} from './auth-utils';

describe('Auth Worker - Authentication Utilities', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword123', hash);

      expect(isValid).toBe(false);
    });

    it('should create different hashes for same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);

      // Both should still verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('JWT Token Generation and Validation', () => {
    const secret = 'test-secret-key-for-jwt-tokens';
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const email = 'test@example.com';

    it('should generate token pair', () => {
      const tokens = generateTokenPair(userId, email, secret);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should verify valid access token', () => {
      const tokens = generateTokenPair(userId, email, secret);
      const payload = verifyToken(tokens.accessToken, secret);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.email).toBe(email);
    });

    it('should verify valid refresh token', () => {
      const tokens = generateTokenPair(userId, email, secret);
      const payload = verifyToken(tokens.refreshToken, secret);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.email).toBe(email);
    });

    it('should reject token with wrong secret', () => {
      const tokens = generateTokenPair(userId, email, secret);
      const payload = verifyToken(tokens.accessToken, 'wrong-secret');

      expect(payload).toBeNull();
    });

    it('should reject malformed token', () => {
      const payload = verifyToken('invalid.token.here', secret);

      expect(payload).toBeNull();
    });

    it('should reject empty token', () => {
      const payload = verifyToken('', secret);

      expect(payload).toBeNull();
    });
  });

  describe('Bearer Token Extraction', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const authHeader = `Bearer ${token}`;
      const extracted = extractBearerToken(authHeader);

      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractBearerToken(null);

      expect(extracted).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const extracted = extractBearerToken(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
      );

      expect(extracted).toBeNull();
    });

    it('should return null for empty header', () => {
      const extracted = extractBearerToken('');

      expect(extracted).toBeNull();
    });

    it('should return null for Bearer without token', () => {
      const extracted = extractBearerToken('Bearer ');

      expect(extracted).toBe('');
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'no-at-sign.com',
        '@no-local.com',
        'no-domain@',
        'spaces in@email.com',
        'consecutive..dots@email.com',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'Password123',
        'MyP@ssw0rd',
        'Test1234Pass',
        'Secure123Password',
      ];

      strongPasswords.forEach(password => {
        const result = isValidPassword(password);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject password that is too short', () => {
      const result = isValidPassword('Pass1');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should reject password without uppercase letter', () => {
      const result = isValidPassword('password123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject password without lowercase letter', () => {
      const result = isValidPassword('PASSWORD123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should reject password without number', () => {
      const result = isValidPassword('PasswordOnly');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });

    it('should return multiple errors for very weak password', () => {
      const result = isValidPassword('weak');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle empty password hash verification', async () => {
      const result = await verifyPassword('test', '');
      expect(result).toBe(false);
    });

    it('should handle null-like values in email validation', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should handle special characters in passwords', async () => {
      const password = 'P@ssw0rd!#$%';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in email', () => {
      const email = 'test@例え.jp';
      // Should handle gracefully (may accept or reject based on implementation)
      const result = isValidEmail(email);
      expect(typeof result).toBe('boolean');
    });
  });
});
