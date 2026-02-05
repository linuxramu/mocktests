// Core data types for the EAMCET Mock Test Platform

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  profileData: UserProfileData;
}

export interface UserProfileData {
  targetScore?: number;
  preferredSubjects?: string[];
  studyGoals?: string[];
  timeZone?: string;
}

export interface TestSession {
  id: string;
  userId: string;
  testType: 'full' | 'subject-wise' | 'custom';
  status: 'active' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;
  totalQuestions: number;
  configuration: TestConfiguration;
}

export interface TestConfiguration {
  subjects: string[];
  questionsPerSubject: number;
  timeLimit: number; // in minutes
  difficulty: 'mixed' | 'easy' | 'medium' | 'hard';
  randomizeQuestions: boolean;
}

export interface Question {
  id: string;
  subject: 'physics' | 'chemistry' | 'mathematics';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  sourcePattern: string;
  metadata: QuestionMetadata;
}

export interface QuestionMetadata {
  topic: string;
  subtopic?: string;
  yearSource?: number;
  estimatedTime: number; // seconds
  conceptTags: string[];
}

export interface UserAnswer {
  id: string;
  testSessionId: string;
  questionId: string;
  selectedAnswer?: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  answeredAt?: Date;
  isMarkedForReview: boolean;
}

export interface PerformanceAnalytics {
  id: string;
  userId: string;
  testSessionId: string;
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  averageTimePerQuestion: number;
  strengths: string[];
  weaknesses: string[];
  calculatedAt: Date;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}
