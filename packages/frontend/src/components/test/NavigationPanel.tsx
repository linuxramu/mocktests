import React from 'react';
import './NavigationPanel.css';

interface QuestionStatus {
  answered: boolean;
  markedForReview: boolean;
  visited: boolean;
}

interface NavigationPanelProps {
  totalQuestions: number;
  currentQuestion: number;
  questionStatuses: Map<number, QuestionStatus>;
  onNavigate: (questionNumber: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  totalQuestions,
  currentQuestion,
  questionStatuses,
  onNavigate,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  const getQuestionClass = (questionNum: number): string => {
    const status = questionStatuses.get(questionNum);
    const classes = ['question-btn'];

    if (questionNum === currentQuestion) {
      classes.push('current');
    }

    if (status?.answered) {
      classes.push('answered');
    }

    if (status?.markedForReview) {
      classes.push('marked');
    }

    if (!status?.visited && !status?.answered) {
      classes.push('not-visited');
    }

    return classes.join(' ');
  };

  const getStats = () => {
    let answered = 0;
    let marked = 0;
    let notVisited = 0;

    for (let i = 1; i <= totalQuestions; i++) {
      const status = questionStatuses.get(i);
      if (status?.answered) answered++;
      if (status?.markedForReview) marked++;
      if (!status?.visited && !status?.answered) notVisited++;
    }

    return {
      answered,
      marked,
      notVisited,
      notAnswered: totalQuestions - answered,
    };
  };

  const stats = getStats();

  return (
    <div className="navigation-panel">
      <div className="panel-header">
        <h3>Question Navigation</h3>
      </div>

      <div className="stats-summary">
        <div className="stat-item answered">
          <span className="stat-count">{stats.answered}</span>
          <span className="stat-label">Answered</span>
        </div>
        <div className="stat-item not-answered">
          <span className="stat-count">{stats.notAnswered}</span>
          <span className="stat-label">Not Answered</span>
        </div>
        <div className="stat-item marked">
          <span className="stat-count">{stats.marked}</span>
          <span className="stat-label">Marked</span>
        </div>
        <div className="stat-item not-visited">
          <span className="stat-count">{stats.notVisited}</span>
          <span className="stat-label">Not Visited</span>
        </div>
      </div>

      <div className="questions-grid">
        {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            className={getQuestionClass(num)}
            onClick={() => onNavigate(num)}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="navigation-controls">
        <button
          className="nav-btn prev-btn"
          onClick={onPrevious}
          disabled={currentQuestion === 1}
        >
          ← Previous
        </button>
        <button
          className="nav-btn next-btn"
          onClick={onNext}
          disabled={currentQuestion === totalQuestions}
        >
          Next →
        </button>
      </div>

      <button className="submit-btn" onClick={onSubmit}>
        Submit Test
      </button>

      <div className="legend">
        <h4>Legend:</h4>
        <div className="legend-item">
          <span className="legend-box answered"></span>
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <span className="legend-box marked"></span>
          <span>Marked for Review</span>
        </div>
        <div className="legend-item">
          <span className="legend-box not-visited"></span>
          <span>Not Visited</span>
        </div>
        <div className="legend-item">
          <span className="legend-box current"></span>
          <span>Current</span>
        </div>
      </div>
    </div>
  );
};
