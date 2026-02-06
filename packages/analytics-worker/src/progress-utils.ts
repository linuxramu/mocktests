// Progress tracking and comparison utility functions
import {
  rowToTestSession,
  rowToPerformanceAnalytics,
  generateUUID,
  type TestSession,
  type PerformanceAnalytics,
} from '@eamcet-platform/shared';

/**
 * Progress data for a user across multiple tests
 */
export interface ProgressData {
  userId: string;
  totalTests: number;
  testHistory: TestHistoryItem[];
  overallProgress: OverallProgress;
  subjectProgress: SubjectProgress[];
  consistentWeakAreas: string[];
  improvementAreas: string[];
  calculatedAt: Date;
}

/**
 * Individual test history item
 */
export interface TestHistoryItem {
  testSessionId: string;
  testDate: Date;
  overallScore: number;
  accuracyPercentage: number;
  totalQuestions: number;
  correctAnswers: number;
  testType: string;
}

/**
 * Overall progress metrics
 */
export interface OverallProgress {
  averageScore: number;
  averageAccuracy: number;
  bestScore: number;
  worstScore: number;
  improvementRate: number; // Percentage improvement from first to last test
  consistencyScore: number; // 0-100, higher means more consistent
}

/**
 * Subject-specific progress
 */
export interface SubjectProgress {
  subject: string;
  averageAccuracy: number;
  trend: 'improving' | 'declining' | 'stable';
  testCount: number;
  recentPerformance: number[]; // Last 5 test accuracies
}

/**
 * Comparison data between multiple test sessions
 */
export interface ComparisonData {
  userId: string;
  testSessions: TestComparisonItem[];
  improvements: string[];
  declines: string[];
  insights: string[];
  calculatedAt: Date;
}

/**
 * Individual test comparison item
 */
export interface TestComparisonItem {
  testSessionId: string;
  testDate: Date;
  overallScore: number;
  accuracyPercentage: number;
  subjectScores: { subject: string; accuracy: number }[];
  timeManagement: number; // Average time per question
}

/**
 * Trend analysis data
 */
export interface TrendAnalysis {
  userId: string;
  overallTrend: 'improving' | 'declining' | 'stable';
  subjectTrends: {
    subject: string;
    trend: 'improving' | 'declining' | 'stable';
  }[];
  performancePrediction: PerformancePrediction;
  percentileRanking: number; // 0-100
  calculatedAt: Date;
}

/**
 * Performance prediction
 */
export interface PerformancePrediction {
  predictedScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  basedOnTests: number;
  projectedImprovement: number; // Percentage
}

/**
 * Recommendation for focused practice
 */
export interface Recommendation {
  type: 'subject' | 'topic' | 'time-management' | 'strategy';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}

/**
 * Calculate comprehensive progress data for a user
 */
export async function calculateProgressData(
  db: D1Database,
  userId: string
): Promise<ProgressData> {
  // Get all test sessions for the user
  const sessionsRows = await db
    .prepare(
      'SELECT * FROM test_sessions WHERE user_id = ? AND status = ? ORDER BY started_at ASC'
    )
    .bind(userId, 'completed')
    .all();

  const sessions = sessionsRows.results.map(rowToTestSession);

  // Get all performance analytics for the user
  const analyticsRows = await db
    .prepare('SELECT * FROM performance_analytics WHERE user_id = ?')
    .bind(userId)
    .all();

  const analytics = analyticsRows.results.map(rowToPerformanceAnalytics);

  // Build test history
  const testHistory: TestHistoryItem[] = [];
  for (const session of sessions) {
    const sessionAnalytics = analytics.filter(
      a => a.testSessionId === session.id
    );

    const totalQuestions = sessionAnalytics.reduce(
      (sum, a) => sum + a.totalQuestions,
      0
    );
    const correctAnswers = sessionAnalytics.reduce(
      (sum, a) => sum + a.correctAnswers,
      0
    );
    const accuracyPercentage =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    testHistory.push({
      testSessionId: session.id,
      testDate: session.startedAt,
      overallScore: correctAnswers,
      accuracyPercentage,
      totalQuestions,
      correctAnswers,
      testType: session.testType,
    });
  }

  // Calculate overall progress
  const overallProgress = calculateOverallProgress(testHistory);

  // Calculate subject-specific progress
  const subjectProgress = calculateSubjectProgress(analytics);

  // Identify consistent weak areas
  const consistentWeakAreas = identifyConsistentWeakAreas(analytics);

  // Identify improvement areas
  const improvementAreas = identifyImprovementAreas(analytics);

  return {
    userId,
    totalTests: sessions.length,
    testHistory,
    overallProgress,
    subjectProgress,
    consistentWeakAreas,
    improvementAreas,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate overall progress metrics
 */
function calculateOverallProgress(
  testHistory: TestHistoryItem[]
): OverallProgress {
  if (testHistory.length === 0) {
    return {
      averageScore: 0,
      averageAccuracy: 0,
      bestScore: 0,
      worstScore: 0,
      improvementRate: 0,
      consistencyScore: 0,
    };
  }

  const scores = testHistory.map(t => t.overallScore);
  const accuracies = testHistory.map(t => t.accuracyPercentage);

  const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const averageAccuracy =
    accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
  const bestScore = Math.max(...scores);
  const worstScore = Math.min(...scores);

  // Calculate improvement rate (first test to last test)
  const improvementRate =
    testHistory.length > 1
      ? ((testHistory[testHistory.length - 1].accuracyPercentage -
          testHistory[0].accuracyPercentage) /
          testHistory[0].accuracyPercentage) *
        100
      : 0;

  // Calculate consistency score (lower variance = higher consistency)
  const variance =
    accuracies.reduce((sum, a) => sum + Math.pow(a - averageAccuracy, 2), 0) /
    accuracies.length;
  const standardDeviation = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 100 - standardDeviation * 2);

  return {
    averageScore,
    averageAccuracy,
    bestScore,
    worstScore,
    improvementRate,
    consistencyScore,
  };
}

/**
 * Calculate subject-specific progress
 */
function calculateSubjectProgress(
  analytics: PerformanceAnalytics[]
): SubjectProgress[] {
  const subjects = ['physics', 'chemistry', 'mathematics'];
  const progress: SubjectProgress[] = [];

  for (const subject of subjects) {
    const subjectAnalytics = analytics
      .filter(a => a.subject === subject)
      .sort(
        (a, b) =>
          new Date(a.calculatedAt).getTime() -
          new Date(b.calculatedAt).getTime()
      );

    if (subjectAnalytics.length === 0) {
      continue;
    }

    const accuracies = subjectAnalytics.map(a => a.accuracyPercentage);
    const averageAccuracy =
      accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;

    // Determine trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (subjectAnalytics.length >= 3) {
      const recentAvg = accuracies.slice(-3).reduce((sum, a) => sum + a, 0) / 3;
      const olderAvg =
        accuracies.slice(0, -3).reduce((sum, a) => sum + a, 0) /
        Math.max(1, accuracies.length - 3);

      if (recentAvg > olderAvg + 5) {
        trend = 'improving';
      } else if (recentAvg < olderAvg - 5) {
        trend = 'declining';
      }
    }

    // Get recent performance (last 5 tests)
    const recentPerformance = accuracies.slice(-5);

    progress.push({
      subject,
      averageAccuracy,
      trend,
      testCount: subjectAnalytics.length,
      recentPerformance,
    });
  }

  return progress;
}

/**
 * Identify consistent weak areas across multiple tests
 */
function identifyConsistentWeakAreas(
  analytics: PerformanceAnalytics[]
): string[] {
  const weaknessMap = new Map<string, number>();

  for (const analytic of analytics) {
    for (const weakness of analytic.weaknesses) {
      weaknessMap.set(weakness, (weaknessMap.get(weakness) || 0) + 1);
    }
  }

  // Filter weaknesses that appear in at least 50% of tests
  const threshold = Math.ceil(analytics.length * 0.5);
  const consistentWeaknesses: string[] = [];

  for (const [weakness, count] of weaknessMap.entries()) {
    if (count >= threshold) {
      consistentWeaknesses.push(weakness);
    }
  }

  return consistentWeaknesses;
}

/**
 * Identify areas showing improvement
 */
function identifyImprovementAreas(analytics: PerformanceAnalytics[]): string[] {
  if (analytics.length < 2) {
    return [];
  }

  // Sort by date
  const sortedAnalytics = [...analytics].sort(
    (a, b) =>
      new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime()
  );

  const recentAnalytics = sortedAnalytics.slice(-3);
  const olderAnalytics = sortedAnalytics.slice(0, -3);

  const improvementAreas: string[] = [];

  // Check if former weaknesses are now strengths
  const olderWeaknesses = new Set(olderAnalytics.flatMap(a => a.weaknesses));
  const recentStrengths = new Set(recentAnalytics.flatMap(a => a.strengths));

  for (const weakness of olderWeaknesses) {
    if (recentStrengths.has(weakness)) {
      improvementAreas.push(weakness);
    }
  }

  return improvementAreas;
}

/**
 * Compare multiple test sessions
 */
export async function compareTestSessions(
  db: D1Database,
  userId: string,
  testSessionIds: string[]
): Promise<ComparisonData> {
  const testSessions: TestComparisonItem[] = [];

  for (const sessionId of testSessionIds) {
    // Get test session
    const sessionRow = await db
      .prepare('SELECT * FROM test_sessions WHERE id = ? AND user_id = ?')
      .bind(sessionId, userId)
      .first();

    if (!sessionRow) {
      continue;
    }

    const session = rowToTestSession(sessionRow);

    // Get analytics for this session
    const analyticsRows = await db
      .prepare('SELECT * FROM performance_analytics WHERE test_session_id = ?')
      .bind(sessionId)
      .all();

    const analytics = analyticsRows.results.map(rowToPerformanceAnalytics);

    const totalQuestions = analytics.reduce(
      (sum, a) => sum + a.totalQuestions,
      0
    );
    const correctAnswers = analytics.reduce(
      (sum, a) => sum + a.correctAnswers,
      0
    );
    const accuracyPercentage =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    const subjectScores = analytics.map(a => ({
      subject: a.subject,
      accuracy: a.accuracyPercentage,
    }));

    const timeManagement =
      analytics.reduce((sum, a) => sum + a.averageTimePerQuestion, 0) /
      Math.max(1, analytics.length);

    testSessions.push({
      testSessionId: sessionId,
      testDate: session.startedAt,
      overallScore: correctAnswers,
      accuracyPercentage,
      subjectScores,
      timeManagement,
    });
  }

  // Sort by date
  testSessions.sort((a, b) => a.testDate.getTime() - b.testDate.getTime());

  // Identify improvements and declines
  const improvements: string[] = [];
  const declines: string[] = [];

  if (testSessions.length >= 2) {
    const first = testSessions[0];
    const last = testSessions[testSessions.length - 1];

    // Overall comparison
    if (last.accuracyPercentage > first.accuracyPercentage + 5) {
      improvements.push(
        `Overall accuracy improved by ${(last.accuracyPercentage - first.accuracyPercentage).toFixed(1)}%`
      );
    } else if (last.accuracyPercentage < first.accuracyPercentage - 5) {
      declines.push(
        `Overall accuracy declined by ${(first.accuracyPercentage - last.accuracyPercentage).toFixed(1)}%`
      );
    }

    // Subject-wise comparison
    for (const subject of ['physics', 'chemistry', 'mathematics']) {
      const firstSubject = first.subjectScores.find(s => s.subject === subject);
      const lastSubject = last.subjectScores.find(s => s.subject === subject);

      if (firstSubject && lastSubject) {
        if (lastSubject.accuracy > firstSubject.accuracy + 5) {
          improvements.push(
            `${subject.charAt(0).toUpperCase() + subject.slice(1)} improved by ${(lastSubject.accuracy - firstSubject.accuracy).toFixed(1)}%`
          );
        } else if (lastSubject.accuracy < firstSubject.accuracy - 5) {
          declines.push(
            `${subject.charAt(0).toUpperCase() + subject.slice(1)} declined by ${(firstSubject.accuracy - lastSubject.accuracy).toFixed(1)}%`
          );
        }
      }
    }

    // Time management comparison
    if (last.timeManagement < first.timeManagement * 0.9) {
      improvements.push('Time management improved - answering faster');
    } else if (last.timeManagement > first.timeManagement * 1.1) {
      declines.push('Time management declined - taking longer per question');
    }
  }

  // Generate insights
  const insights = generateComparisonInsights(testSessions);

  return {
    userId,
    testSessions,
    improvements,
    declines,
    insights,
    calculatedAt: new Date(),
  };
}

/**
 * Generate insights from test comparison
 */
function generateComparisonInsights(
  testSessions: TestComparisonItem[]
): string[] {
  const insights: string[] = [];

  if (testSessions.length < 2) {
    return ['Need more tests for meaningful comparison'];
  }

  // Check for consistency
  const accuracies = testSessions.map(t => t.accuracyPercentage);
  const variance =
    accuracies.reduce(
      (sum, a) =>
        sum +
        Math.pow(
          a - accuracies.reduce((s, x) => s + x, 0) / accuracies.length,
          2
        ),
      0
    ) / accuracies.length;

  if (variance < 25) {
    insights.push('Performance is consistent across tests');
  } else {
    insights.push('Performance varies significantly - focus on consistency');
  }

  // Check for upward trend
  const firstHalf = accuracies.slice(0, Math.ceil(accuracies.length / 2));
  const secondHalf = accuracies.slice(Math.ceil(accuracies.length / 2));

  const firstAvg = firstHalf.reduce((s, a) => s + a, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, a) => s + a, 0) / secondHalf.length;

  if (secondAvg > firstAvg + 5) {
    insights.push('Clear upward trend - keep up the good work!');
  } else if (secondAvg < firstAvg - 5) {
    insights.push('Recent performance declining - review study strategy');
  }

  return insights;
}

/**
 * Calculate trend analysis for a user
 */
export async function calculateTrends(
  db: D1Database,
  userId: string
): Promise<TrendAnalysis> {
  const progressData = await calculateProgressData(db, userId);

  // Determine overall trend
  let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (progressData.overallProgress.improvementRate > 10) {
    overallTrend = 'improving';
  } else if (progressData.overallProgress.improvementRate < -10) {
    overallTrend = 'declining';
  }

  // Subject trends
  const subjectTrends = progressData.subjectProgress.map(sp => ({
    subject: sp.subject,
    trend: sp.trend,
  }));

  // Performance prediction
  const performancePrediction = predictPerformance(progressData);

  // Calculate percentile ranking (simplified - would need all users' data in production)
  const percentileRanking = calculatePercentileRanking(
    progressData.overallProgress.averageAccuracy
  );

  return {
    userId,
    overallTrend,
    subjectTrends,
    performancePrediction,
    percentileRanking,
    calculatedAt: new Date(),
  };
}

/**
 * Predict future performance based on historical data
 */
function predictPerformance(progressData: ProgressData): PerformancePrediction {
  if (progressData.totalTests < 3) {
    return {
      predictedScore: progressData.overallProgress.averageScore,
      confidenceLevel: 'low',
      basedOnTests: progressData.totalTests,
      projectedImprovement: 0,
    };
  }

  // Use linear regression on recent tests
  const recentTests = progressData.testHistory.slice(-5);
  const n = recentTests.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = recentTests[i].accuracyPercentage;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next test
  const predictedAccuracy = slope * n + intercept;
  const predictedScore = Math.round(
    (predictedAccuracy / 100) * progressData.testHistory[0].totalQuestions
  );

  // Calculate confidence based on consistency
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  if (progressData.overallProgress.consistencyScore > 80) {
    confidenceLevel = 'high';
  } else if (progressData.overallProgress.consistencyScore < 50) {
    confidenceLevel = 'low';
  }

  const currentAvg = progressData.overallProgress.averageAccuracy;
  const projectedImprovement =
    currentAvg > 0 ? ((predictedAccuracy - currentAvg) / currentAvg) * 100 : 0;

  return {
    predictedScore,
    confidenceLevel,
    basedOnTests: n,
    projectedImprovement,
  };
}

/**
 * Calculate percentile ranking (simplified)
 */
function calculatePercentileRanking(averageAccuracy: number): number {
  // Simplified percentile calculation
  // In production, this would compare against all users
  if (averageAccuracy >= 90) return 95;
  if (averageAccuracy >= 80) return 85;
  if (averageAccuracy >= 70) return 70;
  if (averageAccuracy >= 60) return 55;
  if (averageAccuracy >= 50) return 40;
  return 25;
}

/**
 * Generate personalized recommendations based on performance patterns
 */
export async function generateRecommendations(
  db: D1Database,
  userId: string
): Promise<Recommendation[]> {
  const progressData = await calculateProgressData(db, userId);
  const recommendations: Recommendation[] = [];

  // Recommend based on consistent weak areas
  if (progressData.consistentWeakAreas.length > 0) {
    recommendations.push({
      type: 'topic',
      priority: 'high',
      title: 'Focus on Consistent Weak Areas',
      description: `You've consistently struggled with: ${progressData.consistentWeakAreas.join(', ')}`,
      actionItems: [
        'Review fundamental concepts in these topics',
        'Practice 10-15 questions daily on these topics',
        'Watch tutorial videos or read study materials',
        'Take topic-specific practice tests',
      ],
    });
  }

  // Recommend based on subject performance
  for (const subject of progressData.subjectProgress) {
    if (subject.averageAccuracy < 60) {
      recommendations.push({
        type: 'subject',
        priority: 'high',
        title: `Improve ${subject.subject.charAt(0).toUpperCase() + subject.subject.slice(1)} Performance`,
        description: `Your average accuracy in ${subject.subject} is ${subject.averageAccuracy.toFixed(1)}%`,
        actionItems: [
          `Dedicate 30-45 minutes daily to ${subject.subject}`,
          'Focus on understanding concepts rather than memorization',
          'Solve previous year questions',
          'Identify and practice weak topics',
        ],
      });
    } else if (subject.trend === 'declining') {
      recommendations.push({
        type: 'subject',
        priority: 'medium',
        title: `Maintain ${subject.subject.charAt(0).toUpperCase() + subject.subject.slice(1)} Performance`,
        description: `Your ${subject.subject} performance is declining`,
        actionItems: [
          'Review recent mistakes and understand why',
          'Revisit fundamental concepts',
          'Take regular practice tests',
        ],
      });
    }
  }

  // Time management recommendations
  const recentTests = progressData.testHistory.slice(-3);
  if (recentTests.length > 0) {
    const avgAccuracy =
      recentTests.reduce((sum, t) => sum + t.accuracyPercentage, 0) /
      recentTests.length;

    if (avgAccuracy < 70) {
      recommendations.push({
        type: 'strategy',
        priority: 'medium',
        title: 'Improve Test-Taking Strategy',
        description:
          'Your recent test performance suggests room for improvement',
        actionItems: [
          'Attempt easier questions first to build confidence',
          'Skip difficult questions and return later',
          'Practice time-bound mock tests regularly',
          'Review all questions after each test',
        ],
      });
    }
  }

  // Consistency recommendations
  if (progressData.overallProgress.consistencyScore < 60) {
    recommendations.push({
      type: 'strategy',
      priority: 'medium',
      title: 'Improve Consistency',
      description: 'Your performance varies significantly between tests',
      actionItems: [
        'Maintain a regular study schedule',
        'Take tests at the same time of day',
        'Ensure adequate rest before tests',
        'Practice stress management techniques',
      ],
    });
  }

  // Celebrate improvements
  if (progressData.improvementAreas.length > 0) {
    recommendations.push({
      type: 'topic',
      priority: 'low',
      title: 'Great Progress!',
      description: `You've improved in: ${progressData.improvementAreas.join(', ')}`,
      actionItems: [
        'Continue your current study approach for these topics',
        'Help others or teach these concepts to reinforce learning',
        'Apply similar strategies to other weak areas',
      ],
    });
  }

  return recommendations;
}
