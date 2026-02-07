/**
 * Unit Tests for Data Models and Validation
 * Tests data validation edge cases and error conditions
 * Validates: Requirements 1.4, 2.5, 3.3, 6.1
 */

import { describe, it, expect } from 'vitest';
import {
  sqliteToBoolean,
  booleanToSqlite,
  parseJsonSafe,
  isValidEmail,
  sanitizeSqlInput,
  generateUUID,
  rowToUser,
  userToRow,
  rowToTestSession,
  testSessionToRow,
  rowToQuestion,
  questionToRow,
} from './db-utils';
import type { User, TestSession, Question } from './types';

describe('Database Utility Functions', () => {
  describe('Boolean conversion', () => {
    it('should convert JavaScript boolean to SQLite integer', () => {
      expect(booleanToSqlite(true)).toBe(1);
      expect(booleanToSqlite(false)).toBe(0);
    });

    it('should convert SQLite integer to JavaScript boolean', () => {
      expect(sqliteToBoolean(1)).toBe(true);
      expect(sqliteToBoolean(0)).toBe(false);
    });

    it('should handle boolean values directly', () => {
      expect(sqliteToBoolean(true)).toBe(true);
      expect(sqliteToBoolean(false)).toBe(false);
    });

    it('should treat null as false', () => {
      expect(sqliteToBoolean(null)).toBe(false);
    });
  });

  describe('JSON parsing', () => {
    it('should parse valid JSON strings', () => {
      const obj = { key: 'value', nested: { data: 123 } };
      const jsonString = JSON.stringify(obj);
      expect(parseJsonSafe(jsonString, {})).toEqual(obj);
    });

    it('should return default value for invalid JSON', () => {
      const defaultValue = { default: true };
      expect(parseJsonSafe('invalid json', defaultValue)).toEqual(defaultValue);
      expect(parseJsonSafe('{broken', defaultValue)).toEqual(defaultValue);
    });

    it('should return default value for null input', () => {
      const defaultValue = { default: true };
      expect(parseJsonSafe(null, defaultValue)).toEqual(defaultValue);
    });

    it('should handle empty string', () => {
      const defaultValue = { default: true };
      expect(parseJsonSafe('', defaultValue)).toEqual(defaultValue);
    });
  });

  describe('Email validation', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test..test@example.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('Input sanitization', () => {
    it('should remove SQL injection characters', () => {
      expect(sanitizeSqlInput("test'; DROP TABLE users;--")).toBe(
        'test DROP TABLE users--'
      );
      expect(sanitizeSqlInput('normal text')).toBe('normal text');
      expect(sanitizeSqlInput('test"value')).toBe('testvalue');
      expect(sanitizeSqlInput("test'value")).toBe('testvalue');
    });

    it('should handle empty strings', () => {
      expect(sanitizeSqlInput('')).toBe('');
    });
  });

  describe('UUID generation', () => {
    it('should generate valid UUID format', () => {
      const uuid = generateUUID();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('User data conversion', () => {
    it('should convert user to database row format', () => {
      const user: Partial<User> & { passwordHash: string } = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
        profileData: { targetScore: 150 },
        passwordHash: 'hashed_password',
      };

      const row = userToRow(user);

      expect(row.id).toBe(user.id);
      expect(row.email).toBe(user.email);
      expect(row.name).toBe(user.name);
      expect(row.email_verified).toBe(1);
      expect(row.password_hash).toBe('hashed_password');
      expect(row.profile_data).toBe(JSON.stringify(user.profileData));
    });

    it('should convert database row to user object', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
        email_verified: 1,
        profile_data: JSON.stringify({ targetScore: 150 }),
      };

      const user = rowToUser(row);

      expect(user.id).toBe(row.id);
      expect(user.email).toBe(row.email);
      expect(user.name).toBe(row.name);
      expect(user.emailVerified).toBe(true);
      expect(user.profileData).toEqual({ targetScore: 150 });
    });

    it('should handle null profile data', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
        email_verified: 0,
        profile_data: null,
      };

      const user = rowToUser(row);
      expect(user.profileData).toEqual({});
    });
  });

  describe('TestSession data conversion', () => {
    it('should convert test session to database row format', () => {
      const session: Partial<TestSession> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '456e7890-e89b-12d3-a456-426614174000',
        testType: 'full',
        status: 'active',
        startedAt: new Date('2024-01-01T00:00:00Z'),
        totalQuestions: 100,
        configuration: {
          subjects: ['physics', 'chemistry'],
          questionsPerSubject: 50,
          timeLimit: 180,
          difficulty: 'mixed',
          randomizeQuestions: true,
        },
      };

      const row = testSessionToRow(session);

      expect(row.id).toBe(session.id);
      expect(row.user_id).toBe(session.userId);
      expect(row.test_type).toBe(session.testType);
      expect(row.status).toBe(session.status);
      expect(row.total_questions).toBe(session.totalQuestions);
      expect(row.configuration).toBe(JSON.stringify(session.configuration));
    });

    it('should convert database row to test session object', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174000',
        test_type: 'full',
        status: 'active',
        started_at: '2024-01-01T00:00:00.000Z',
        completed_at: null,
        duration_seconds: null,
        total_questions: 100,
        configuration: JSON.stringify({
          subjects: ['physics', 'chemistry'],
          questionsPerSubject: 50,
          timeLimit: 180,
          difficulty: 'mixed',
          randomizeQuestions: true,
        }),
      };

      const session = rowToTestSession(row);

      expect(session.id).toBe(row.id);
      expect(session.userId).toBe(row.user_id);
      expect(session.testType).toBe('full');
      expect(session.status).toBe('active');
      expect(session.totalQuestions).toBe(100);
      expect(session.configuration.subjects).toEqual(['physics', 'chemistry']);
    });

    it('should handle completed test sessions', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '456e7890-e89b-12d3-a456-426614174000',
        test_type: 'full',
        status: 'completed',
        started_at: '2024-01-01T00:00:00.000Z',
        completed_at: '2024-01-01T03:00:00.000Z',
        duration_seconds: 10800,
        total_questions: 100,
        configuration: JSON.stringify({
          subjects: ['physics'],
          questionsPerSubject: 100,
          timeLimit: 180,
          difficulty: 'mixed',
          randomizeQuestions: false,
        }),
      };

      const session = rowToTestSession(row);

      expect(session.status).toBe('completed');
      expect(session.completedAt).toBeInstanceOf(Date);
      expect(session.durationSeconds).toBe(10800);
    });
  });

  describe('Question data conversion', () => {
    it('should convert question to database row format', () => {
      const question: Partial<Question> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'medium',
        questionText: 'What is the speed of light?',
        options: [
          '299,792 km/s',
          '300,000 km/s',
          '150,000 km/s',
          '500,000 km/s',
        ],
        correctAnswer: 'A',
        explanation:
          'The speed of light in vacuum is approximately 299,792 km/s',
        sourcePattern: 'EAMCET-2023-Physics',
        metadata: {
          topic: 'Optics',
          estimatedTime: 120,
          conceptTags: ['speed of light', 'constants'],
        },
      };

      const row = questionToRow(question);

      expect(row.id).toBe(question.id);
      expect(row.subject).toBe(question.subject);
      expect(row.difficulty).toBe(question.difficulty);
      expect(row.question_text).toBe(question.questionText);
      expect(row.options).toBe(JSON.stringify(question.options));
      expect(row.correct_answer).toBe(question.correctAnswer);
      expect(row.explanation).toBe(question.explanation);
      expect(row.source_pattern).toBe(question.sourcePattern);
      expect(row.metadata).toBe(JSON.stringify(question.metadata));
    });

    it('should convert database row to question object', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'medium',
        question_text: 'What is the speed of light?',
        options: JSON.stringify([
          '299,792 km/s',
          '300,000 km/s',
          '150,000 km/s',
          '500,000 km/s',
        ]),
        correct_answer: 'A',
        explanation:
          'The speed of light in vacuum is approximately 299,792 km/s',
        source_pattern: 'EAMCET-2023-Physics',
        metadata: JSON.stringify({
          topic: 'Optics',
          estimatedTime: 120,
          conceptTags: ['speed of light', 'constants'],
        }),
      };

      const question = rowToQuestion(row);

      expect(question.id).toBe(row.id);
      expect(question.subject).toBe('physics');
      expect(question.difficulty).toBe('medium');
      expect(question.questionText).toBe(row.question_text);
      expect(question.options).toEqual([
        '299,792 km/s',
        '300,000 km/s',
        '150,000 km/s',
        '500,000 km/s',
      ]);
      expect(question.correctAnswer).toBe('A');
      expect(question.metadata.topic).toBe('Optics');
    });

    it('should handle questions without explanation', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'chemistry',
        difficulty: 'easy',
        question_text: 'What is H2O?',
        options: JSON.stringify(['Water', 'Hydrogen', 'Oxygen', 'Peroxide']),
        correct_answer: 'A',
        explanation: null,
        source_pattern: 'EAMCET-2023-Chemistry',
        metadata: JSON.stringify({
          topic: 'Basic Chemistry',
          estimatedTime: 60,
          conceptTags: ['water', 'compounds'],
        }),
      };

      const question = rowToQuestion(row);
      expect(question.explanation).toBeUndefined();
    });
  });
});
