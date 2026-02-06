import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ProgressTracker.css';

interface ProgressData {
  userId: string;
  totalTests: number;
  testHistory: TestHistoryItem[];
  overallProgress: OverallProgress;
  subjectProgress: SubjectProgress[];
  consistentWeakAreas: string[];
  improvementAreas: string[];
  calculatedAt: Date;
}

interface TestHistoryItem {
  testSessionId: string;
  testDate: Date;
  overallScore: number;
  accuracyPercentage: number;
  totalQuestions: number;
  correctAnswers: number;
  testType: string;
}

interface OverallProgress {
  averageScore: number;
  averageAccuracy: number;
  bestScore: number;
  worstScore: number;
  improvementRate: number;
  consistencyScore: number;
}

interface SubjectProgress {
  subject: string;
  averageAccuracy: number;
  trend: 'improving' | 'declining' | 'stable';
  testCount: number;
  recentPerformance: number[];
}

export const ProgressTracker: React.FC = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_ANALYTICS_API_URL}/analytics/progress/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch progress data');
        }

        const data = await response.json();
        setProgressData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  if (loading) {
    return (
      <div className="progress-tracker loading">Loading progress data...</div>
    );
  }

  if (error) {
    return <div className="progress-tracker error">Error: {error}</div>;
  }

  if (!progressData || progressData.totalTests === 0) {
    return (
      <div className="progress-tracker empty">
        No progress data available. Take some tests to see your progress!
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendClass = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'trend-improving';
      case 'declining':
        return 'trend-declining';
      default:
        return 'trend-stable';
    }
  };

  return (
    <div className="progress-tracker">
      <h2>Progress Tracker</h2>

      <div className="overall-progress">
        <h3>Overall Progress</h3>
        <div className="progress-stats">
          <div className="progress-stat">
            <span className="stat-label">Total Tests:</span>
            <span className="stat-value">{progressData.totalTests}</span>
          </div>
          <div className="progress-stat">
            <span className="stat-label">Average Score:</span>
            <span className="stat-value">
              {Math.round(progressData.overallProgress.averageScore)}
            </span>
          </div>
          <div className="progress-stat">
            <span className="stat-label">Average Accuracy:</span>
            <span className="stat-value">
              {progressData.overallProgress.averageAccuracy.toFixed(1)}%
            </span>
          </div>
          <div className="progress-stat">
            <span className="stat-label">Best Score:</span>
            <span className="stat-value">
              {progressData.overallProgress.bestScore}
            </span>
          </div>
          <div className="progress-stat">
            <span className="stat-label">Improvement Rate:</span>
            <span
              className={`stat-value ${progressData.overallProgress.improvementRate >= 0 ? 'positive' : 'negative'}`}
            >
              {progressData.overallProgress.improvementRate >= 0 ? '+' : ''}
              {progressData.overallProgress.improvementRate.toFixed(1)}%
            </span>
          </div>
          <div className="progress-stat">
            <span className="stat-label">Consistency:</span>
            <span className="stat-value">
              {Math.round(progressData.overallProgress.consistencyScore)}/100
            </span>
          </div>
        </div>
      </div>

      <div className="subject-progress-section">
        <h3>Subject-wise Progress</h3>
        <div className="subject-progress-cards">
          {progressData.subjectProgress.map(subject => (
            <div key={subject.subject} className="subject-progress-card">
              <div className="subject-progress-header">
                <h4>
                  {subject.subject.charAt(0).toUpperCase() +
                    subject.subject.slice(1)}
                </h4>
                <span className={`trend-badge ${getTrendClass(subject.trend)}`}>
                  {getTrendIcon(subject.trend)} {subject.trend}
                </span>
              </div>
              <div className="subject-progress-stats">
                <div className="progress-item">
                  <span className="item-label">Average Accuracy:</span>
                  <span className="item-value">
                    {subject.averageAccuracy.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-item">
                  <span className="item-label">Tests Taken:</span>
                  <span className="item-value">{subject.testCount}</span>
                </div>
              </div>
              {subject.recentPerformance.length > 0 && (
                <div className="recent-performance">
                  <span className="recent-label">Recent Performance:</span>
                  <div className="performance-bars">
                    {subject.recentPerformance.map((perf, idx) => (
                      <div key={idx} className="performance-bar-container">
                        <div
                          className="performance-bar"
                          style={{ height: `${perf}%` }}
                          title={`${perf.toFixed(1)}%`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {progressData.testHistory.length > 0 && (
        <div className="test-history-section">
          <h3>Test History</h3>
          <div className="test-history-list">
            {progressData.testHistory
              .slice(-10)
              .reverse()
              .map(test => (
                <div key={test.testSessionId} className="test-history-item">
                  <div className="test-date">
                    {new Date(test.testDate).toLocaleDateString()}
                  </div>
                  <div className="test-type">{test.testType}</div>
                  <div className="test-score">
                    {test.correctAnswers}/{test.totalQuestions}
                  </div>
                  <div className="test-accuracy">
                    {test.accuracyPercentage.toFixed(1)}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {progressData.improvementAreas.length > 0 && (
        <div className="improvement-areas">
          <h3>🎉 Areas of Improvement</h3>
          <ul>
            {progressData.improvementAreas.map((area, idx) => (
              <li key={idx} className="improvement-item">
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {progressData.consistentWeakAreas.length > 0 && (
        <div className="weak-areas">
          <h3>⚠️ Areas Needing Attention</h3>
          <ul>
            {progressData.consistentWeakAreas.map((area, idx) => (
              <li key={idx} className="weak-item">
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
