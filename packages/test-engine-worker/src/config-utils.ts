// Test configuration and customization utilities
import type { TestConfiguration } from '@eamcet-platform/shared';

/**
 * Predefined test configurations
 */
export const PREDEFINED_CONFIGS = {
  full: {
    subjects: ['physics', 'chemistry', 'mathematics'] as const,
    questionsPerSubject: 40,
    timeLimit: 180, // 3 hours
    difficulty: 'mixed' as const,
    randomizeQuestions: true,
  },
  physics: {
    subjects: ['physics'] as const,
    questionsPerSubject: 40,
    timeLimit: 60,
    difficulty: 'mixed' as const,
    randomizeQuestions: true,
  },
  chemistry: {
    subjects: ['chemistry'] as const,
    questionsPerSubject: 40,
    timeLimit: 60,
    difficulty: 'mixed' as const,
    randomizeQuestions: true,
  },
  mathematics: {
    subjects: ['mathematics'] as const,
    questionsPerSubject: 40,
    timeLimit: 60,
    difficulty: 'mixed' as const,
    randomizeQuestions: true,
  },
  quick: {
    subjects: ['physics', 'chemistry', 'mathematics'] as const,
    questionsPerSubject: 10,
    timeLimit: 30,
    difficulty: 'mixed' as const,
    randomizeQuestions: true,
  },
};

/**
 * Validate test configuration
 */
export function validateTestConfiguration(config: TestConfiguration): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate subjects
  if (!config.subjects || config.subjects.length === 0) {
    errors.push('At least one subject must be selected');
  }

  const validSubjects = ['physics', 'chemistry', 'mathematics'];
  for (const subject of config.subjects) {
    if (!validSubjects.includes(subject)) {
      errors.push(`Invalid subject: ${subject}`);
    }
  }

  // Validate questions per subject
  if (config.questionsPerSubject < 1 || config.questionsPerSubject > 100) {
    errors.push('Questions per subject must be between 1 and 100');
  }

  // Validate time limit
  if (config.timeLimit < 1 || config.timeLimit > 300) {
    errors.push('Time limit must be between 1 and 300 minutes');
  }

  // Validate difficulty
  const validDifficulties = ['mixed', 'easy', 'medium', 'hard'];
  if (!validDifficulties.includes(config.difficulty)) {
    errors.push(`Invalid difficulty: ${config.difficulty}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get difficulty distribution for mixed difficulty tests
 */
export function getDifficultyDistribution(totalQuestions: number): {
  easy: number;
  medium: number;
  hard: number;
} {
  // EAMCET-like distribution: 30% easy, 50% medium, 20% hard
  const easy = Math.floor(totalQuestions * 0.3);
  const hard = Math.floor(totalQuestions * 0.2);
  const medium = totalQuestions - easy - hard;

  return { easy, medium, hard };
}

/**
 * Calculate total test duration based on configuration
 */
export function calculateTestDuration(config: TestConfiguration): number {
  return config.timeLimit * 60; // Convert minutes to seconds
}

/**
 * Calculate total questions in test
 */
export function calculateTotalQuestions(config: TestConfiguration): number {
  return config.subjects.length * config.questionsPerSubject;
}

/**
 * Get recommended time per question
 */
export function getRecommendedTimePerQuestion(
  config: TestConfiguration
): number {
  const totalQuestions = calculateTotalQuestions(config);
  const totalSeconds = calculateTestDuration(config);
  return Math.floor(totalSeconds / totalQuestions);
}

/**
 * Create custom test configuration
 */
export function createCustomConfig(
  subjects: Array<'physics' | 'chemistry' | 'mathematics'>,
  questionsPerSubject: number,
  timeLimit: number,
  difficulty: 'mixed' | 'easy' | 'medium' | 'hard' = 'mixed',
  randomizeQuestions: boolean = true
): TestConfiguration {
  return {
    subjects,
    questionsPerSubject,
    timeLimit,
    difficulty,
    randomizeQuestions,
  };
}

/**
 * Get test configuration by type
 */
export function getConfigByType(
  testType: 'full' | 'subject-wise' | 'custom',
  subject?: 'physics' | 'chemistry' | 'mathematics'
): TestConfiguration | null {
  if (testType === 'full') {
    return PREDEFINED_CONFIGS.full;
  }

  if (testType === 'subject-wise' && subject) {
    return PREDEFINED_CONFIGS[subject] || null;
  }

  return null;
}

/**
 * Merge custom configuration with defaults
 */
export function mergeWithDefaults(
  customConfig: Partial<TestConfiguration>
): TestConfiguration {
  const defaults = PREDEFINED_CONFIGS.full;

  return {
    subjects: customConfig.subjects || defaults.subjects,
    questionsPerSubject:
      customConfig.questionsPerSubject || defaults.questionsPerSubject,
    timeLimit: customConfig.timeLimit || defaults.timeLimit,
    difficulty: customConfig.difficulty || defaults.difficulty,
    randomizeQuestions:
      customConfig.randomizeQuestions !== undefined
        ? customConfig.randomizeQuestions
        : defaults.randomizeQuestions,
  };
}

/**
 * Check if configuration is within limits
 */
export function isWithinLimits(
  config: TestConfiguration,
  maxQuestions: number = 160,
  maxTimeMinutes: number = 300
): { valid: boolean; reason?: string } {
  const totalQuestions = calculateTotalQuestions(config);

  if (totalQuestions > maxQuestions) {
    return {
      valid: false,
      reason: `Total questions (${totalQuestions}) exceeds maximum (${maxQuestions})`,
    };
  }

  if (config.timeLimit > maxTimeMinutes) {
    return {
      valid: false,
      reason: `Time limit (${config.timeLimit} min) exceeds maximum (${maxTimeMinutes} min)`,
    };
  }

  return { valid: true };
}
