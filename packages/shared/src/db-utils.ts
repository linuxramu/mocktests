// Type-safe database query builders and utilities
import type {
  User,
  TestSession,
  Question,
  UserAnswer,
  PerformanceAnalytics,
  UserProfileData,
  TestConfiguration,
  QuestionMetadata,
} from './types';
import {
  UserRowSchema,
  TestSessionRowSchema,
  QuestionRowSchema,
  UserAnswerRowSchema,
  PerformanceAnalyticsRowSchema,
} from './schemas';

/**
 * Convert SQLite boolean (0/1) to JavaScript boolean
 */
export function sqliteToBoolean(value: number | boolean | null): boolean {
  if (typeof value === 'boolean') return value;
  return value === 1;
}

/**
 * Convert JavaScript boolean to SQLite boolean (0/1)
 */
export function booleanToSqlite(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Parse JSON string safely
 */
export function parseJsonSafe<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Convert database row to User object
 */
export function rowToUser(row: unknown): User {
  const parsed = UserRowSchema.parse(row);
  return {
    id: parsed.id,
    email: parsed.email,
    name: parsed.name,
    createdAt: new Date(parsed.created_at),
    updatedAt: new Date(parsed.updated_at),
    emailVerified: sqliteToBoolean(parsed.email_verified),
    profileData: parseJsonSafe<UserProfileData>(parsed.profile_data, {}),
  };
}

/**
 * Convert User object to database row format
 */
export function userToRow(user: Partial<User> & { passwordHash?: string }) {
  return {
    id: user.id,
    email: user.email,
    password_hash: user.passwordHash,
    name: user.name,
    created_at: user.createdAt?.toISOString(),
    updated_at: user.updatedAt?.toISOString(),
    email_verified: user.emailVerified !== undefined ? booleanToSqlite(user.emailVerified) : undefined,
    profile_data: user.profileData ? JSON.stringify(user.profileData) : null,
  };
}

/**
 * Convert database row to TestSession object
 */
export function rowToTestSession(row: unknown): TestSession {
  const parsed = TestSessionRowSchema.parse(row);
  
  // Parse configuration with proper null handling
  const defaultConfig: TestConfiguration = {
    subjects: [],
    questionsPerSubject: 0,
    timeLimit: 0,
    difficulty: 'mixed',
    randomizeQuestions: false,
  };
  
  return {
    id: parsed.id,
    userId: parsed.user_id,
    testType: parsed.test_type as 'full' | 'subject-wise' | 'custom',
    status: parsed.status as 'active' | 'completed' | 'abandoned',
    startedAt: new Date(parsed.started_at),
    completedAt: parsed.completed_at ? new Date(parsed.completed_at) : undefined,
    durationSeconds: parsed.duration_seconds === null ? undefined : parsed.duration_seconds,
    totalQuestions: parsed.total_questions,
    configuration: parsed.configuration ? parseJsonSafe<TestConfiguration>(parsed.configuration, defaultConfig) : defaultConfig,
  };
}

/**
 * Convert TestSession object to database row format
 */
export function testSessionToRow(session: Partial<TestSession>) {
  return {
    id: session.id,
    user_id: session.userId,
    test_type: session.testType,
    status: session.status,
    started_at: session.startedAt?.toISOString(),
    completed_at: session.completedAt?.toISOString() ?? null,
    duration_seconds: session.durationSeconds ?? null,
    total_questions: session.totalQuestions,
    configuration: session.configuration ? JSON.stringify(session.configuration) : null,
  };
}

/**
 * Convert database row to Question object
 */
export function rowToQuestion(row: unknown): Question {
  const parsed = QuestionRowSchema.parse(row);
  return {
    id: parsed.id,
    subject: parsed.subject as 'physics' | 'chemistry' | 'mathematics',
    difficulty: parsed.difficulty as 'easy' | 'medium' | 'hard',
    questionText: parsed.question_text,
    options: parseJsonSafe<string[]>(parsed.options, []),
    correctAnswer: parsed.correct_answer,
    explanation: parsed.explanation === null ? undefined : parsed.explanation,
    sourcePattern: parsed.source_pattern,
    metadata: parseJsonSafe<QuestionMetadata>(parsed.metadata, {
      topic: '',
      estimatedTime: 0,
      conceptTags: [],
    }),
  };
}

/**
 * Convert Question object to database row format
 */
export function questionToRow(question: Partial<Question>) {
  return {
    id: question.id,
    subject: question.subject,
    difficulty: question.difficulty,
    question_text: question.questionText,
    options: question.options ? JSON.stringify(question.options) : null,
    correct_answer: question.correctAnswer,
    explanation: question.explanation ?? null,
    source_pattern: question.sourcePattern,
    metadata: question.metadata ? JSON.stringify(question.metadata) : null,
  };
}

/**
 * Convert database row to UserAnswer object
 */
export function rowToUserAnswer(row: unknown): UserAnswer {
  const parsed = UserAnswerRowSchema.parse(row);
  return {
    id: parsed.id,
    testSessionId: parsed.test_session_id,
    questionId: parsed.question_id,
    selectedAnswer: parsed.selected_answer === null ? undefined : parsed.selected_answer,
    isCorrect: sqliteToBoolean(parsed.is_correct),
    timeSpentSeconds: parsed.time_spent_seconds ?? 0,
    answeredAt: parsed.answered_at === null ? undefined : new Date(parsed.answered_at),
    isMarkedForReview: sqliteToBoolean(parsed.is_marked_for_review),
  };
}

/**
 * Convert UserAnswer object to database row format
 */
export function userAnswerToRow(answer: Partial<UserAnswer>) {
  return {
    id: answer.id,
    test_session_id: answer.testSessionId,
    question_id: answer.questionId,
    selected_answer: answer.selectedAnswer ?? null,
    is_correct: answer.isCorrect !== undefined ? booleanToSqlite(answer.isCorrect) : null,
    time_spent_seconds: answer.timeSpentSeconds ?? 0,
    answered_at: answer.answeredAt?.toISOString() ?? null,
    is_marked_for_review: answer.isMarkedForReview !== undefined ? booleanToSqlite(answer.isMarkedForReview) : 0,
  };
}

/**
 * Convert database row to PerformanceAnalytics object
 */
export function rowToPerformanceAnalytics(row: unknown): PerformanceAnalytics {
  const parsed = PerformanceAnalyticsRowSchema.parse(row);
  return {
    id: parsed.id,
    userId: parsed.user_id,
    testSessionId: parsed.test_session_id,
    subject: parsed.subject,
    totalQuestions: parsed.total_questions,
    correctAnswers: parsed.correct_answers ?? 0,
    accuracyPercentage: parsed.accuracy_percentage ?? 0,
    averageTimePerQuestion: parsed.average_time_per_question ?? 0,
    strengths: parseJsonSafe<string[]>(parsed.strengths, []),
    weaknesses: parseJsonSafe<string[]>(parsed.weaknesses, []),
    calculatedAt: new Date(parsed.calculated_at),
  };
}

/**
 * Convert PerformanceAnalytics object to database row format
 */
export function performanceAnalyticsToRow(analytics: Partial<PerformanceAnalytics>) {
  // Handle NaN values by converting them to null for database storage
  const correctAnswers = analytics.correctAnswers !== undefined && !isNaN(analytics.correctAnswers) 
    ? analytics.correctAnswers 
    : null;
  const accuracyPercentage = analytics.accuracyPercentage !== undefined && !isNaN(analytics.accuracyPercentage)
    ? analytics.accuracyPercentage
    : null;
  const averageTimePerQuestion = analytics.averageTimePerQuestion !== undefined && !isNaN(analytics.averageTimePerQuestion)
    ? analytics.averageTimePerQuestion
    : null;
  
  return {
    id: analytics.id,
    user_id: analytics.userId,
    test_session_id: analytics.testSessionId,
    subject: analytics.subject,
    total_questions: analytics.totalQuestions,
    correct_answers: correctAnswers,
    accuracy_percentage: accuracyPercentage,
    average_time_per_question: averageTimePerQuestion,
    strengths: analytics.strengths ? JSON.stringify(analytics.strengths) : null,
    weaknesses: analytics.weaknesses ? JSON.stringify(analytics.weaknesses) : null,
    calculated_at: analytics.calculatedAt?.toISOString(),
  };
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  // Basic email validation - no consecutive dots, no spaces, valid structure
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && !email.includes('..');
}

/**
 * Sanitize user input to prevent SQL injection
 */
export function sanitizeInput(input: string): string {
  return input.replace(/['"\\;]/g, '');
}
