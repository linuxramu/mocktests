import { generateId } from '../utils';
import type { 
  User, 
  UserProfileData, 
  TestSession, 
  TestConfiguration, 
  Question, 
  QuestionMetadata, 
  UserAnswer, 
  PerformanceAnalytics 
} from '../types';

/**
 * Mock data generators for testing
 * These provide realistic test data that matches the application's data models
 */

export const mockUserProfileData = (): UserProfileData => ({
  targetScore: Math.floor(Math.random() * 100) + 100, // 100-200
  preferredSubjects: ['physics', 'chemistry', 'mathematics'].slice(0, Math.floor(Math.random() * 3) + 1),
  studyGoals: ['improve_accuracy', 'time_management', 'concept_clarity'].slice(0, Math.floor(Math.random() * 3) + 1),
  timeZone: 'Asia/Kolkata',
});

export const mockUser = (overrides: Partial<User> = {}): User => ({
  id: generateId(),
  email: `test${Math.floor(Math.random() * 10000)}@example.com`,
  name: `Test User ${Math.floor(Math.random() * 1000)}`,
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
  updatedAt: new Date(),
  emailVerified: Math.random() > 0.3, // 70% verified
  profileData: mockUserProfileData(),
  ...overrides,
});

export const mockTestConfiguration = (overrides: Partial<TestConfiguration> = {}): TestConfiguration => ({
  subjects: ['physics', 'chemistry', 'mathematics'],
  questionsPerSubject: 40,
  timeLimit: 180, // 3 hours
  difficulty: ['mixed', 'easy', 'medium', 'hard'][Math.floor(Math.random() * 4)] as any,
  randomizeQuestions: Math.random() > 0.5,
  ...overrides,
});

export const mockTestSession = (overrides: Partial<TestSession> = {}): TestSession => {
  const startedAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
  const isCompleted = Math.random() > 0.3;
  
  return {
    id: generateId(),
    userId: generateId(),
    testType: ['full', 'subject-wise', 'custom'][Math.floor(Math.random() * 3)] as any,
    status: isCompleted ? 'completed' : ['active', 'abandoned'][Math.floor(Math.random() * 2)] as any,
    startedAt,
    completedAt: isCompleted ? new Date(startedAt.getTime() + Math.floor(Math.random() * 4 * 60 * 60 * 1000)) : undefined,
    durationSeconds: isCompleted ? Math.floor(Math.random() * 3 * 60 * 60) : undefined,
    totalQuestions: 120,
    configuration: mockTestConfiguration(),
    ...overrides,
  };
};

export const mockQuestionMetadata = (overrides: Partial<QuestionMetadata> = {}): QuestionMetadata => ({
  topic: ['mechanics', 'thermodynamics', 'optics', 'organic_chemistry', 'algebra', 'calculus'][Math.floor(Math.random() * 6)],
  subtopic: `subtopic_${Math.floor(Math.random() * 10)}`,
  yearSource: 2015 + Math.floor(Math.random() * 9), // 2015-2023
  estimatedTime: 60 + Math.floor(Math.random() * 120), // 60-180 seconds
  conceptTags: ['basic', 'intermediate', 'advanced'].slice(0, Math.floor(Math.random() * 3) + 1),
  ...overrides,
});

export const mockQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: generateId(),
  subject: ['physics', 'chemistry', 'mathematics'][Math.floor(Math.random() * 3)] as any,
  difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any,
  questionText: `Sample question text ${Math.floor(Math.random() * 1000)}`,
  options: [
    `Option A ${Math.floor(Math.random() * 100)}`,
    `Option B ${Math.floor(Math.random() * 100)}`,
    `Option C ${Math.floor(Math.random() * 100)}`,
    `Option D ${Math.floor(Math.random() * 100)}`,
  ],
  correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
  explanation: `Explanation for question ${Math.floor(Math.random() * 1000)}`,
  sourcePattern: `pattern_${Math.floor(Math.random() * 50)}`,
  metadata: mockQuestionMetadata(),
  ...overrides,
});

export const mockUserAnswer = (overrides: Partial<UserAnswer> = {}): UserAnswer => {
  const isAnswered = Math.random() > 0.1; // 90% answered
  const selectedAnswer = isAnswered ? ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] : undefined;
  
  return {
    id: generateId(),
    testSessionId: generateId(),
    questionId: generateId(),
    selectedAnswer,
    isCorrect: selectedAnswer ? Math.random() > 0.3 : false, // 70% correct when answered
    timeSpentSeconds: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
    answeredAt: isAnswered ? new Date() : undefined,
    isMarkedForReview: Math.random() > 0.8, // 20% marked for review
    ...overrides,
  };
};

export const mockPerformanceAnalytics = (overrides: Partial<PerformanceAnalytics> = {}): PerformanceAnalytics => {
  const totalQuestions = 40;
  const correctAnswers = Math.floor(Math.random() * totalQuestions);
  
  return {
    id: generateId(),
    userId: generateId(),
    testSessionId: generateId(),
    subject: ['physics', 'chemistry', 'mathematics'][Math.floor(Math.random() * 3)],
    totalQuestions,
    correctAnswers,
    accuracyPercentage: (correctAnswers / totalQuestions) * 100,
    averageTimePerQuestion: 60 + Math.floor(Math.random() * 120), // 60-180 seconds
    strengths: ['problem_solving', 'conceptual_understanding', 'calculation_speed'].slice(0, Math.floor(Math.random() * 3) + 1),
    weaknesses: ['time_management', 'accuracy', 'concept_application'].slice(0, Math.floor(Math.random() * 3) + 1),
    calculatedAt: new Date(),
    ...overrides,
  };
};

/**
 * Generate arrays of mock data
 */
export const mockUsers = (count: number): User[] => 
  Array.from({ length: count }, () => mockUser());

export const mockQuestions = (count: number): Question[] => 
  Array.from({ length: count }, () => mockQuestion());

export const mockTestSessions = (count: number): TestSession[] => 
  Array.from({ length: count }, () => mockTestSession());

export const mockUserAnswers = (count: number): UserAnswer[] => 
  Array.from({ length: count }, () => mockUserAnswer());

/**
 * Create related mock data (e.g., test session with its questions and answers)
 */
export const mockCompleteTestSession = () => {
  const session = mockTestSession({ status: 'completed' });
  const questions = mockQuestions(session.totalQuestions);
  const answers = questions.map(q => mockUserAnswer({ 
    testSessionId: session.id, 
    questionId: q.id 
  }));
  
  return { session, questions, answers };
};