import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculatePerformanceMetrics,
  storePerformanceAnalytics,
  getUserPerformanceAnalytics,
  getSubjectWiseBreakdown,
  type PerformanceMetrics,
} from './analytics-utils';
import {
  calculateProgressData,
  compareTestSessions,
  calculateTrends,
  generateRecommendations,
} from './progress-utils';

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

describe('Analytics Worker - Unit Tests', () => {
  describe('Performance Metrics Calculation', () => {
    it('should calculate correct accuracy percentage', async () => {
      const db = new MockD1Database() as any;
      const sessionId = 'test-session-1';
      const userId = 'user-1';

      // Setup test data
      db.addTestSession({
        id: sessionId,
        user_id: userId,
        test_type: 'full',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: 3600,
        total_questions: 10,
        configuration: JSON.stringify({
          subjects: ['physics'],
          questionsPerSubject: 10,
          timeLimit: 60,
          difficulty: 'mixed',
          randomizeQuestions: true,
        }),
      });

      // Add 10 questions
      for (let i = 0; i < 10; i++) {
        const questionId = `question-${i}`;
        db.addQuestion({
          id: questionId,
          subject: 'physics',
          difficulty: 'easy',
          question_text: `Question ${i}`,
          options: JSON.stringify(['A', 'B', 'C', 'D']),
          correct_answer: 'A',
          explanation: 'Explanation',
          source_pattern: 'pattern',
          metadata: JSON.stringify({
            topic: 'Mechanics',
            estimatedTime: 120,
            conceptTags: ['force', 'motion'],
          }),
        });

        // Add answers - 7 correct, 3 incorrect
        db.addUserAnswer({
          id: `answer-${i}`,
          test_session_id: sessionId,
          question_id: questionId,
          selected_answer: i < 7 ? 'A' : 'B',
          is_correct: i < 7,
          time_spent_seconds: 120,
          answered_at: new Date().toISOString(),
          is_marked_for_review: false,
        });
      }

      const metrics = await calculatePerformanceMetrics(db, sessionId);

      expect(metrics.totalQuestions).toBe(10);
      expect(metrics.correctAnswers).toBe(7);
      expect(metrics.incorrectAnswers).toBe(3);
      expect(metrics.accuracyPercentage).toBe(70);
    });

    it('should handle edge case with no answers', async () => {
      const db = new MockD1Database() as any;
      const sessionId = 'test-session-2';

      db.addTestSession({
        id: sessionId,
        user_id: 'user-1',
        test_type: 'full',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: 3600,
        total_questions: 5,
        configuration: JSON.stringify({
          subjects: ['physics'],
          questionsPerSubject: 5,
          timeLimit: 60,
          difficulty: 'mixed',
          randomizeQuestions: true,
        }),
      });

      // Add questions but no answers
      for (let i = 0; i < 5; i++) {
        db.addQuestion({
          id: `question-${i}`,
          subject: 'physics',
          difficulty: 'easy',
          question_text: `Question ${i}`,
          options: JSON.stringify(['A', 'B', 'C', 'D']),
          correct_answer: 'A',
          explanation: 'Explanation',
          source_pattern: 'pattern',
          metadata: JSON.stringify({
            topic: 'Mechanics',
            estimatedTime: 120,
            conceptTags: ['force'],
          }),
        });
      }

      const metrics = await calculatePerformanceMetrics(db, sessionId);

      expect(metrics.totalQuestions).toBe(5);
      expect(metrics.correctAnswers).toBe(0);
      expect(metrics.unansweredQuestions).toBe(5);
      expect(metrics.accuracyPercentage).toBe(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should calculate progress data correctly', async () => {
      const db = new MockD1Database() as any;
      const userId = 'user-1';

      // Add 2 completed test sessions
      for (let i = 0; i < 2; i++) {
        const sessionId = `session-${i}`;
        db.addTestSession({
          id: sessionId,
          user_id: userId,
          test_type: 'full',
          status: 'completed',
          started_at: new Date(Date.now() - i * 86400000).toISOString(),
          completed_at: new Date(Date.now() - i * 86400000).toISOString(),
          duration_seconds: 3600,
          total_questions: 10,
          configuration: JSON.stringify({
            subjects: ['physics'],
            questionsPerSubject: 10,
            timeLimit: 60,
            difficulty: 'mixed',
            randomizeQuestions: true,
          }),
        });

        // Add analytics for each session
        db.addPerformanceAnalytics({
          id: `analytics-${i}`,
          user_id: userId,
          test_session_id: sessionId,
          subject: 'physics',
          total_questions: 10,
          correct_answers: 7 + i,
          accuracy_percentage: (7 + i) * 10,
          average_time_per_question: 120,
          strengths: JSON.stringify(['Mechanics']),
          weaknesses: JSON.stringify(['Thermodynamics']),
          calculated_at: new Date().toISOString(),
        });
      }

      const progressData = await calculateProgressData(db, userId);

      expect(progressData.userId).toBe(userId);
      expect(progressData.totalTests).toBe(2);
      expect(progressData.testHistory.length).toBe(2);
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate recommendations based on performance', async () => {
      const db = new MockD1Database() as any;
      const userId = 'user-1';
      const sessionId = 'session-1';

      db.addTestSession({
        id: sessionId,
        user_id: userId,
        test_type: 'full',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: 3600,
        total_questions: 10,
        configuration: JSON.stringify({
          subjects: ['physics'],
          questionsPerSubject: 10,
          timeLimit: 60,
          difficulty: 'mixed',
          randomizeQuestions: true,
        }),
      });

      // Add analytics with low performance
      db.addPerformanceAnalytics({
        id: 'analytics-1',
        user_id: userId,
        test_session_id: sessionId,
        subject: 'physics',
        total_questions: 10,
        correct_answers: 4,
        accuracy_percentage: 40,
        average_time_per_question: 120,
        strengths: JSON.stringify([]),
        weaknesses: JSON.stringify(['Mechanics', 'Thermodynamics']),
        calculated_at: new Date().toISOString(),
      });

      const recommendations = await generateRecommendations(db, userId);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      // Check that recommendations have proper structure
      for (const rec of recommendations) {
        expect(rec.type).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(Array.isArray(rec.actionItems)).toBe(true);
      }
    });
  });
});
