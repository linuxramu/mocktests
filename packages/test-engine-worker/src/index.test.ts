// Unit tests for Test Engine Worker
import { describe, it, expect, beforeEach } from 'vitest';
import { calculateRemainingTime, isSessionExpired } from './test-utils';
import {
  validateTestConfiguration,
  getDifficultyDistribution,
  calculateTestDuration,
  calculateTotalQuestions,
  getRecommendedTimePerQuestion,
  createCustomConfig,
  isWithinLimits,
} from './config-utils';
import {
  generateUUID,
  type TestSession,
  type TestConfiguration,
} from '@eamcet-platform/shared';

/**
 * Unit tests for Test Engine functionality
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

describe('Test Engine Worker - Session Lifecycle', () => {
  it('should calculate remaining time correctly for active session', () => {
    const session: TestSession = {
      id: generateUUID(),
      userId: generateUUID(),
      testType: 'full',
      status: 'active',
      startedAt: new Date(Date.now() - 60000), // 1 minute ago
      totalQuestions: 120,
      configuration: {
        subjects: ['physics', 'chemistry', 'mathematics'],
        questionsPerSubject: 40,
        timeLimit: 180, // 3 hours
        difficulty: 'mixed',
        randomizeQuestions: true,
      },
    };

    const remaining = calculateRemainingTime(session);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(180 * 60);
  });

  it('should identify expired session correctly', () => {
    const session: TestSession = {
      id: generateUUID(),
      userId: generateUUID(),
      testType: 'full',
      status: 'active',
      startedAt: new Date(Date.now() - 200 * 60 * 1000), // 200 minutes ago
      totalQuestions: 120,
      configuration: {
        subjects: ['physics', 'chemistry', 'mathematics'],
        questionsPerSubject: 40,
        timeLimit: 180, // 3 hours
        difficulty: 'mixed',
        randomizeQuestions: true,
      },
    };

    expect(isSessionExpired(session)).toBe(true);
  });

  it('should not mark newly created session as expired', () => {
    const session: TestSession = {
      id: generateUUID(),
      userId: generateUUID(),
      testType: 'full',
      status: 'active',
      startedAt: new Date(),
      totalQuestions: 120,
      configuration: {
        subjects: ['physics', 'chemistry', 'mathematics'],
        questionsPerSubject: 40,
        timeLimit: 180,
        difficulty: 'mixed',
        randomizeQuestions: true,
      },
    };

    expect(isSessionExpired(session)).toBe(false);
  });
});

describe('Test Engine Worker - Configuration Validation', () => {
  it('should validate correct test configuration', () => {
    const config: TestConfiguration = {
      subjects: ['physics', 'chemistry'],
      questionsPerSubject: 40,
      timeLimit: 120,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const result = validateTestConfiguration(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject configuration with no subjects', () => {
    const config: TestConfiguration = {
      subjects: [],
      questionsPerSubject: 40,
      timeLimit: 120,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const result = validateTestConfiguration(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject configuration with invalid questions per subject', () => {
    const config: TestConfiguration = {
      subjects: ['physics'],
      questionsPerSubject: 0,
      timeLimit: 120,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const result = validateTestConfiguration(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Questions per subject must be between 1 and 100'
    );
  });

  it('should reject configuration with invalid time limit', () => {
    const config: TestConfiguration = {
      subjects: ['physics'],
      questionsPerSubject: 40,
      timeLimit: 0,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const result = validateTestConfiguration(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Time limit must be between 1 and 300 minutes'
    );
  });
});

describe('Test Engine Worker - Difficulty Distribution', () => {
  it('should distribute questions correctly for mixed difficulty', () => {
    const distribution = getDifficultyDistribution(100);

    expect(distribution.easy).toBe(30);
    expect(distribution.medium).toBe(50);
    expect(distribution.hard).toBe(20);
    expect(distribution.easy + distribution.medium + distribution.hard).toBe(
      100
    );
  });

  it('should handle small question counts', () => {
    const distribution = getDifficultyDistribution(10);

    expect(distribution.easy + distribution.medium + distribution.hard).toBe(
      10
    );
    expect(distribution.easy).toBeGreaterThanOrEqual(0);
    expect(distribution.medium).toBeGreaterThanOrEqual(0);
    expect(distribution.hard).toBeGreaterThanOrEqual(0);
  });
});

describe('Test Engine Worker - Test Duration Calculations', () => {
  it('should calculate test duration correctly', () => {
    const config: TestConfiguration = {
      subjects: ['physics', 'chemistry', 'mathematics'],
      questionsPerSubject: 40,
      timeLimit: 180,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const duration = calculateTestDuration(config);
    expect(duration).toBe(180 * 60); // 180 minutes in seconds
  });

  it('should calculate total questions correctly', () => {
    const config: TestConfiguration = {
      subjects: ['physics', 'chemistry', 'mathematics'],
      questionsPerSubject: 40,
      timeLimit: 180,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const total = calculateTotalQuestions(config);
    expect(total).toBe(120); // 3 subjects * 40 questions
  });

  it('should calculate recommended time per question', () => {
    const config: TestConfiguration = {
      subjects: ['physics', 'chemistry', 'mathematics'],
      questionsPerSubject: 40,
      timeLimit: 180,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const timePerQuestion = getRecommendedTimePerQuestion(config);
    expect(timePerQuestion).toBe(90); // 10800 seconds / 120 questions
  });
});

describe('Test Engine Worker - Custom Configuration', () => {
  it('should create custom configuration correctly', () => {
    const config = createCustomConfig(
      ['physics', 'chemistry'],
      30,
      90,
      'hard',
      false
    );

    expect(config.subjects).toEqual(['physics', 'chemistry']);
    expect(config.questionsPerSubject).toBe(30);
    expect(config.timeLimit).toBe(90);
    expect(config.difficulty).toBe('hard');
    expect(config.randomizeQuestions).toBe(false);
  });

  it('should use default values for optional parameters', () => {
    const config = createCustomConfig(['mathematics'], 20, 60);

    expect(config.difficulty).toBe('mixed');
    expect(config.randomizeQuestions).toBe(true);
  });
});

describe('Test Engine Worker - Configuration Limits', () => {
  it('should accept configuration within limits', () => {
    const config: TestConfiguration = {
      subjects: ['physics', 'chemistry', 'mathematics'],
      questionsPerSubject: 40,
      timeLimit: 180,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const result = isWithinLimits(config);
    expect(result.valid).toBe(true);
  });

  it('should reject configuration exceeding question limit', () => {
    const config: TestConfiguration = {
      subjects: ['physics', 'chemistry', 'mathematics'],
      questionsPerSubject: 60,
      timeLimit: 180,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const result = isWithinLimits(config, 160);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('exceeds maximum');
  });

  it('should reject configuration exceeding time limit', () => {
    const config: TestConfiguration = {
      subjects: ['physics'],
      questionsPerSubject: 40,
      timeLimit: 350,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const result = isWithinLimits(config, 160, 300);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Time limit');
  });
});

describe('Test Engine Worker - Edge Cases', () => {
  it('should handle session at exact time limit', () => {
    const timeLimit = 60;
    const session: TestSession = {
      id: generateUUID(),
      userId: generateUUID(),
      testType: 'custom',
      status: 'active',
      startedAt: new Date(Date.now() - timeLimit * 60 * 1000),
      totalQuestions: 40,
      configuration: {
        subjects: ['physics'],
        questionsPerSubject: 40,
        timeLimit,
        difficulty: 'mixed',
        randomizeQuestions: true,
      },
    };

    const remaining = calculateRemainingTime(session);
    expect(remaining).toBeLessThanOrEqual(1); // Allow 1 second tolerance
    expect(isSessionExpired(session)).toBe(true);
  });

  it('should handle single subject configuration', () => {
    const config: TestConfiguration = {
      subjects: ['physics'],
      questionsPerSubject: 40,
      timeLimit: 60,
      difficulty: 'easy',
      randomizeQuestions: false,
    };

    const result = validateTestConfiguration(config);
    expect(result.valid).toBe(true);

    const total = calculateTotalQuestions(config);
    expect(total).toBe(40);
  });

  it('should handle maximum configuration', () => {
    const config: TestConfiguration = {
      subjects: ['physics', 'chemistry', 'mathematics'],
      questionsPerSubject: 100,
      timeLimit: 300,
      difficulty: 'mixed',
      randomizeQuestions: true,
    };

    const result = validateTestConfiguration(config);
    expect(result.valid).toBe(true);

    const total = calculateTotalQuestions(config);
    expect(total).toBe(300);
  });
});
