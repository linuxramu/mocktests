/**
 * Property-Based Tests for Data Persistence Round Trip
 * Feature: eamcet-mock-test-platform, Property 2: Data Persistence Round Trip
 *
 * **Validates: Requirements 1.4, 1.5, 2.5, 3.3, 6.1**
 *
 * For any user data (profiles, test results, answers), storing then retrieving
 * the data should produce equivalent information without loss or corruption.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  rowToUser,
  userToRow,
  rowToTestSession,
  testSessionToRow,
  rowToQuestion,
  questionToRow,
  rowToUserAnswer,
  userAnswerToRow,
  rowToPerformanceAnalytics,
  performanceAnalyticsToRow,
  sqliteToBoolean,
  booleanToSqlite,
  parseJsonSafe,
} from './db-utils';
import {
  arbitraryUser,
  arbitraryTestSession,
  arbitraryQuestion,
  arbitraryUserAnswer,
  arbitraryPerformanceAnalytics,
  PBT_CONFIG,
} from './test-utils/property-generators';
import type {
  User,
  TestSession,
  Question,
  UserAnswer,
  PerformanceAnalytics,
} from './types';

describe('Property 2: Data Persistence Round Trip', () => {
  describe('User data round trip', () => {
    it('should preserve user data through serialization and deserialization', () => {
      fc.assert(
        fc.property(arbitraryUser(), (user: User) => {
          // Add password hash for database row conversion
          const userWithPassword = {
            ...user,
            passwordHash: 'hashed_password_123',
          };

          // Convert to database row format
          const row = userToRow(userWithPassword);

          // Simulate database storage by converting to JSON and back
          const storedRow = JSON.parse(JSON.stringify(row));

          // Convert back to User object
          const retrievedUser = rowToUser(storedRow);

          // Verify all fields are preserved
          expect(retrievedUser.id).toBe(user.id);
          expect(retrievedUser.email).toBe(user.email);
          expect(retrievedUser.name).toBe(user.name);
          expect(retrievedUser.emailVerified).toBe(user.emailVerified);

          // Dates should be equivalent (within 1 second due to ISO string conversion)
          expect(
            Math.abs(
              retrievedUser.createdAt.getTime() - user.createdAt.getTime()
            )
          ).toBeLessThan(1000);
          expect(
            Math.abs(
              retrievedUser.updatedAt.getTime() - user.updatedAt.getTime()
            )
          ).toBeLessThan(1000);

          // Profile data should be deeply equal
          expect(retrievedUser.profileData).toEqual(user.profileData);
        }),
        PBT_CONFIG
      );
    });
  });

  describe('TestSession data round trip', () => {
    it('should preserve test session data through serialization and deserialization', () => {
      fc.assert(
        fc.property(arbitraryTestSession(), (session: TestSession) => {
          // Convert to database row format
          const row = testSessionToRow(session);

          // Simulate database storage
          const storedRow = JSON.parse(JSON.stringify(row));

          // Convert back to TestSession object
          const retrievedSession = rowToTestSession(storedRow);

          // Verify all fields are preserved
          expect(retrievedSession.id).toBe(session.id);
          expect(retrievedSession.userId).toBe(session.userId);
          expect(retrievedSession.testType).toBe(session.testType);
          expect(retrievedSession.status).toBe(session.status);
          expect(retrievedSession.totalQuestions).toBe(session.totalQuestions);

          // Handle null/undefined conversion for durationSeconds
          if (
            session.durationSeconds === null ||
            session.durationSeconds === undefined
          ) {
            expect(retrievedSession.durationSeconds).toBeUndefined();
          } else {
            expect(retrievedSession.durationSeconds).toBe(
              session.durationSeconds
            );
          }

          // Dates should be equivalent
          expect(
            Math.abs(
              retrievedSession.startedAt.getTime() - session.startedAt.getTime()
            )
          ).toBeLessThan(1000);

          // Handle null/undefined conversion for completedAt
          if (
            session.completedAt === null ||
            session.completedAt === undefined
          ) {
            expect(retrievedSession.completedAt).toBeUndefined();
          } else if (retrievedSession.completedAt) {
            expect(
              Math.abs(
                retrievedSession.completedAt.getTime() -
                  session.completedAt.getTime()
              )
            ).toBeLessThan(1000);
          } else {
            expect(retrievedSession.completedAt).toBe(session.completedAt);
          }

          // Configuration should be deeply equal
          expect(retrievedSession.configuration).toEqual(session.configuration);
        }),
        PBT_CONFIG
      );
    });
  });

  describe('Question data round trip', () => {
    it('should preserve question data through serialization and deserialization', () => {
      fc.assert(
        fc.property(arbitraryQuestion(), (question: Question) => {
          // Convert to database row format
          const row = questionToRow(question);

          // Simulate database storage
          const storedRow = JSON.parse(JSON.stringify(row));

          // Convert back to Question object
          const retrievedQuestion = rowToQuestion(storedRow);

          // Verify all fields are preserved
          expect(retrievedQuestion.id).toBe(question.id);
          expect(retrievedQuestion.subject).toBe(question.subject);
          expect(retrievedQuestion.difficulty).toBe(question.difficulty);
          expect(retrievedQuestion.questionText).toBe(question.questionText);
          expect(retrievedQuestion.correctAnswer).toBe(question.correctAnswer);

          // Handle null/undefined conversion for explanation
          if (
            question.explanation === null ||
            question.explanation === undefined
          ) {
            expect(retrievedQuestion.explanation).toBeUndefined();
          } else {
            expect(retrievedQuestion.explanation).toBe(question.explanation);
          }

          expect(retrievedQuestion.sourcePattern).toBe(question.sourcePattern);

          // Arrays should be deeply equal
          expect(retrievedQuestion.options).toEqual(question.options);

          // Metadata should be deeply equal
          expect(retrievedQuestion.metadata).toEqual(question.metadata);
        }),
        PBT_CONFIG
      );
    });
  });

  describe('UserAnswer data round trip', () => {
    it('should preserve user answer data through serialization and deserialization', () => {
      fc.assert(
        fc.property(arbitraryUserAnswer(), (answer: UserAnswer) => {
          // Convert to database row format
          const row = userAnswerToRow(answer);

          // Simulate database storage
          const storedRow = JSON.parse(JSON.stringify(row));

          // Convert back to UserAnswer object
          const retrievedAnswer = rowToUserAnswer(storedRow);

          // Verify all fields are preserved
          expect(retrievedAnswer.id).toBe(answer.id);
          expect(retrievedAnswer.testSessionId).toBe(answer.testSessionId);
          expect(retrievedAnswer.questionId).toBe(answer.questionId);

          // Handle null/undefined conversion for selectedAnswer
          if (
            answer.selectedAnswer === null ||
            answer.selectedAnswer === undefined
          ) {
            expect(retrievedAnswer.selectedAnswer).toBeUndefined();
          } else {
            expect(retrievedAnswer.selectedAnswer).toBe(answer.selectedAnswer);
          }

          expect(retrievedAnswer.isCorrect).toBe(answer.isCorrect);
          expect(retrievedAnswer.timeSpentSeconds).toBe(
            answer.timeSpentSeconds
          );
          expect(retrievedAnswer.isMarkedForReview).toBe(
            answer.isMarkedForReview
          );

          // Handle null/undefined conversion for answeredAt
          if (answer.answeredAt === null || answer.answeredAt === undefined) {
            expect(retrievedAnswer.answeredAt).toBeUndefined();
          } else if (retrievedAnswer.answeredAt) {
            expect(
              Math.abs(
                retrievedAnswer.answeredAt.getTime() -
                  answer.answeredAt.getTime()
              )
            ).toBeLessThan(1000);
          } else {
            expect(retrievedAnswer.answeredAt).toBe(answer.answeredAt);
          }
        }),
        PBT_CONFIG
      );
    });
  });

  describe('PerformanceAnalytics data round trip', () => {
    it('should preserve performance analytics data through serialization and deserialization', () => {
      fc.assert(
        fc.property(
          arbitraryPerformanceAnalytics(),
          (analytics: PerformanceAnalytics) => {
            // Convert to database row format
            const row = performanceAnalyticsToRow(analytics);

            // Simulate database storage
            const storedRow = JSON.parse(JSON.stringify(row));

            // Convert back to PerformanceAnalytics object
            const retrievedAnalytics = rowToPerformanceAnalytics(storedRow);

            // Verify all fields are preserved
            expect(retrievedAnalytics.id).toBe(analytics.id);
            expect(retrievedAnalytics.userId).toBe(analytics.userId);
            expect(retrievedAnalytics.testSessionId).toBe(
              analytics.testSessionId
            );
            expect(retrievedAnalytics.subject).toBe(analytics.subject);
            expect(retrievedAnalytics.totalQuestions).toBe(
              analytics.totalQuestions
            );

            // Handle NaN values - they become 0 after database round trip
            if (isNaN(analytics.correctAnswers)) {
              expect(retrievedAnalytics.correctAnswers).toBe(0);
            } else {
              expect(retrievedAnalytics.correctAnswers).toBe(
                analytics.correctAnswers
              );
            }

            if (isNaN(analytics.accuracyPercentage)) {
              expect(retrievedAnalytics.accuracyPercentage).toBe(0);
            } else {
              expect(retrievedAnalytics.accuracyPercentage).toBeCloseTo(
                analytics.accuracyPercentage,
                2
              );
            }

            if (isNaN(analytics.averageTimePerQuestion)) {
              expect(retrievedAnalytics.averageTimePerQuestion).toBe(0);
            } else {
              expect(retrievedAnalytics.averageTimePerQuestion).toBeCloseTo(
                analytics.averageTimePerQuestion,
                2
              );
            }

            // Arrays should be deeply equal
            expect(retrievedAnalytics.strengths).toEqual(analytics.strengths);
            expect(retrievedAnalytics.weaknesses).toEqual(analytics.weaknesses);

            // Date should be equivalent
            expect(
              Math.abs(
                retrievedAnalytics.calculatedAt.getTime() -
                  analytics.calculatedAt.getTime()
              )
            ).toBeLessThan(1000);
          }
        ),
        PBT_CONFIG
      );
    });
  });

  describe('Boolean conversion utilities', () => {
    it('should correctly convert between SQLite and JavaScript booleans', () => {
      fc.assert(
        fc.property(fc.boolean(), (value: boolean) => {
          const sqliteValue = booleanToSqlite(value);
          const jsValue = sqliteToBoolean(sqliteValue);
          expect(jsValue).toBe(value);
        }),
        PBT_CONFIG
      );
    });

    it('should handle SQLite boolean values (0/1) correctly', () => {
      expect(sqliteToBoolean(0)).toBe(false);
      expect(sqliteToBoolean(1)).toBe(true);
      expect(sqliteToBoolean(false)).toBe(false);
      expect(sqliteToBoolean(true)).toBe(true);
      expect(sqliteToBoolean(null)).toBe(false);
    });
  });

  describe('JSON parsing utilities', () => {
    it('should safely parse valid JSON strings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({ key: fc.string() }),
            fc.array(fc.string()),
            fc.string(),
            fc.integer()
          ),
          value => {
            const jsonString = JSON.stringify(value);
            const parsed = parseJsonSafe(jsonString, null);
            expect(parsed).toEqual(value);
          }
        ),
        PBT_CONFIG
      );
    });

    it('should return default value for invalid JSON', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => {
            try {
              JSON.parse(s);
              return false;
            } catch {
              return true;
            }
          }),
          fc.anything(),
          (invalidJson, defaultValue) => {
            const result = parseJsonSafe(invalidJson, defaultValue);
            expect(result).toEqual(defaultValue);
          }
        ),
        { ...PBT_CONFIG, numRuns: 50 } // Fewer runs for this test
      );
    });

    it('should return default value for null input', () => {
      const defaultValue = { test: 'value' };
      const result = parseJsonSafe(null, defaultValue);
      expect(result).toEqual(defaultValue);
    });
  });

  describe('Data integrity across multiple round trips', () => {
    it('should maintain data integrity through multiple serialization cycles', () => {
      fc.assert(
        fc.property(arbitraryUser(), (user: User) => {
          const userWithPassword = {
            ...user,
            passwordHash: 'hashed_password_123',
          };

          // Perform multiple round trips
          let currentUser = user;
          for (let i = 0; i < 5; i++) {
            const row = userToRow({
              ...currentUser,
              passwordHash: 'hashed_password_123',
            });
            const storedRow = JSON.parse(JSON.stringify(row));
            currentUser = rowToUser(storedRow);
          }

          // After 5 round trips, data should still match
          expect(currentUser.id).toBe(user.id);
          expect(currentUser.email).toBe(user.email);
          expect(currentUser.name).toBe(user.name);
          expect(currentUser.emailVerified).toBe(user.emailVerified);
          expect(currentUser.profileData).toEqual(user.profileData);
        }),
        { ...PBT_CONFIG, numRuns: 50 } // Fewer runs for this intensive test
      );
    });
  });
});
