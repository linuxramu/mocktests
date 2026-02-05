import * as fc from 'fast-check';
import type {
  User,
  UserProfileData,
  TestSession,
  TestConfiguration,
  Question,
  QuestionMetadata,
  UserAnswer,
  PerformanceAnalytics,
} from '../types';

/**
 * Property-based testing generators using fast-check
 * These generators create random but valid data for property testing
 */

/**
 * Configuration for property-based tests
 * Ensures minimum 100 iterations as specified in requirements
 */
export const PBT_CONFIG = {
  numRuns: 100,
  timeout: 30000, // 30 seconds
  verbose: true,
};

// Basic generators
export const arbitraryEmail = (): fc.Arbitrary<string> =>
  fc
    .tuple(
      fc.stringOf(
        fc.char().filter(c => /[a-zA-Z0-9]/.test(c)),
        { minLength: 1, maxLength: 20 }
      ),
      fc.constantFrom('gmail.com', 'yahoo.com', 'example.com', 'test.org')
    )
    .map(([local, domain]) => `${local}@${domain}`);

export const arbitraryUUID = (): fc.Arbitrary<string> =>
  fc
    .tuple(
      fc.hexaString({ minLength: 8, maxLength: 8 }),
      fc.hexaString({ minLength: 4, maxLength: 4 }),
      fc.hexaString({ minLength: 4, maxLength: 4 }),
      fc.hexaString({ minLength: 4, maxLength: 4 }),
      fc.hexaString({ minLength: 12, maxLength: 12 })
    )
    .map(([a, b, c, d, e]) => `${a}-${b}-${c}-${d}-${e}`);

export const arbitraryDate = (): fc.Arbitrary<Date> =>
  fc.integer({ min: 0, max: Date.now() }).map(timestamp => new Date(timestamp));

export const arbitraryFutureDate = (): fc.Arbitrary<Date> =>
  fc
    .integer({ min: Date.now(), max: Date.now() + 365 * 24 * 60 * 60 * 1000 })
    .map(timestamp => new Date(timestamp));

export const arbitraryPastDate = (): fc.Arbitrary<Date> =>
  fc
    .integer({ min: Date.now() - 365 * 24 * 60 * 60 * 1000, max: Date.now() })
    .map(timestamp => new Date(timestamp));

// Domain-specific generators
export const arbitrarySubject = (): fc.Arbitrary<
  'physics' | 'chemistry' | 'mathematics'
> => fc.constantFrom('physics', 'chemistry', 'mathematics');

export const arbitraryDifficulty = (): fc.Arbitrary<
  'easy' | 'medium' | 'hard'
> => fc.constantFrom('easy', 'medium', 'hard');

export const arbitraryTestType = (): fc.Arbitrary<
  'full' | 'subject-wise' | 'custom'
> => fc.constantFrom('full', 'subject-wise', 'custom');

export const arbitraryTestStatus = (): fc.Arbitrary<
  'active' | 'completed' | 'abandoned'
> => fc.constantFrom('active', 'completed', 'abandoned');

export const arbitraryUserProfileData = (): fc.Arbitrary<UserProfileData> =>
  fc.record({
    targetScore: fc.option(fc.integer({ min: 50, max: 200 })),
    preferredSubjects: fc.option(
      fc.array(arbitrarySubject(), { minLength: 1, maxLength: 3 })
    ),
    studyGoals: fc.option(
      fc.array(
        fc.constantFrom(
          'improve_accuracy',
          'time_management',
          'concept_clarity',
          'speed_building'
        ),
        { minLength: 1, maxLength: 4 }
      )
    ),
    timeZone: fc.option(
      fc.constantFrom('Asia/Kolkata', 'UTC', 'America/New_York')
    ),
  });

export const arbitraryUser = (): fc.Arbitrary<User> =>
  fc.record({
    id: arbitraryUUID(),
    email: arbitraryEmail(),
    name: fc.string({ minLength: 2, maxLength: 50 }),
    createdAt: arbitraryPastDate(),
    updatedAt: arbitraryDate(),
    emailVerified: fc.boolean(),
    profileData: arbitraryUserProfileData(),
  });

export const arbitraryTestConfiguration = (): fc.Arbitrary<TestConfiguration> =>
  fc.record({
    subjects: fc.array(arbitrarySubject(), { minLength: 1, maxLength: 3 }),
    questionsPerSubject: fc.integer({ min: 10, max: 50 }),
    timeLimit: fc.integer({ min: 30, max: 300 }), // 30 minutes to 5 hours
    difficulty: fc.oneof(fc.constant('mixed' as const), arbitraryDifficulty()),
    randomizeQuestions: fc.boolean(),
  });

export const arbitraryQuestionMetadata = (): fc.Arbitrary<QuestionMetadata> =>
  fc.record({
    topic: fc.string({ minLength: 3, maxLength: 30 }),
    subtopic: fc.option(fc.string({ minLength: 3, maxLength: 30 })),
    yearSource: fc.option(fc.integer({ min: 2010, max: 2024 })),
    estimatedTime: fc.integer({ min: 30, max: 300 }), // 30 seconds to 5 minutes
    conceptTags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
      minLength: 1,
      maxLength: 5,
    }),
  });

export const arbitraryQuestion = (): fc.Arbitrary<Question> =>
  fc.record({
    id: arbitraryUUID(),
    subject: arbitrarySubject(),
    difficulty: arbitraryDifficulty(),
    questionText: fc.string({ minLength: 10, maxLength: 500 }),
    options: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
      minLength: 4,
      maxLength: 4,
    }),
    correctAnswer: fc.constantFrom('A', 'B', 'C', 'D'),
    explanation: fc.option(fc.string({ minLength: 10, maxLength: 300 })),
    sourcePattern: fc.string({ minLength: 5, maxLength: 50 }),
    metadata: arbitraryQuestionMetadata(),
  });

export const arbitraryTestSession = (): fc.Arbitrary<TestSession> =>
  fc.record({
    id: arbitraryUUID(),
    userId: arbitraryUUID(),
    testType: arbitraryTestType(),
    status: arbitraryTestStatus(),
    startedAt: arbitraryPastDate(),
    completedAt: fc.option(arbitraryDate()),
    durationSeconds: fc.option(fc.integer({ min: 60, max: 18000 })), // 1 minute to 5 hours
    totalQuestions: fc.integer({ min: 10, max: 200 }),
    configuration: arbitraryTestConfiguration(),
  });

export const arbitraryUserAnswer = (): fc.Arbitrary<UserAnswer> =>
  fc.record({
    id: arbitraryUUID(),
    testSessionId: arbitraryUUID(),
    questionId: arbitraryUUID(),
    selectedAnswer: fc.option(fc.constantFrom('A', 'B', 'C', 'D')),
    isCorrect: fc.boolean(),
    timeSpentSeconds: fc.integer({ min: 5, max: 600 }), // 5 seconds to 10 minutes
    answeredAt: fc.option(arbitraryDate()),
    isMarkedForReview: fc.boolean(),
  });

export const arbitraryPerformanceAnalytics =
  (): fc.Arbitrary<PerformanceAnalytics> => {
    return fc
      .tuple(
        fc.integer({ min: 10, max: 100 }), // totalQuestions
        fc.float({ min: 0, max: 1 }) // accuracy ratio
      )
      .chain(([totalQuestions, accuracyRatio]) => {
        const correctAnswers = Math.floor(totalQuestions * accuracyRatio);
        const accuracyPercentage = (correctAnswers / totalQuestions) * 100;

        return fc.record({
          id: arbitraryUUID(),
          userId: arbitraryUUID(),
          testSessionId: arbitraryUUID(),
          subject: arbitrarySubject(),
          totalQuestions: fc.constant(totalQuestions),
          correctAnswers: fc.constant(correctAnswers),
          accuracyPercentage: fc.constant(accuracyPercentage),
          averageTimePerQuestion: fc.float({ min: 30, max: 300 }),
          strengths: fc.array(fc.string({ minLength: 5, maxLength: 30 }), {
            minLength: 0,
            maxLength: 5,
          }),
          weaknesses: fc.array(fc.string({ minLength: 5, maxLength: 30 }), {
            minLength: 0,
            maxLength: 5,
          }),
          calculatedAt: arbitraryDate(),
        });
      });
  };

// Composite generators for related data
export const arbitraryCompleteTestSession = (): fc.Arbitrary<{
  session: TestSession;
  questions: Question[];
  answers: UserAnswer[];
}> =>
  fc
    .tuple(arbitraryTestSession(), fc.integer({ min: 10, max: 50 }))
    .chain(([session, questionCount]) =>
      fc.record({
        session: fc.constant({ ...session, totalQuestions: questionCount }),
        questions: fc.array(arbitraryQuestion(), {
          minLength: questionCount,
          maxLength: questionCount,
        }),
        answers: fc.array(
          arbitraryUserAnswer().map(answer => ({
            ...answer,
            testSessionId: session.id,
          })),
          { minLength: questionCount, maxLength: questionCount }
        ),
      })
    );

// Validation generators (for testing edge cases)
export const arbitraryInvalidEmail = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.constant(''),
    fc.constant('invalid'),
    fc.constant('@example.com'),
    fc.constant('test@'),
    fc.constant('test..test@example.com'),
    fc.string().filter(s => !s.includes('@'))
  );

export const arbitraryInvalidUUID = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.constant(''),
    fc.constant('invalid-uuid'),
    fc.string({ minLength: 1, maxLength: 35 }),
    fc.string({ minLength: 37, maxLength: 50 })
  );

// Helper function to run property tests with consistent configuration
export const runPropertyTest = <T>(
  name: string,
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | void,
  config: Partial<fc.Parameters<T>> = {}
): void => {
  const property = fc.property(arbitrary, predicate);
  fc.assert(property as any, {
    ...PBT_CONFIG,
    ...config,
  });
};
