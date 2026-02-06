import React from 'react';
import './ProgressIndicator.css';

interface ProgressIndicatorProps {
  totalQuestions: number;
  answeredQuestions: number;
  currentSubject?: string;
  timeUtilization: number; // percentage
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  totalQuestions,
  answeredQuestions,
  currentSubject,
  timeUtilization,
}) => {
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  const getTimeUtilizationClass = (): string => {
    if (timeUtilization > 80) return 'high';
    if (timeUtilization > 50) return 'medium';
    return 'low';
  };

  return (
    <div className="progress-indicator">
      <div className="progress-stats">
        <div className="stat">
          <span className="stat-label">Progress</span>
          <span className="stat-value">
            {answeredQuestions}/{totalQuestions}
          </span>
        </div>
        {currentSubject && (
          <div className="stat">
            <span className="stat-label">Current Subject</span>
            <span className="stat-value subject">
              {currentSubject.charAt(0).toUpperCase() + currentSubject.slice(1)}
            </span>
          </div>
        )}
        <div className="stat">
          <span className="stat-label">Time Used</span>
          <span className={`stat-value ${getTimeUtilizationClass()}`}>
            {timeUtilization.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="progress-percentage">
          {progressPercentage.toFixed(0)}%
        </span>
      </div>

      {timeUtilization > 75 && progressPercentage < 75 && (
        <div className="time-warning">
          ⚠️ You're using time faster than answering questions. Consider
          speeding up!
        </div>
      )}
    </div>
  );
};
