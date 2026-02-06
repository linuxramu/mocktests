import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './SubjectAnalysis.css';

interface SubjectAnalysisData {
  subject: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  averageTimePerQuestion: number;
  strengths: string[];
  weaknesses: string[];
  topicBreakdown: TopicPerformance[];
}

interface TopicPerformance {
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
}

export const SubjectAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [subjectData, setSubjectData] = useState<SubjectAnalysisData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('physics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchSubjectAnalysis = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_ANALYTICS_API_URL}/analytics/subject-analysis/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch subject analysis');
        }

        const data = await response.json();
        setSubjectData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectAnalysis();
  }, [user]);

  if (loading) {
    return (
      <div className="subject-analysis loading">
        Loading subject analysis...
      </div>
    );
  }

  if (error) {
    return <div className="subject-analysis error">Error: {error}</div>;
  }

  if (subjectData.length === 0) {
    return (
      <div className="subject-analysis empty">No subject data available</div>
    );
  }

  const currentSubject =
    subjectData.find(s => s.subject === selectedSubject) || subjectData[0];

  return (
    <div className="subject-analysis">
      <h2>Subject-wise Analysis</h2>

      <div className="subject-selector">
        {subjectData.map(subject => (
          <button
            key={subject.subject}
            className={`subject-button ${selectedSubject === subject.subject ? 'active' : ''}`}
            onClick={() => setSelectedSubject(subject.subject)}
          >
            {subject.subject.charAt(0).toUpperCase() + subject.subject.slice(1)}
          </button>
        ))}
      </div>

      <div className="subject-details">
        <div className="subject-header">
          <h3>
            {currentSubject.subject.charAt(0).toUpperCase() +
              currentSubject.subject.slice(1)}
          </h3>
          <div className="subject-summary">
            <div className="summary-item">
              <span className="summary-label">Total Questions:</span>
              <span className="summary-value">
                {currentSubject.totalQuestions}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Correct Answers:</span>
              <span className="summary-value">
                {currentSubject.correctAnswers}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Accuracy:</span>
              <span className="summary-value">
                {currentSubject.accuracyPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Avg Time:</span>
              <span className="summary-value">
                {Math.round(currentSubject.averageTimePerQuestion)}s
              </span>
            </div>
          </div>
        </div>

        {currentSubject.topicBreakdown &&
          currentSubject.topicBreakdown.length > 0 && (
            <div className="topic-breakdown">
              <h4>Topic-wise Performance</h4>
              <div className="topic-list">
                {currentSubject.topicBreakdown.map(topic => (
                  <div key={topic.topic} className="topic-item">
                    <div className="topic-name">{topic.topic}</div>
                    <div className="topic-stats">
                      <span className="topic-questions">
                        {topic.correctAnswers}/{topic.totalQuestions}
                      </span>
                      <span className="topic-accuracy">
                        {topic.accuracyPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="topic-bar">
                      <div
                        className="topic-bar-fill"
                        style={{ width: `${topic.accuracyPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        <div className="strengths-weaknesses">
          {currentSubject.strengths.length > 0 && (
            <div className="strengths-section">
              <h4>Strengths</h4>
              <ul>
                {currentSubject.strengths.map((strength, idx) => (
                  <li key={idx} className="strength-item">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentSubject.weaknesses.length > 0 && (
            <div className="weaknesses-section">
              <h4>Weaknesses</h4>
              <ul>
                {currentSubject.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="weakness-item">
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
