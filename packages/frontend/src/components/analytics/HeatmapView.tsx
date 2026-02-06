import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './HeatmapView.css';

interface TimeManagementData {
  userId: string;
  testSessionId: string;
  questionTimings: QuestionTiming[];
  subjectTimings: SubjectTiming[];
  timeDistribution: TimeDistribution;
}

interface QuestionTiming {
  questionNumber: number;
  subject: string;
  timeSpent: number;
  isCorrect: boolean;
  difficulty: string;
}

interface SubjectTiming {
  subject: string;
  totalTime: number;
  averageTime: number;
  questionCount: number;
}

interface TimeDistribution {
  fast: number;
  normal: number;
  slow: number;
}

export const HeatmapView: React.FC<{ testSessionId?: string }> = ({
  testSessionId,
}) => {
  const { user } = useAuth();
  const [heatmapData, setHeatmapData] = useState<TimeManagementData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !testSessionId) return;

    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_ANALYTICS_API_URL}/analytics/time-management/${testSessionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch time management data');
        }

        const data = await response.json();
        setHeatmapData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [user, testSessionId]);

  if (loading) {
    return <div className="heatmap-view loading">Loading heatmap...</div>;
  }

  if (error) {
    return <div className="heatmap-view error">Error: {error}</div>;
  }

  if (!heatmapData) {
    return (
      <div className="heatmap-view empty">
        No time management data available
      </div>
    );
  }

  const getTimeColor = (timeSpent: number): string => {
    if (timeSpent < 60) return '#4caf50'; // Fast - Green
    if (timeSpent <= 120) return '#ff9800'; // Normal - Orange
    return '#f44336'; // Slow - Red
  };

  const getTimeCategory = (timeSpent: number): string => {
    if (timeSpent < 60) return 'fast';
    if (timeSpent <= 120) return 'normal';
    return 'slow';
  };

  const maxTime = Math.max(
    ...heatmapData.questionTimings.map(q => q.timeSpent)
  );

  return (
    <div className="heatmap-view">
      <h2>Time Management Heatmap</h2>

      <div className="time-distribution-summary">
        <h3>Time Distribution</h3>
        <div className="distribution-bars">
          <div className="distribution-item">
            <span className="distribution-label">Fast (&lt;60s)</span>
            <div className="distribution-bar">
              <div
                className="distribution-fill fast"
                style={{
                  width: `${(heatmapData.timeDistribution.fast / heatmapData.questionTimings.length) * 100}%`,
                }}
              />
            </div>
            <span className="distribution-count">
              {heatmapData.timeDistribution.fast}
            </span>
          </div>
          <div className="distribution-item">
            <span className="distribution-label">Normal (60-120s)</span>
            <div className="distribution-bar">
              <div
                className="distribution-fill normal"
                style={{
                  width: `${(heatmapData.timeDistribution.normal / heatmapData.questionTimings.length) * 100}%`,
                }}
              />
            </div>
            <span className="distribution-count">
              {heatmapData.timeDistribution.normal}
            </span>
          </div>
          <div className="distribution-item">
            <span className="distribution-label">Slow (&gt;120s)</span>
            <div className="distribution-bar">
              <div
                className="distribution-fill slow"
                style={{
                  width: `${(heatmapData.timeDistribution.slow / heatmapData.questionTimings.length) * 100}%`,
                }}
              />
            </div>
            <span className="distribution-count">
              {heatmapData.timeDistribution.slow}
            </span>
          </div>
        </div>
      </div>

      <div className="subject-timings">
        <h3>Subject-wise Time Analysis</h3>
        <div className="subject-timing-cards">
          {heatmapData.subjectTimings.map(subject => (
            <div key={subject.subject} className="subject-timing-card">
              <h4>
                {subject.subject.charAt(0).toUpperCase() +
                  subject.subject.slice(1)}
              </h4>
              <div className="timing-stat">
                <span className="timing-label">Total Time:</span>
                <span className="timing-value">
                  {Math.round(subject.totalTime)}s
                </span>
              </div>
              <div className="timing-stat">
                <span className="timing-label">Average Time:</span>
                <span className="timing-value">
                  {Math.round(subject.averageTime)}s
                </span>
              </div>
              <div className="timing-stat">
                <span className="timing-label">Questions:</span>
                <span className="timing-value">{subject.questionCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="question-heatmap">
        <h3>Question-by-Question Time Analysis</h3>
        <div className="heatmap-legend">
          <span className="legend-item">
            <span className="legend-color fast"></span>
            Fast (&lt;60s)
          </span>
          <span className="legend-item">
            <span className="legend-color normal"></span>
            Normal (60-120s)
          </span>
          <span className="legend-item">
            <span className="legend-color slow"></span>
            Slow (&gt;120s)
          </span>
        </div>
        <div className="heatmap-grid">
          {heatmapData.questionTimings.map(question => (
            <div
              key={question.questionNumber}
              className={`heatmap-cell ${getTimeCategory(question.timeSpent)} ${question.isCorrect ? 'correct' : 'incorrect'}`}
              style={{
                backgroundColor: getTimeColor(question.timeSpent),
                opacity: 0.5 + (question.timeSpent / maxTime) * 0.5,
              }}
              title={`Q${question.questionNumber}: ${question.timeSpent}s - ${question.isCorrect ? 'Correct' : 'Incorrect'}`}
            >
              <span className="cell-number">{question.questionNumber}</span>
              <span className="cell-time">
                {Math.round(question.timeSpent)}s
              </span>
              <span className="cell-status">
                {question.isCorrect ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
