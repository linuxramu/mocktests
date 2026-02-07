import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PerformanceLineChart, MultiLineChart } from './charts/ChartComponents';
import { MetricsGrid, MetricCard } from './MetricsCards';
import './TrendAnalysis.css';

interface TrendAnalysisData {
  userId: string;
  overallTrend: 'improving' | 'declining' | 'stable';
  subjectTrends: {
    subject: string;
    trend: 'improving' | 'declining' | 'stable';
  }[];
  performancePrediction: PerformancePrediction;
  percentileRanking: number;
  calculatedAt: Date;
}

interface PerformancePrediction {
  predictedScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  basedOnTests: number;
  projectedImprovement: number;
}

interface ProgressData {
  testHistory: {
    testDate: Date;
    accuracyPercentage: number;
    overallScore: number;
  }[];
  subjectProgress: {
    subject: string;
    recentPerformance: number[];
  }[];
}

export const TrendAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [trendData, setTrendData] = useState<TrendAnalysisData | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [trendsResponse, progressResponse] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_ANALYTICS_API_URL}/analytics/trends/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          ),
          fetch(
            `${import.meta.env.VITE_ANALYTICS_API_URL}/analytics/progress/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          ),
        ]);

        if (!trendsResponse.ok || !progressResponse.ok) {
          throw new Error('Failed to fetch trend data');
        }

        const trends = await trendsResponse.json();
        const progress = await progressResponse.json();

        setTrendData(trends);
        setProgressData(progress);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="trend-analysis loading">Loading trend analysis...</div>
    );
  }

  if (error) {
    return <div className="trend-analysis error">Error: {error}</div>;
  }

  if (!trendData || !progressData) {
    return <div className="trend-analysis empty">No trend data available</div>;
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

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '#4caf50';
      case 'declining':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#4caf50';
      case 'medium':
        return '#ff9800';
      default:
        return '#f44336';
    }
  };

  // Prepare chart data
  const performanceChartData = progressData.testHistory
    .slice(-10)
    .map((test, idx) => ({
      name: `Test ${idx + 1}`,
      accuracy: test.accuracyPercentage,
      score: test.overallScore,
    }));

  const subjectChartData = progressData.testHistory
    .slice(-5)
    .map((test, idx) => {
      const data: any = { name: `Test ${idx + 1}` };
      progressData.subjectProgress.forEach(subject => {
        if (subject.recentPerformance[idx] !== undefined) {
          data[subject.subject] = subject.recentPerformance[idx];
        }
      });
      return data;
    });

  const subjectLines = progressData.subjectProgress.map((subject, idx) => ({
    dataKey: subject.subject,
    color: ['#1976d2', '#4caf50', '#ff9800'][idx % 3],
    name: subject.subject.charAt(0).toUpperCase() + subject.subject.slice(1),
  }));

  return (
    <div className="trend-analysis">
      <h2>Trend Analysis</h2>

      <MetricsGrid>
        <MetricCard
          title="Overall Trend"
          value={trendData.overallTrend}
          icon={getTrendIcon(trendData.overallTrend)}
          color={getTrendColor(trendData.overallTrend)}
        />
        <MetricCard
          title="Percentile Ranking"
          value={`${trendData.percentileRanking}th`}
          subtitle="Among all users"
          icon="🏆"
          color="#1976d2"
        />
        <MetricCard
          title="Predicted Score"
          value={trendData.performancePrediction.predictedScore}
          subtitle={`Confidence: ${trendData.performancePrediction.confidenceLevel}`}
          icon="🎯"
          color={getConfidenceColor(
            trendData.performancePrediction.confidenceLevel
          )}
        />
        <MetricCard
          title="Projected Improvement"
          value={`${trendData.performancePrediction.projectedImprovement >= 0 ? '+' : ''}${trendData.performancePrediction.projectedImprovement.toFixed(1)}%`}
          subtitle={`Based on ${trendData.performancePrediction.basedOnTests} tests`}
          icon="📊"
          color={
            trendData.performancePrediction.projectedImprovement >= 0
              ? '#4caf50'
              : '#f44336'
          }
        />
      </MetricsGrid>

      <div className="performance-trend-section">
        <h3>Performance Trend</h3>
        <PerformanceLineChart data={performanceChartData} dataKey="accuracy" />
      </div>

      <div className="subject-trends-section">
        <h3>Subject-wise Trends</h3>
        <div className="subject-trend-cards">
          {trendData.subjectTrends.map(subject => (
            <div key={subject.subject} className="subject-trend-card">
              <div className="subject-trend-header">
                <h4>
                  {subject.subject.charAt(0).toUpperCase() +
                    subject.subject.slice(1)}
                </h4>
                <span
                  className="trend-badge"
                  style={{ backgroundColor: getTrendColor(subject.trend) }}
                >
                  {getTrendIcon(subject.trend)} {subject.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
        {subjectChartData.length > 0 && (
          <MultiLineChart data={subjectChartData} lines={subjectLines} />
        )}
      </div>

      <div className="prediction-section">
        <h3>Performance Prediction</h3>
        <div className="prediction-card">
          <div className="prediction-item">
            <span className="prediction-label">Predicted Next Score:</span>
            <span className="prediction-value">
              {trendData.performancePrediction.predictedScore}
            </span>
          </div>
          <div className="prediction-item">
            <span className="prediction-label">Confidence Level:</span>
            <span
              className="prediction-value"
              style={{
                color: getConfidenceColor(
                  trendData.performancePrediction.confidenceLevel
                ),
              }}
            >
              {trendData.performancePrediction.confidenceLevel.toUpperCase()}
            </span>
          </div>
          <div className="prediction-item">
            <span className="prediction-label">Based on Tests:</span>
            <span className="prediction-value">
              {trendData.performancePrediction.basedOnTests}
            </span>
          </div>
          <div className="prediction-item">
            <span className="prediction-label">Projected Improvement:</span>
            <span
              className="prediction-value"
              style={{
                color:
                  trendData.performancePrediction.projectedImprovement >= 0
                    ? '#4caf50'
                    : '#f44336',
              }}
            >
              {trendData.performancePrediction.projectedImprovement >= 0
                ? '+'
                : ''}
              {trendData.performancePrediction.projectedImprovement.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
