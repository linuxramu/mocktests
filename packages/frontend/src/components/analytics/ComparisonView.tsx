import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ComparisonView.css';

interface ComparisonData {
  userId: string;
  testSessions: TestComparisonItem[];
  improvements: string[];
  declines: string[];
  insights: string[];
  calculatedAt: Date;
}

interface TestComparisonItem {
  testSessionId: string;
  testDate: Date;
  overallScore: number;
  accuracyPercentage: number;
  subjectScores: { subject: string; accuracy: number }[];
  timeManagement: number;
}

export const ComparisonView: React.FC = () => {
  const { user } = useAuth();
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null
  );
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [availableTests, setAvailableTests] = useState<
    { id: string; date: Date; type: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAvailableTests = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_TEST_ENGINE_API_URL}/tests/history`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch test history');
        }

        const data = await response.json();
        setAvailableTests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchAvailableTests();
  }, [user]);

  const handleTestSelection = (testId: string) => {
    setSelectedTests(prev => {
      if (prev.includes(testId)) {
        return prev.filter(id => id !== testId);
      } else if (prev.length < 5) {
        return [...prev, testId];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (selectedTests.length < 2) {
      setError('Please select at least 2 tests to compare');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_ANALYTICS_API_URL}/analytics/compare/${user?.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ testSessionIds: selectedTests }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to compare tests');
      }

      const data = await response.json();
      setComparisonData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comparison-view">
      <h2>Test Comparison</h2>

      <div className="test-selection">
        <h3>Select Tests to Compare (2-5 tests)</h3>
        <div className="test-list">
          {availableTests.map(test => (
            <div
              key={test.id}
              className={`test-item ${selectedTests.includes(test.id) ? 'selected' : ''}`}
              onClick={() => handleTestSelection(test.id)}
            >
              <input
                type="checkbox"
                checked={selectedTests.includes(test.id)}
                onChange={() => {}}
              />
              <span className="test-date">
                {new Date(test.date).toLocaleDateString()}
              </span>
              <span className="test-type">{test.type}</span>
            </div>
          ))}
        </div>
        <button
          className="compare-button"
          onClick={handleCompare}
          disabled={selectedTests.length < 2 || loading}
        >
          {loading ? 'Comparing...' : 'Compare Selected Tests'}
        </button>
      </div>

      {error && <div className="comparison-error">{error}</div>}

      {comparisonData && (
        <div className="comparison-results">
          <div className="comparison-overview">
            <h3>Comparison Overview</h3>
            <div className="comparison-table">
              <div className="table-header">
                <div className="header-cell">Date</div>
                <div className="header-cell">Score</div>
                <div className="header-cell">Accuracy</div>
                <div className="header-cell">Avg Time</div>
              </div>
              {comparisonData.testSessions.map(test => (
                <div key={test.testSessionId} className="table-row">
                  <div className="table-cell">
                    {new Date(test.testDate).toLocaleDateString()}
                  </div>
                  <div className="table-cell">{test.overallScore}</div>
                  <div className="table-cell">
                    {test.accuracyPercentage.toFixed(1)}%
                  </div>
                  <div className="table-cell">
                    {Math.round(test.timeManagement)}s
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="subject-comparison">
            <h3>Subject-wise Comparison</h3>
            <div className="subject-comparison-grid">
              {['physics', 'chemistry', 'mathematics'].map(subject => (
                <div key={subject} className="subject-comparison-card">
                  <h4>{subject.charAt(0).toUpperCase() + subject.slice(1)}</h4>
                  <div className="subject-comparison-bars">
                    {comparisonData.testSessions.map(test => {
                      const subjectScore = test.subjectScores.find(
                        s => s.subject === subject
                      );
                      return (
                        <div
                          key={test.testSessionId}
                          className="comparison-bar-item"
                        >
                          <div className="bar-label">
                            {new Date(test.testDate).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </div>
                          <div className="bar-container">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${subjectScore?.accuracy || 0}%`,
                              }}
                            />
                          </div>
                          <div className="bar-value">
                            {subjectScore?.accuracy.toFixed(1) || 0}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {comparisonData.improvements.length > 0 && (
            <div className="improvements-section">
              <h3>✅ Improvements</h3>
              <ul>
                {comparisonData.improvements.map((improvement, idx) => (
                  <li key={idx} className="improvement-item">
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {comparisonData.declines.length > 0 && (
            <div className="declines-section">
              <h3>⚠️ Areas of Decline</h3>
              <ul>
                {comparisonData.declines.map((decline, idx) => (
                  <li key={idx} className="decline-item">
                    {decline}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {comparisonData.insights.length > 0 && (
            <div className="insights-section">
              <h3>💡 Insights</h3>
              <ul>
                {comparisonData.insights.map((insight, idx) => (
                  <li key={idx} className="insight-item">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
