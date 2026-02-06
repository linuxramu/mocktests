import React from 'react';
import { Question } from '@eamcet-platform/shared';
import './QuestionRenderer.css';

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  selectedAnswer?: string;
  onAnswerSelect: (answer: string) => void;
  isMarkedForReview: boolean;
  onToggleReview: () => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
  isMarkedForReview,
  onToggleReview,
}) => {
  return (
    <div className="question-renderer">
      <div className="question-header">
        <div className="question-info">
          <span className="question-number">Question {questionNumber}</span>
          <span className={`subject-badge ${question.subject}`}>
            {question.subject.charAt(0).toUpperCase() +
              question.subject.slice(1)}
          </span>
          <span className={`difficulty-badge ${question.difficulty}`}>
            {question.difficulty.charAt(0).toUpperCase() +
              question.difficulty.slice(1)}
          </span>
        </div>
        <button
          className={`review-btn ${isMarkedForReview ? 'marked' : ''}`}
          onClick={onToggleReview}
        >
          {isMarkedForReview ? '★ Marked for Review' : '☆ Mark for Review'}
        </button>
      </div>

      <div className="question-text">
        <p>{question.questionText}</p>
      </div>

      <div className="options-container">
        {question.options.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
          const isSelected = selectedAnswer === option;

          return (
            <div
              key={index}
              className={`option ${isSelected ? 'selected' : ''}`}
              onClick={() => onAnswerSelect(option)}
            >
              <div className="option-label">{optionLabel}</div>
              <div className="option-text">{option}</div>
            </div>
          );
        })}
      </div>

      <div className="question-metadata">
        <span>Topic: {question.metadata.topic}</span>
        {question.metadata.subtopic && (
          <span> • Subtopic: {question.metadata.subtopic}</span>
        )}
      </div>
    </div>
  );
};
