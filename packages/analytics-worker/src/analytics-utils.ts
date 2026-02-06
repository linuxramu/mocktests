// Analytics utility functions for performance metrics calculation
import {
  generateUUID,
  rowToTestSession,
  rowToUserAnswer,
  rowToQuestion,
  rowToPerformanceAnalytics,
  performanceAnalyticsToRow,
  type TestSession,
  type UserAnswer,
  type Question,
  type PerformanceAnalytics,
} from '@eamcet-platform/shared';

/**
 * Performance metrics for a completed test
 */
export interface PerformanceMetrics {
  userId: string;
  testSessionId: string;
  overallScore: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracyPercentage: number;
  averageTimePerQuestion: number;
  totalTimeSpent: number;
  subjectWiseAnalysis: SubjectAnalysis[];
  timeManagementAnalysis: TimeManagementAnalysis;
  thinkingAbilityAssessment: ThinkingAbilityAssessment;
  calculatedAt: Date;
}

/**
 * Subject-wise performance analysis
 */
export interface SubjectAnalysis {
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  averageTimePerQuestion: number;
  strengths: string[];
  weaknesses: string[];
  topicBreakdown: TopicPerformance[];
}

/**
 * Topic-level performance
 */
export interface TopicPerformance {
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

/**
 * Time management pattern analysis
 */
export interface TimeManagementAnalysis {
  fastQuestions: number; // < 60 seconds
  normalQuestions: number; // 60-120 seconds
  slowQuestions: number; // > 120 seconds
  timeDistribution: {
    physics: number;
    chemistry: number;
    mathematics: number;
  };
  suggestions: string[];
}

/**
 * Thinking ability assessment
 */
export interface ThinkingAbilityAssessment {
  quickCorrectAnswers: number; // Correct answers in < 60 seconds
  thoughtfulCorrectAnswers: number; // Correct answers in 60-120 seconds
  slowCorrectAnswers: number; // Correct answers in > 120 seconds
  impulsiveErrors: number; // Wrong answers in < 30 seconds
  confusionErrors: number; // Wrong answers after > 120 seconds
  confidenceScore: number; // 0-100
  insights: string[];
}

/**
 * Calculate comprehensive performance metrics for a completed test
 */
export async function calculatePerformanceMetrics(
  db: D1Database,
  sessionId: string
): Promise<PerformanceMetrics> {
  // Get test session
  const sessionRow = await db
    .prepare('SELECT * FROM test_sessions WHERE id = ?')
    .bind(sessionId)
    .first();

  if (!sessionRow) {
    throw new Error('Test session not found');
  }

  const session = rowToTestSession(sessionRow);

  // Get all answers for the session
  const answersRows = await db
    .prepare('SELECT * FROM user_answers WHERE test_session_id = ?')
    .bind(sessionId)
    .all();

  const answers = answersRows.results.map(rowToUserAnswer);

  // Get all questions for the session
  const questionsRows = await db
    .prepare(
      `SELECT q.* FROM questions q
       INNER JOIN test_questions tq ON q.id = tq.question_id
       WHERE tq.test_session_id = ?`
    )
    .bind(sessionId)
    .all();

  const questions = questionsRows.results.map(rowToQuestion);

  // Calculate basic metrics
  const totalQuestions = questions.length;
  const answeredQuestions = answers.filter(a => a.selectedAnswer).length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = answeredQuestions - correctAnswers;
  const unansweredQuestions = totalQuestions - answeredQuestions;
  const accuracyPercentage =
    answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0;

  // Calculate time metrics
  const totalTimeSpent = answers.reduce(
    (sum, a) => sum + a.timeSpentSeconds,
    0
  );
  const averageTimePerQuestion =
    answeredQuestions > 0 ? totalTimeSpent / answeredQuestions : 0;

  // Calculate subject-wise analysis
  const subjectWiseAnalysis = calculateSubjectWiseAnalysis(questions, answers);

  // Calculate time management analysis
  const timeManagementAnalysis = calculateTimeManagementAnalysis(
    questions,
    answers
  );

  // Calculate thinking ability assessment
  const thinkingAbilityAssessment = calculateThinkingAbilityAssessment(answers);

  return {
    userId: session.userId,
    testSessionId: sessionId,
    overallScore: correctAnswers,
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    unansweredQuestions,
    accuracyPercentage,
    averageTimePerQuestion,
    totalTimeSpent,
    subjectWiseAnalysis,
    timeManagementAnalysis,
    thinkingAbilityAssessment,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate subject-wise performance analysis
 */
function calculateSubjectWiseAnalysis(
  questions: Question[],
  answers: UserAnswer[]
): SubjectAnalysis[] {
  const subjects = ['physics', 'chemistry', 'mathematics'];
  const analysis: SubjectAnalysis[] = [];

  for (const subject of subjects) {
    const subjectQuestions = questions.filter(q => q.subject === subject);
    const subjectAnswers = answers.filter(a =>
      subjectQuestions.some(q => q.id === a.questionId)
    );

    const totalQuestions = subjectQuestions.length;
    const answeredQuestions = subjectAnswers.filter(
      a => a.selectedAnswer
    ).length;
    const correctAnswers = subjectAnswers.filter(a => a.isCorrect).length;
    const accuracyPercentage =
      answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0;

    const totalTime = subjectAnswers.reduce(
      (sum, a) => sum + a.timeSpentSeconds,
      0
    );
    const averageTimePerQuestion =
      answeredQuestions > 0 ? totalTime / answeredQuestions : 0;

    // Calculate topic breakdown
    const topicBreakdown = calculateTopicBreakdown(
      subjectQuestions,
      subjectAnswers
    );

    // Identify strengths and weaknesses
    const { strengths, weaknesses } = identifyStrengthsAndWeaknesses(
      topicBreakdown,
      accuracyPercentage
    );

    analysis.push({
      subject,
      totalQuestions,
      correctAnswers,
      accuracyPercentage,
      averageTimePerQuestion,
      strengths,
      weaknesses,
      topicBreakdown,
    });
  }

  return analysis;
}

/**
 * Calculate topic-level performance breakdown
 */
function calculateTopicBreakdown(
  questions: Question[],
  answers: UserAnswer[]
): TopicPerformance[] {
  const topicMap = new Map<string, { total: number; correct: number }>();

  for (const question of questions) {
    const topic = question.metadata.topic;
    if (!topicMap.has(topic)) {
      topicMap.set(topic, { total: 0, correct: 0 });
    }

    const stats = topicMap.get(topic)!;
    stats.total++;

    const answer = answers.find(a => a.questionId === question.id);
    if (answer?.isCorrect) {
      stats.correct++;
    }
  }

  const breakdown: TopicPerformance[] = [];
  for (const [topic, stats] of topicMap.entries()) {
    breakdown.push({
      topic,
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
      accuracyPercentage:
        stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    });
  }

  return breakdown;
}

/**
 * Identify strengths and weaknesses based on topic performance
 */
function identifyStrengthsAndWeaknesses(
  topicBreakdown: TopicPerformance[],
  overallAccuracy: number
): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const topic of topicBreakdown) {
    if (topic.accuracyPercentage >= 80) {
      strengths.push(topic.topic);
    } else if (topic.accuracyPercentage < 50) {
      weaknesses.push(topic.topic);
    }
  }

  // If no specific strengths/weaknesses, provide general feedback
  if (strengths.length === 0 && overallAccuracy >= 70) {
    strengths.push('Consistent performance across topics');
  }

  if (weaknesses.length === 0 && overallAccuracy < 50) {
    weaknesses.push('Needs improvement across all topics');
  }

  return { strengths, weaknesses };
}

/**
 * Calculate time management pattern analysis
 */
function calculateTimeManagementAnalysis(
  questions: Question[],
  answers: UserAnswer[]
): TimeManagementAnalysis {
  let fastQuestions = 0;
  let normalQuestions = 0;
  let slowQuestions = 0;

  const timeDistribution = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
  };

  for (const answer of answers) {
    if (!answer.selectedAnswer) continue;

    const timeSpent = answer.timeSpentSeconds;

    // Categorize by speed
    if (timeSpent < 60) {
      fastQuestions++;
    } else if (timeSpent <= 120) {
      normalQuestions++;
    } else {
      slowQuestions++;
    }

    // Track time by subject
    const question = questions.find(q => q.id === answer.questionId);
    if (question) {
      timeDistribution[question.subject] += timeSpent;
    }
  }

  // Generate suggestions
  const suggestions: string[] = [];

  if (slowQuestions > answers.length * 0.3) {
    suggestions.push(
      'Consider practicing time management - too many questions taking over 2 minutes'
    );
  }

  if (fastQuestions > answers.length * 0.5) {
    const fastCorrect = answers.filter(
      a => a.timeSpentSeconds < 60 && a.isCorrect
    ).length;
    const fastAccuracy = fastQuestions > 0 ? fastCorrect / fastQuestions : 0;

    if (fastAccuracy < 0.7) {
      suggestions.push(
        'Slow down and read questions carefully - rushing may lead to errors'
      );
    }
  }

  const totalTime = Object.values(timeDistribution).reduce(
    (sum, t) => sum + t,
    0
  );
  for (const [subject, time] of Object.entries(timeDistribution)) {
    const percentage = totalTime > 0 ? (time / totalTime) * 100 : 0;
    if (percentage > 40) {
      suggestions.push(
        `${subject.charAt(0).toUpperCase() + subject.slice(1)} is taking ${percentage.toFixed(0)}% of your time - consider practicing for speed`
      );
    }
  }

  return {
    fastQuestions,
    normalQuestions,
    slowQuestions,
    timeDistribution,
    suggestions,
  };
}

/**
 * Calculate thinking ability assessment through answer patterns
 */
function calculateThinkingAbilityAssessment(
  answers: UserAnswer[]
): ThinkingAbilityAssessment {
  let quickCorrectAnswers = 0;
  let thoughtfulCorrectAnswers = 0;
  let slowCorrectAnswers = 0;
  let impulsiveErrors = 0;
  let confusionErrors = 0;

  for (const answer of answers) {
    if (!answer.selectedAnswer) continue;

    const timeSpent = answer.timeSpentSeconds;

    if (answer.isCorrect) {
      if (timeSpent < 60) {
        quickCorrectAnswers++;
      } else if (timeSpent <= 120) {
        thoughtfulCorrectAnswers++;
      } else {
        slowCorrectAnswers++;
      }
    } else {
      if (timeSpent < 30) {
        impulsiveErrors++;
      } else if (timeSpent > 120) {
        confusionErrors++;
      }
    }
  }

  // Calculate confidence score (0-100)
  const totalAnswered = answers.filter(a => a.selectedAnswer).length;
  const totalCorrect =
    quickCorrectAnswers + thoughtfulCorrectAnswers + slowCorrectAnswers;
  const baseAccuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;

  // Adjust confidence based on answer patterns
  let confidenceScore = baseAccuracy * 100;

  // Penalize impulsive errors
  if (impulsiveErrors > totalAnswered * 0.2) {
    confidenceScore -= 10;
  }

  // Penalize confusion errors
  if (confusionErrors > totalAnswered * 0.15) {
    confidenceScore -= 15;
  }

  // Reward quick correct answers
  if (quickCorrectAnswers > totalAnswered * 0.3) {
    confidenceScore += 5;
  }

  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  // Generate insights
  const insights: string[] = [];

  if (quickCorrectAnswers > totalAnswered * 0.4) {
    insights.push('Strong conceptual clarity - able to answer quickly');
  }

  if (thoughtfulCorrectAnswers > totalAnswered * 0.5) {
    insights.push('Good analytical thinking - taking appropriate time');
  }

  if (impulsiveErrors > totalAnswered * 0.2) {
    insights.push(
      'Reduce impulsive answering - take time to read questions carefully'
    );
  }

  if (confusionErrors > totalAnswered * 0.15) {
    insights.push(
      'Some conceptual gaps - review topics where you spent more time but got wrong'
    );
  }

  if (slowCorrectAnswers > totalAnswered * 0.3) {
    insights.push(
      'Practice for speed - you understand concepts but need to improve efficiency'
    );
  }

  return {
    quickCorrectAnswers,
    thoughtfulCorrectAnswers,
    slowCorrectAnswers,
    impulsiveErrors,
    confusionErrors,
    confidenceScore,
    insights,
  };
}

/**
 * Store performance analytics in database
 */
export async function storePerformanceAnalytics(
  db: D1Database,
  metrics: PerformanceMetrics
): Promise<void> {
  // Store overall analytics
  for (const subjectAnalysis of metrics.subjectWiseAnalysis) {
    const analytics: PerformanceAnalytics = {
      id: generateUUID(),
      userId: metrics.userId,
      testSessionId: metrics.testSessionId,
      subject: subjectAnalysis.subject,
      totalQuestions: subjectAnalysis.totalQuestions,
      correctAnswers: subjectAnalysis.correctAnswers,
      accuracyPercentage: subjectAnalysis.accuracyPercentage,
      averageTimePerQuestion: subjectAnalysis.averageTimePerQuestion,
      strengths: subjectAnalysis.strengths,
      weaknesses: subjectAnalysis.weaknesses,
      calculatedAt: metrics.calculatedAt,
    };

    const row = performanceAnalyticsToRow(analytics);

    await db
      .prepare(
        `INSERT INTO performance_analytics (id, user_id, test_session_id, subject, total_questions, correct_answers, accuracy_percentage, average_time_per_question, strengths, weaknesses, calculated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        row.id,
        row.user_id,
        row.test_session_id,
        row.subject,
        row.total_questions,
        row.correct_answers,
        row.accuracy_percentage,
        row.average_time_per_question,
        row.strengths,
        row.weaknesses,
        row.calculated_at
      )
      .run();
  }
}

/**
 * Get performance analytics for a user
 */
export async function getUserPerformanceAnalytics(
  db: D1Database,
  userId: string
): Promise<PerformanceAnalytics[]> {
  const rows = await db
    .prepare('SELECT * FROM performance_analytics WHERE user_id = ?')
    .bind(userId)
    .all();

  return rows.results.map(rowToPerformanceAnalytics);
}

/**
 * Get subject-wise breakdown for a user
 */
export async function getSubjectWiseBreakdown(
  db: D1Database,
  userId: string
): Promise<SubjectAnalysis[]> {
  const analytics = await getUserPerformanceAnalytics(db, userId);

  const subjectMap = new Map<string, SubjectAnalysis>();

  for (const analytic of analytics) {
    if (!subjectMap.has(analytic.subject)) {
      subjectMap.set(analytic.subject, {
        subject: analytic.subject,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracyPercentage: 0,
        averageTimePerQuestion: 0,
        strengths: [],
        weaknesses: [],
        topicBreakdown: [],
      });
    }

    const subject = subjectMap.get(analytic.subject)!;
    subject.totalQuestions += analytic.totalQuestions;
    subject.correctAnswers += analytic.correctAnswers;

    // Merge strengths and weaknesses
    subject.strengths = [
      ...new Set([...subject.strengths, ...analytic.strengths]),
    ];
    subject.weaknesses = [
      ...new Set([...subject.weaknesses, ...analytic.weaknesses]),
    ];
  }

  // Calculate averages
  for (const subject of subjectMap.values()) {
    subject.accuracyPercentage =
      subject.totalQuestions > 0
        ? (subject.correctAnswers / subject.totalQuestions) * 100
        : 0;
  }

  return Array.from(subjectMap.values());
}
