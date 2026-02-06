import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './PerformanceDashboard.css';

interface PerformanceMetrics {
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

interface SubjectAnalysis {
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  averageTimePerQuestion: number;
  strengths: string[];
  weaknesses: string[];
}

interface TimeManagementAnalysis {
  fastQuestions: number;
  normalQuestions: number;
  slowQuestions: number;
  timeDistribution: {
    physics: number;
    chemistry: number;
    mathematics: number;
  };
  suggestions: string[];
}

interface ThinkingAbilityAssessment {
  quickCorrectAnswers: number;
  thoughtfulCorrectAnswers: number;
  slowCorrectAnswers: number;
  impulsiveErrors: number;
  confusionErrors: number;
  confidenceScore: number;
  insights: string[];
}

export const PerformanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_ANALYTICS_API_URL}/analytics/performance/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch performance metrics');
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  if (loading) {
    return (
      <div className="performance-dashboard loading">Loading metrics...</div>
    );
  }

  if (error) {
    return <div className="performance-dashboard error">Error: {error}</div>;
  }

  if (!metrics) {
    return (
      <div className="performance-dashboard empty">
        No performance data available
      </div>
    );
  }

  return (
    <div className="performance-dashboard">
      <h2>Performance Dashboard</h2>

      <div className="metrics-overview">
        <div className="metric-card">
          <h3>Overall Score</h3>
          <div className="metric-value">
            {metrics.overallScore}/{metrics.totalQuestions}
          </div>
          <div className="metric-label">Correct Answers</div>
        </div>

        <div className="metric-card">
          <h3>Accuracy</h3>
          <div className="metric-value">
            {metrics.accuracyPercentage.toFixed(1)}%
          </div>
          <div className="metric-label">Overall Accuracy</div>
        </div>

        <div className="metric-card">
          <h3>Avg Time</h3>
          <div className="metric-value">
            {Math.round(metrics.averageTimePerQuestion)}s
          </div>
          <div className="metric-label">Per Question</div>
        </div>

        <div className="metric-card">
          <h3>Confidence</h3>
          <div className="metric-value">
            {Math.round(metrics.thinkingAbilityAssessment.confidenceScore)}
          </div>
          <div className="metric-label">Score (0-100)</div>
        </div>
      </div>

      <div className="subject-analysis-section">
        <h3>Subject-wise Performance</h3>
        <div className="subject-cards">
          {metrics.subjectWiseAnalysis.map(subject => (
            <div key={subject.subject} className="subject-card">
              <h4>
                {subject.subject.charAt(0).toUpperCase() +
                  subject.subject.slice(1)}
              </h4>
              <div className="subject-stats">
                <div className="stat">
                  <span className="stat-label">Accuracy:</span>
                  <span className="stat-value">
                    {subject.accuracyPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Correct:</span>
                  <span className="stat-value">
                    {subject.correctAnswers}/{subject.totalQuestions}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Avg Time:</span>
                  <span className="stat-value">
                    {Math.round(subject.averageTimePerQuestion)}s
                  </span>
                </div>
              </div>
              {subject.strengths.length > 0 && (
                <div className="subject-strengths">
                  <strong>Strengths:</strong>
                  <ul>
                    {subject.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              {subject.weaknesses.length > 0 && (
                <div className="subject-weaknesses">
                  <strong>Weaknesses:</strong>
                  <ul>
                    {subject.weaknesses.map((weakness, idx) => (
                      <li key={idx}>{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="time-management-section">
        <h3>Time Management Analysis</h3>
        <div className="time-stats">
          <div className="time-stat">
            <span className="time-label">Fast (&lt;60s):</span>
            <span className="time-value">
              {metrics.timeManagementAnalysis.fastQuestions}
            </span>
          </div>
          <div className="time-stat">
            <span className="time-label">Normal (60-120s):</span>
            <span className="time-value">
              {metrics.timeManagementAnalysis.normalQuestions}
            </span>
          </div>
          <div className="time-stat">
            <span className="time-label">Slow (&gt;120s):</span>
            <span className="time-value">
              {metrics.timeManagementAnalysis.slowQuestions}
            </span>
          </div>
        </div>
        {metrics.timeManagementAnalysis.suggestions.length > 0 && (
          <div className="time-suggestions">
            <h4>Suggestions:</h4>
            <ul>
              {metrics.timeManagementAnalysis.suggestions.map(
                (suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="thinking-ability-section">
        <h3>Thinking Ability Assessment</h3>
        <div className="thinking-stats">
          <div className="thinking-stat">
            <span className="thinking-label">Quick Correct:</span>
            <span className="thinking-value">
              {metrics.thinkingAbilityAssessment.quickCorrectAnswers}
            </span>
          </div>
          <div className="thinking-stat">
            <span className="thinking-label">Thoughtful Correct:</span>
            <span className="thinking-value">
              {metrics.thinkingAbilityAssessment.thoughtfulCorrectAnswers}
            </span>
          </div>
          <div className="thinking-stat">
            <span className="thinking-label">Impulsive Errors:</span>
            <span className="thinking-value">
              {metrics.thinkingAbilityAssessment.impulsiveErrors}
            </span>
          </div>
          <div className="thinking-stat">
            <span className="thinking-label">Confusion Errors:</span>
            <span className="thinking-value">
              {metrics.thinkingAbilityAssessment.confusionErrors}
            </span>
          </div>
        </div>
        {metrics.thinkingAbilityAssessment.insights.length > 0 && (
          <div className="thinking-insights">
            <h4>Insights:</h4>
            <ul>
              {metrics.thinkingAbilityAssessment.insights.map(
                (insight, idx) => (
                  <li key={idx}>{insight}</li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
