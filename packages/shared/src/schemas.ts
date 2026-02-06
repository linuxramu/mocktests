// Zod validation schemas for EAMCET Mock Test Platform
import { z } from 'zod';
import type {
  UserProfileData,
  User,
  TestConfiguration,
  TestSession,
  QuestionMetadata,
  Question,
  UserAnswer,
  PerformanceAnalytics,
} from './types';

// User schemas
export const UserProfileDataSchema = z.object({
  targetScore: z.number().min(0).max(200).optional(),
  preferredSubjects: z
    .array(z.enum(['physics', 'chemistry', 'mathematics']))
    .optional(),
  studyGoals: z.array(z.string()).optional(),
  timeZone: z.string().optional(),
}) satisfies z.ZodType<UserProfileData>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
  emailVerified: z.boolean(),
  profileData: UserProfileDataSchema,
}) satisfies z.ZodType<User>;

// Test configuration schemas
export const TestConfigurationSchema = z.object({
  subjects: z.array(z.enum(['physics', 'chemistry', 'mathematics'])).min(1),
  questionsPerSubject: z.number().int().min(1).max(100),
  timeLimit: z.number().int().min(1).max(300), // in minutes
  difficulty: z.enum(['mixed', 'easy', 'medium', 'hard']),
  randomizeQuestions: z.boolean(),
}) satisfies z.ZodType<TestConfiguration>;

export const TestSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  testType: z.enum(['full', 'subject-wise', 'custom']),
  status: z.enum(['active', 'completed', 'abandoned']),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  totalQuestions: z.number().int().min(1),
  configuration: TestConfigurationSchema,
}) satisfies z.ZodType<TestSession>;

// Question schemas
export const QuestionMetadataSchema = z.object({
  topic: z.string().min(1),
  subtopic: z.string().optional(),
  yearSource: z.number().int().min(2000).max(2100).optional(),
  estimatedTime: z.number().int().min(1), // seconds
  conceptTags: z.array(z.string()),
}) satisfies z.ZodType<QuestionMetadata>;

export const QuestionSchema = z.object({
  id: z.string().uuid(),
  subject: z.enum(['physics', 'chemistry', 'mathematics']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionText: z.string().min(1),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  sourcePattern: z.string().min(1),
  metadata: QuestionMetadataSchema,
}) satisfies z.ZodType<Question>;

// User answer schemas
export const UserAnswerSchema = z.object({
  id: z.string().uuid(),
  testSessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedAnswer: z.string().optional(),
  isCorrect: z.boolean(),
  timeSpentSeconds: z.number().int().min(0),
  answeredAt: z.date().optional(),
  isMarkedForReview: z.boolean(),
}) satisfies z.ZodType<UserAnswer>;

// Performance analytics schemas
export const PerformanceAnalyticsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  testSessionId: z.string().uuid(),
  subject: z.string().min(1),
  totalQuestions: z.number().int().min(0),
  correctAnswers: z.number().int().min(0),
  accuracyPercentage: z.number().min(0).max(100),
  averageTimePerQuestion: z.number().min(0),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  calculatedAt: z.date(),
}) satisfies z.ZodType<PerformanceAnalytics>;

// Database row schemas (for parsing database results)
export const UserRowSchema = z.object({
  id: z.string(),
  email: z.string(),
  password_hash: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  email_verified: z.union([z.number(), z.boolean()]),
  profile_data: z.string().nullable(),
});

export const TestSessionRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  test_type: z.string(),
  status: z.string(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  total_questions: z.number(),
  configuration: z.string().nullable(),
});

export const QuestionRowSchema = z.object({
  id: z.string(),
  subject: z.string(),
  difficulty: z.string(),
  question_text: z.string(),
  options: z.string(),
  correct_answer: z.string(),
  explanation: z.string().nullable(),
  source_pattern: z.string(),
  created_at: z.string().optional(),
  metadata: z.string().nullable(),
});

export const UserAnswerRowSchema = z.object({
  id: z.string(),
  test_session_id: z.string(),
  question_id: z.string(),
  selected_answer: z.string().nullable(),
  is_correct: z.union([z.number(), z.boolean()]).nullable(),
  time_spent_seconds: z.number().nullable(),
  answered_at: z.string().nullable(),
  is_marked_for_review: z.union([z.number(), z.boolean()]),
});

export const PerformanceAnalyticsRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  test_session_id: z.string(),
  subject: z.string(),
  total_questions: z.number(),
  correct_answers: z.number().nullable(),
  accuracy_percentage: z.number().nullable(),
  average_time_per_question: z.number().nullable(),
  strengths: z.string().nullable(),
  weaknesses: z.string().nullable(),
  calculated_at: z.string(),
});

// Database row types
export type UserRow = z.infer<typeof UserRowSchema>;
export type TestSessionRow = z.infer<typeof TestSessionRowSchema>;
export type QuestionRow = z.infer<typeof QuestionRowSchema>;
export type UserAnswerRow = z.infer<typeof UserAnswerRowSchema>;
export type PerformanceAnalyticsRow = z.infer<
  typeof PerformanceAnalyticsRowSchema
>;
