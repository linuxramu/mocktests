import React from 'react';
import './SubmissionConfirmation.css';

interface SubmissionConfirmationProps {
  totalQuestions: number;
  answeredQuestions: number;
  markedForReview: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SubmissionConfirmation: React.FC<SubmissionConfirmationProps> = ({
  totalQuestions,
  answeredQuestions,
  markedForReview,
  onConfirm,
  onCancel,
}) => {
  const unansweredQuestions = totalQuestions - answeredQuestions;

  return (
    <div className="submission-overlay">
      <div className="submission-modal">
        <h2>Confirm Test Submission</h2>

        <div className="submission-summary">
          <div className="summary-item">
            <span className="summary-label">Total Questions:</span>
            <span className="summary-value">{totalQuestions}</span>
          </div>
          <div className="summary-item answered">
            <span className="summary-label">Answered:</span>
            <span className="summary-value">{answeredQuestions}</span>
          </div>
          <div className="summary-item unanswered">
            <span className="summary-label">Not Answered:</span>
            <span className="summary-value">{unansweredQuestions}</span>
          </div>
          <div className="summary-item marked">
            <span className="summary-label">Marked for Review:</span>
            <span className="summary-value">{markedForReview}</span>
          </div>
        </div>

        {unansweredQuestions > 0 && (
          <div className="warning-message">
            <span className="warning-icon">⚠️</span>
            <p>
              You have {unansweredQuestions} unanswered question
              {unansweredQuestions > 1 ? 's' : ''}. Are you sure you want to
              submit?
            </p>
          </div>
        )}

        {markedForReview > 0 && (
          <div className="info-message">
            <span className="info-icon">ℹ️</span>
            <p>
              You have {markedForReview} question
              {markedForReview > 1 ? 's' : ''} marked for review.
            </p>
          </div>
        )}

        <div className="submission-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Go Back
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
};
