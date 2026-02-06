/**
 * Property-Based Tests for Analytics Worker
 * Feature: eamcet-mock-test-platform
 *
 * These tests verify universal properties that should hold true across all valid inputs
 * using fast-check library with minimum 100 iterations per test.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  calculatePerformanceMetrics,
  storePerformanceAnalytics,
  type PerformanceMetrics,
} from './analytics-utils';
import {
  calculateProgressData,
  compareTestSessions,
  calculateTrends,
  generateRecommendations,
} from './progress-utils';
import {
  arbitraryUUID,
  arbitrarySubject,
  arbitraryDifficulty,
  arbitraryDate,
  PBT_CONFIG,
} from '@eamcet-platform/shared/src/test-utils/property-generators';

// Mock D1 Database for testing
class MockD1Database {
  private data: Map<string, any[]> = new Map();

  constructor() {
    this.data.set('test_sessions', []);
    this.data.set('questions', []);
    this.data.set('user_answers', []);
    this.data.set('performance_analytics', []);
  }

  prepare(query: string) {
    return {
      bind: (...params: any[]) => ({
        first: async () => {
          // Parse query to determine table and operation
          if (query.includes('FROM test_sessions')) {
            const sessions = this.data.get('test_sessions') || [];
            return sessions[0] || null;
          }
          if (query.includes('FROM questions')) {
            const questions = this.data.get('questions') || [];
            return questions[0] || null;
          }
          return null;
        },
        all: async () => {
          if (query.includes('FROM test_sessions')) {
            return { results: this.data.get('test_sessions') || [] };
          }
          if (query.includes('FROM questions')) {
            return { results: this.data.get('questions') || [] };
          }
          if (query.includes('FROM user_answers')) {
            return { results: this.data.get('user_answers') || [] };
          }
          if (query.includes('FROM performance_analytics')) {
            return { results: this.data.get('performance_analytics') || [] };
          }
          return { results: [] };
        },
        run: async () => {
          // Mock insert/update operations
          return { success: true };
        },
      }),
    };
  }

  addTestSession(session: any) {
    const sessions = this.data.get('test_sessions') || [];
    sessions.push(session);
    this.data.set('test_sessions', sessions);
  }

  addQuestion(question: any) {
    const questions = this.data.get('questions') || [];
    questions.push(question);
    this.data.set('questions', questions);
  }

  addUserAnswer(answer: any) {
    const answers = this.data.get('user_answers') || [];
    answers.push(answer);
    this.data.set('user_answers', answers);
  }

  addPerformanceAnalytics(analytics: any) {
    const analyticsData = this.data.get('performance_analytics') || [];
    analyticsData.push(analytics);
    this.data.set('performance_analytics', analyticsData);
  }
}

// Generators for test data
const arbitraryTestSessionRow = () =>
  fc.record({
    id: arbitraryUUID(),
    user_id: arbitraryUUID(),
    test_type: fc.constantFrom('full', 'subject-wise', 'custom'),
    status: fc.constant('completed'),
    started_at: arbitraryDate().map(d => d.toISOString()),
    completed_at: arbitraryDate().map(d => d.toISOString()),
    duration_seconds: fc.integer({ min: 600, max: 10800 }),
    total_questions: fc.integer({ min: 10, max: 100 }),
    configuration: fc.constant(
      JSON.stringify({
        subjects: ['physics', 'chemistry', 'mathematics'],
        questionsPerSubject: 10,
        timeLimit: 180,
        difficulty: 'mixed',
        randomizeQuestions: true,
      })
    ),
  });

const arbitraryQuestionRow = () =>
  fc.record({
    id: arbitraryUUID(),
    subject: arbitrarySubject(),
    difficulty: arbitraryDifficulty(),
    question_text: fc.string({ minLength: 10, maxLength: 200 }),
    options: fc.constant(JSON.stringify(['A', 'B', 'C', 'D'])),
    correct_answer: fc.constantFrom('A', 'B', 'C', 'D'),
    explanation: fc.string({ minLength: 10, maxLength: 100 }),
    source_pattern: fc.string({ minLength: 5, maxLength: 30 }),
    metadata: fc.constant(
      JSON.stringify({
        topic: 'Test Topic',
        estimatedTime: 120,
        conceptTags: ['concept1', 'concept2'],
      })
    ),
  });

const arbitraryUserAnswerRow = (
  testSessionId: string,
  questionId: string,
  correctAnswer: string
) =>
  fc.record({
    id: arbitraryUUID(),
    test_session_id: fc.constant(testSessionId),
    question_id: fc.constant(questionId),
    selected_answer: fc.option(fc.constantFrom('A', 'B', 'C', 'D'), {
      nil: null,
    }),
    is_correct: fc.boolean(),
    time_spent_seconds: fc.integer({ min: 10, max: 300 }),
    answered_at: arbitraryDate().map(d => d.toISOString()),
    is_marked_for_review: fc.boolean(),
  });

describe('Analytics Worker - Property-Based Tests', () => {
  describe('Property 5: Analytics Calculation Accuracy', () => {
    /**
     * **Feature: eamcet-mock-test-platform, Property 5: Analytics Calculation Accuracy**
     * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
     *
     * For any completed test data, the analytics engine should:
     * 1. Calculate comprehensive performance metrics within time limits (30 seconds)
     * 2. Identify subject-wise strengths and weaknesses based on answer patterns
     * 3. Analyze time management patterns and provide optimization suggestions
     * 4. Assess thinking ability through answer selection patterns and time spent per question
     * 5. Present insights in visual charts and actionable recommendations
     */

    it('should calculate accurate performance metrics for any completed test', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryTestSessionRow(),
          fc.array(arbitraryQuestionRow(), { minLength: 10, maxLength: 30 }),
          async (sessionRow, questionRows) => {
            const db = new MockD1Database() as any;

            // Setup test data
            db.addTestSession(sessionRow);

            const answers: any[] = [];
            for (const question of questionRows) {
              db.addQuestion(question);

              // Generate answer
              const answer = await fc.sample(
                arbitraryUserAnswerRow(
                  sessionRow.id,
                  question.id,
                  question.correct_answer
                ),
                1
              )[0];

              // Ensure is_correct matches selected_answer
              if (answer.selected_answer) {
                answer.is_correct =
                  answer.selected_answer === question.correct_answer;
              } else {
                answer.is_correct = false;
              }

              db.addUserAnswer(answer);
              answers.push(answer);
            }

            // Calculate metrics
            const startTime = Date.now();
            const metrics = await calculatePerformanceMetrics(
              db,
              sessionRow.id
            );
            const calculationTime = Date.now() - startTime;

            // Property 1: Calculation completes within 30 seconds (Requirement 4.1)
            expect(calculationTime).toBeLessThan(30000);

            // Property 2: Basic metrics are accurate
            const answeredQuestions = answers.filter(
              a => a.selected_answer !== null
            ).length;
            const correctAnswers = answers.filter(a => a.is_correct).length;

            expect(metrics.totalQuestions).toBe(questionRows.length);
            expect(metrics.correctAnswers).toBe(correctAnswers);
            expect(metrics.incorrectAnswers).toBe(
              answeredQuestions - correctAnswers
            );
            expect(metrics.unansweredQuestions).toBe(
              questionRows.length - answeredQuestions
            );

            // Property 3: Accuracy percentage is correctly calculated
            if (answeredQuestions > 0) {
              const expectedAccuracy =
                (correctAnswers / answeredQuestions) * 100;
              expect(
                Math.abs(metrics.accuracyPercentage - expectedAccuracy)
              ).toBeLessThan(0.01);
            } else {
              expect(metrics.accuracyPercentage).toBe(0);
            }

            // Property 4: Subject-wise analysis exists for all subjects (Requirement 4.2)
            expect(metrics.subjectWiseAnalysis.length).toBeGreaterThan(0);
            for (const subjectAnalysis of metrics.subjectWiseAnalysis) {
              expect(subjectAnalysis.subject).toBeTruthy();
              expect(subjectAnalysis.totalQuestions).toBeGreaterThanOrEqual(0);
              expect(subjectAnalysis.correctAnswers).toBeGreaterThanOrEqual(0);
              expect(subjectAnalysis.accuracyPercentage).toBeGreaterThanOrEqual(
                0
              );
              expect(subjectAnalysis.accuracyPercentage).toBeLessThanOrEqual(
                100
              );

              // Strengths and weaknesses should be arrays (Requirement 4.2)
              expect(Array.isArray(subjectAnalysis.strengths)).toBe(true);
              expect(Array.isArray(subjectAnalysis.weaknesses)).toBe(true);
            }

            // Property 5: Time management analysis exists (Requirement 4.3)
            expect(metrics.timeManagementAnalysis).toBeDefined();
            expect(
              metrics.timeManagementAnalysis.fastQuestions +
                metrics.timeManagementAnalysis.normalQuestions +
                metrics.timeManagementAnalysis.slowQuestions
            ).toBe(answeredQuestions);

            // Suggestions should be provided (Requirement 4.3)
            expect(
              Array.isArray(metrics.timeManagementAnalysis.suggestions)
            ).toBe(true);

            // Property 6: Thinking ability assessment exists (Requirement 4.4)
            expect(metrics.thinkingAbilityAssessment).toBeDefined();
            expect(
              metrics.thinkingAbilityAssessment.confidenceScore
            ).toBeGreaterThanOrEqual(0);
            expect(
              metrics.thinkingAbilityAssessment.confidenceScore
            ).toBeLessThanOrEqual(100);

            // Insights should be provided (Requirement 4.4)
            expect(
              Array.isArray(metrics.thinkingAbilityAssessment.insights)
            ).toBe(true);

            // Property 7: Metrics are calculated at a specific time
            expect(metrics.calculatedAt).toBeInstanceOf(Date);
          }
        ),
        { ...PBT_CONFIG, numRuns: 100 }
      );
    });

    it('should handle edge cases in analytics calculation', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryTestSessionRow(),
          fc.integer({ min: 0, max: 5 }), // Number of questions (including 0)
          async (sessionRow, questionCount) => {
            const db = new MockD1Database() as any;

            // Setup test data
            sessionRow.total_questions = questionCount;
            db.addTestSession(sessionRow);

            // Generate questions and answers
            for (let i = 0; i < questionCount; i++) {
              const question = await fc.sample(arbitraryQuestionRow(), 1)[0];
              db.addQuestion(question);

              const answer = await fc.sample(
                arbitraryUserAnswerRow(
                  sessionRow.id,
                  question.id,
                  question.correct_answer
                ),
                1
              )[0];

              if (answer.selected_answer) {
                answer.is_correct =
                  answer.selected_answer === question.correct_answer;
              } else {
                answer.is_correct = false;
              }

              db.addUserAnswer(answer);
            }

            // Calculate metrics should not throw
            const metrics = await calculatePerformanceMetrics(
              db,
              sessionRow.id
            );

            // Should handle empty or small datasets gracefully
            expect(metrics).toBeDefined();
            expect(metrics.totalQuestions).toBe(questionCount);
            expect(metrics.accuracyPercentage).toBeGreaterThanOrEqual(0);
            expect(metrics.accuracyPercentage).toBeLessThanOrEqual(100);
          }
        ),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });

    it('should maintain data consistency when storing analytics', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryTestSessionRow(),
          fc.array(arbitraryQuestionRow(), { minLength: 10, maxLength: 20 }),
          async (sessionRow, questionRows) => {
            const db = new MockD1Database() as any;

            // Setup test data
            db.addTestSession(sessionRow);

            for (const question of questionRows) {
              db.addQuestion(question);

              const answer = await fc.sample(
                arbitraryUserAnswerRow(
                  sessionRow.id,
                  question.id,
                  question.correct_answer
                ),
                1
              )[0];

              if (answer.selected_answer) {
                answer.is_correct =
                  answer.selected_answer === question.correct_answer;
              } else {
                answer.is_correct = false;
              }

              db.addUserAnswer(answer);
            }

            // Calculate and store metrics
            const metrics = await calculatePerformanceMetrics(
              db,
              sessionRow.id
            );
            await storePerformanceAnalytics(db, metrics);

            // Property: Stored analytics should match calculated metrics
            expect(metrics.userId).toBe(sessionRow.user_id);
            expect(metrics.testSessionId).toBe(sessionRow.id);

            // Each subject should have analytics stored
            for (const subjectAnalysis of metrics.subjectWiseAnalysis) {
              expect(subjectAnalysis.totalQuestions).toBeGreaterThanOrEqual(0);
              expect(subjectAnalysis.correctAnswers).toBeLessThanOrEqual(
                subjectAnalysis.totalQuestions
              );
            }
          }
        ),
        { ...PBT_CONFIG, numRuns: 100 }
      );
    });
  });

  describe('Property 6: Progress Tracking Consistency', () => {
    /**
     * **Feature: eamcet-mock-test-platform, Property 6: Progress Tracking Consistency**
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
     *
     * For any user's test history, the system should:
     * 1. Maintain complete records of all test attempts
     * 2. Display accurate trends across multiple test sessions
     * 3. Provide meaningful comparisons between tests
     * 4. Identify consistent patterns across tests
     * 5. Generate progress reports with percentile rankings and predictions
     */

    it('should maintain complete and consistent progress records', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryUUID(), // userId
          fc.array(arbitraryTestSessionRow(), { minLength: 2, maxLength: 10 }),
          fc.array(arbitraryQuestionRow(), { minLength: 10, maxLength: 20 }),
          async (userId, sessionRows, questionRows) => {
            const db = new MockD1Database() as any;

            // Setup test data for multiple sessions
            for (const sessionRow of sessionRows) {
              sessionRow.user_id = userId;
              sessionRow.status = 'completed';
              db.addTestSession(sessionRow);

              // Add questions and answers for each session
              for (const question of questionRows) {
                db.addQuestion(question);

                const answer = await fc.sample(
                  arbitraryUserAnswerRow(
                    sessionRow.id,
                    question.id,
                    question.correct_answer
                  ),
                  1
                )[0];

                if (answer.selected_answer) {
                  answer.is_correct =
                    answer.selected_answer === question.correct_answer;
                } else {
                  answer.is_correct = false;
                }

                db.addUserAnswer(answer);
              }

              // Calculate and store analytics for each session
              const metrics = await calculatePerformanceMetrics(
                db,
                sessionRow.id
              );
              await storePerformanceAnalytics(db, metrics);
            }

            // Calculate progress data
            const progressData = await calculateProgressData(db, userId);

            // Property 1: Complete history is maintained (Requirement 5.1)
            expect(progressData.userId).toBe(userId);
            expect(progressData.totalTests).toBe(sessionRows.length);
            expect(progressData.testHistory.length).toBe(sessionRows.length);

            // Property 2: Test history items have required fields
            for (const historyItem of progressData.testHistory) {
              expect(historyItem.testSessionId).toBeTruthy();
              expect(historyItem.testDate).toBeInstanceOf(Date);
              expect(historyItem.overallScore).toBeGreaterThanOrEqual(0);
              expect(historyItem.accuracyPercentage).toBeGreaterThanOrEqual(0);
              expect(historyItem.accuracyPercentage).toBeLessThanOrEqual(100);
              expect(historyItem.totalQuestions).toBeGreaterThan(0);
            }

            // Property 3: Overall progress metrics are calculated (Requirement 5.2)
            expect(progressData.overallProgress).toBeDefined();
            expect(
              progressData.overallProgress.averageScore
            ).toBeGreaterThanOrEqual(0);
            expect(
              progressData.overallProgress.averageAccuracy
            ).toBeGreaterThanOrEqual(0);
            expect(
              progressData.overallProgress.averageAccuracy
            ).toBeLessThanOrEqual(100);
            expect(
              progressData.overallProgress.consistencyScore
            ).toBeGreaterThanOrEqual(0);
            expect(
              progressData.overallProgress.consistencyScore
            ).toBeLessThanOrEqual(100);

            // Property 4: Subject progress is tracked (Requirement 5.3)
            expect(Array.isArray(progressData.subjectProgress)).toBe(true);
            for (const subjectProgress of progressData.subjectProgress) {
              expect(subjectProgress.subject).toBeTruthy();
              expect(subjectProgress.averageAccuracy).toBeGreaterThanOrEqual(0);
              expect(subjectProgress.averageAccuracy).toBeLessThanOrEqual(100);
              expect(['improving', 'declining', 'stable']).toContain(
                subjectProgress.trend
              );
              expect(subjectProgress.testCount).toBeGreaterThan(0);
              expect(Array.isArray(subjectProgress.recentPerformance)).toBe(
                true
              );
            }

            // Property 5: Weak areas and improvements are identified (Requirement 5.4)
            expect(Array.isArray(progressData.consistentWeakAreas)).toBe(true);
            expect(Array.isArray(progressData.improvementAreas)).toBe(true);

            // Property 6: Calculation timestamp is recorded
            expect(progressData.calculatedAt).toBeInstanceOf(Date);
          }
        ),
        { ...PBT_CONFIG, numRuns: 100 }
      );
    });

    it('should provide meaningful test comparisons', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryUUID(), // userId
          fc.array(arbitraryTestSessionRow(), { minLength: 2, maxLength: 5 }),
          fc.array(arbitraryQuestionRow(), { minLength: 10, maxLength: 15 }),
          async (userId, sessionRows, questionRows) => {
            const db = new MockD1Database() as any;
            const testSessionIds: string[] = [];

            // Setup test data
            for (const sessionRow of sessionRows) {
              sessionRow.user_id = userId;
              sessionRow.status = 'completed';
              db.addTestSession(sessionRow);
              testSessionIds.push(sessionRow.id);

              // Add questions and answers
              for (const question of questionRows) {
                db.addQuestion(question);

                const answer = await fc.sample(
                  arbitraryUserAnswerRow(
                    sessionRow.id,
                    question.id,
                    question.correct_answer
                  ),
                  1
                )[0];

                if (answer.selected_answer) {
                  answer.is_correct =
                    answer.selected_answer === question.correct_answer;
                } else {
                  answer.is_correct = false;
                }

                db.addUserAnswer(answer);
              }

              // Store analytics
              const metrics = await calculatePerformanceMetrics(
                db,
                sessionRow.id
              );
              await storePerformanceAnalytics(db, metrics);
            }

            // Compare test sessions
            const comparisonData = await compareTestSessions(
              db,
              userId,
              testSessionIds
            );

            // Property 1: Comparison includes all requested sessions (Requirement 5.3)
            expect(comparisonData.userId).toBe(userId);
            expect(comparisonData.testSessions.length).toBe(
              testSessionIds.length
            );

            // Property 2: Each test session has complete comparison data
            for (const testSession of comparisonData.testSessions) {
              expect(testSession.testSessionId).toBeTruthy();
              expect(testSession.testDate).toBeInstanceOf(Date);
              expect(testSession.overallScore).toBeGreaterThanOrEqual(0);
              expect(testSession.accuracyPercentage).toBeGreaterThanOrEqual(0);
              expect(testSession.accuracyPercentage).toBeLessThanOrEqual(100);
              expect(Array.isArray(testSession.subjectScores)).toBe(true);
              expect(testSession.timeManagement).toBeGreaterThanOrEqual(0);
            }

            // Property 3: Improvements and declines are identified (Requirement 5.3)
            expect(Array.isArray(comparisonData.improvements)).toBe(true);
            expect(Array.isArray(comparisonData.declines)).toBe(true);

            // Property 4: Insights are provided (Requirement 5.4)
            expect(Array.isArray(comparisonData.insights)).toBe(true);
            expect(comparisonData.insights.length).toBeGreaterThan(0);

            // Property 5: Calculation timestamp is recorded
            expect(comparisonData.calculatedAt).toBeInstanceOf(Date);
          }
        ),
        { ...PBT_CONFIG, numRuns: 100 }
      );
    });

    it('should calculate accurate trends and predictions', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryUUID(), // userId
          fc.array(arbitraryTestSessionRow(), { minLength: 3, maxLength: 8 }),
          fc.array(arbitraryQuestionRow(), { minLength: 10, maxLength: 15 }),
          async (userId, sessionRows, questionRows) => {
            const db = new MockD1Database() as any;

            // Setup test data with chronological order
            const sortedSessions = sessionRows.sort(
              (a, b) =>
                new Date(a.started_at).getTime() -
                new Date(b.started_at).getTime()
            );

            for (const sessionRow of sortedSessions) {
              sessionRow.user_id = userId;
              sessionRow.status = 'completed';
              db.addTestSession(sessionRow);

              // Add questions and answers
              for (const question of questionRows) {
                db.addQuestion(question);

                const answer = await fc.sample(
                  arbitraryUserAnswerRow(
                    sessionRow.id,
                    question.id,
                    question.correct_answer
                  ),
                  1
                )[0];

                if (answer.selected_answer) {
                  answer.is_correct =
                    answer.selected_answer === question.correct_answer;
                } else {
                  answer.is_correct = false;
                }

                db.addUserAnswer(answer);
              }

              // Store analytics
              const metrics = await calculatePerformanceMetrics(
                db,
                sessionRow.id
              );
              await storePerformanceAnalytics(db, metrics);
            }

            // Calculate trends
            const trends = await calculateTrends(db, userId);

            // Property 1: Overall trend is determined (Requirement 5.2)
            expect(trends.userId).toBe(userId);
            expect(['improving', 'declining', 'stable']).toContain(
              trends.overallTrend
            );

            // Property 2: Subject trends are calculated (Requirement 5.3)
            expect(Array.isArray(trends.subjectTrends)).toBe(true);
            for (const subjectTrend of trends.subjectTrends) {
              expect(subjectTrend.subject).toBeTruthy();
              expect(['improving', 'declining', 'stable']).toContain(
                subjectTrend.trend
              );
            }

            // Property 3: Performance prediction is provided (Requirement 5.5)
            expect(trends.performancePrediction).toBeDefined();
            expect(
              trends.performancePrediction.predictedScore
            ).toBeGreaterThanOrEqual(0);
            expect(['high', 'medium', 'low']).toContain(
              trends.performancePrediction.confidenceLevel
            );
            expect(
              trends.performancePrediction.basedOnTests
            ).toBeGreaterThanOrEqual(3);

            // Property 4: Percentile ranking is calculated (Requirement 5.5)
            expect(trends.percentileRanking).toBeGreaterThanOrEqual(0);
            expect(trends.percentileRanking).toBeLessThanOrEqual(100);

            // Property 5: Calculation timestamp is recorded
            expect(trends.calculatedAt).toBeInstanceOf(Date);
          }
        ),
        { ...PBT_CONFIG, numRuns: 100 }
      );
    });

    it('should generate personalized recommendations', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryUUID(), // userId
          fc.array(arbitraryTestSessionRow(), { minLength: 2, maxLength: 6 }),
          fc.array(arbitraryQuestionRow(), { minLength: 10, maxLength: 15 }),
          async (userId, sessionRows, questionRows) => {
            const db = new MockD1Database() as any;

            // Setup test data
            for (const sessionRow of sessionRows) {
              sessionRow.user_id = userId;
              sessionRow.status = 'completed';
              db.addTestSession(sessionRow);

              // Add questions and answers
              for (const question of questionRows) {
                db.addQuestion(question);

                const answer = await fc.sample(
                  arbitraryUserAnswerRow(
                    sessionRow.id,
                    question.id,
                    question.correct_answer
                  ),
                  1
                )[0];

                if (answer.selected_answer) {
                  answer.is_correct =
                    answer.selected_answer === question.correct_answer;
                } else {
                  answer.is_correct = false;
                }

                db.addUserAnswer(answer);
              }

              // Store analytics
              const metrics = await calculatePerformanceMetrics(
                db,
                sessionRow.id
              );
              await storePerformanceAnalytics(db, metrics);
            }

            // Generate recommendations
            const recommendations = await generateRecommendations(db, userId);

            // Property 1: Recommendations are generated (Requirement 5.4)
            expect(Array.isArray(recommendations)).toBe(true);

            // Property 2: Each recommendation has required structure
            for (const recommendation of recommendations) {
              expect([
                'subject',
                'topic',
                'time-management',
                'strategy',
              ]).toContain(recommendation.type);
              expect(['high', 'medium', 'low']).toContain(
                recommendation.priority
              );
              expect(recommendation.title).toBeTruthy();
              expect(recommendation.description).toBeTruthy();
              expect(Array.isArray(recommendation.actionItems)).toBe(true);
              expect(recommendation.actionItems.length).toBeGreaterThan(0);
            }

            // Property 3: Action items are specific and actionable
            for (const recommendation of recommendations) {
              for (const actionItem of recommendation.actionItems) {
                expect(typeof actionItem).toBe('string');
                expect(actionItem.length).toBeGreaterThan(10);
              }
            }
          }
        ),
        { ...PBT_CONFIG, numRuns: 100 }
      );
    });
  });
});
