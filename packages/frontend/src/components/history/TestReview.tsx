import React, { useState, useEffect } from 'react';
import { TestSession, Question, UserAnswer } from '@eamcet-platform/shared';
import './TestReview.css';

interface TestReviewProps {
  sessionId: string;
  onClose?: () => void;
}

interface TestReviewData {
  session: TestSession;
  questions: Question[];
  answers: UserAnswer[];
  analytics?: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    accuracy: number;
    subjectBreakdown: {
      subject: string;
      total: number;
      correct: number;
      accuracy: number;
    }[];
  };
}

export const TestReview: React.FC<TestReviewProps> = ({
  sessionId,
  onClose,
}) => {
  const [reviewData, setReviewData] = useState<TestReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number>(0);
  const [filterCorrectness, setFilterCorrectness] = useState<string>('all');

  useEffect(() => {
    fetchReviewData();
  }, [sessionId]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch session details
      const sessionResponse = await fetch(
        `${import.meta.env.VITE_TEST_ENGINE_URL}/tests/session/${sessionId}`
      );

      if (!sessionResponse.ok) {
        throw new Error('Failed to fetch test session');
      }

      const sessionData = await sessionResponse.json();

      // Fetch all questions and answers for the session
      const questionsPromises = [];
      for (let i = 1; i <= sessionData.session.totalQuestions; i++) {
        questionsPromises.push(
          fetch(
            `${import.meta.env.VITE_TEST_ENGINE_URL}/tests/session/${sessionId}/question/${i}`
          ).then(res => res.json())
        );
      }

      const questionsData = await Promise.all(questionsPromises);
      const questions = questionsData.map(data => data.question);
      const answers = questionsData
        .map(data => data.existingAnswer)
        .filter(Boolean);

      // Calculate analytics
      const answeredQuestions = answers.filter(a => a.selectedAnswer).length;
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const accuracy =
        answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0;

      // Subject breakdown
      const subjectMap = new Map<string, { total: number; correct: number }>();
      questions.forEach((q, idx) => {
        const answer = answers[idx];
        if (!subjectMap.has(q.subject)) {
          subjectMap.set(q.subject, { total: 0, correct: 0 });
        }
        const stats = subjectMap.get(q.subject)!;
        stats.total++;
        if (answer?.isCorrect) {
          stats.correct++;
        }
      });

      const subjectBreakdown = Array.from(subjectMap.entries()).map(
        ([subject, stats]) => ({
          subject,
          total: stats.total,
          correct: stats.correct,
          accuracy: (stats.correct / stats.total) * 100,
        })
      );

      setReviewData({
        session: sessionData.session,
        questions,
        answers,
        analytics: {
          totalQuestions: sessionData.session.totalQuestions,
          answeredQuestions,
          correctAnswers,
          accuracy,
          subjectBreakdown,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = React.useMemo(() => {
    if (!reviewData) return [];

    const questionsWithAnswers = reviewData.questions.map((q, idx) => ({
      question: q,
      answer: reviewData.answers[idx],
      index: idx,
    }));

    if (filterCorrectness === 'correct') {
      return questionsWithAnswers.filter(item => item.answer?.isCorrect);
    } else if (filterCorrectness === 'incorrect') {
      return questionsWithAnswers.filter(
        item => item.answer && !item.answer.isCorrect
      );
    } else if (filterCorrectness === 'unanswered') {
      return questionsWithAnswers.filter(item => !item.answer?.selectedAnswer);
    }

    return questionsWithAnswers;
  }, [reviewData, filterCorrectness]);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (loading) {
    return <div className="review-loading">Loading test review...</div>;
  }

  if (error) {
    return (
      <div className="review-error">
        <p>Error loading test review: {error}</p>
        <button onClick={fetchReviewData}>Retry</button>
        {onClose && <button onClick={onClose}>Close</button>}
      </div>
    );
  }

  if (!reviewData) {
    return null;
  }

  const currentItem = filteredQuestions[selectedQuestion];

  return (
    <div className="test-review">
      <div className="review-header">
        <h2>Test Review</h2>
        {onClose && (
          <button onClick={onClose} className="close-button">
            Close
          </button>
        )}
      </div>

      <div className="review-summary">
        <div className="summary-card">
          <h3>Test Information</h3>
          <p>
            <strong>Date:</strong> {formatDate(reviewData.session.startedAt)}
          </p>
          <p>
            <strong>Type:</strong> {reviewData.session.testType}
          </p>
          <p>
            <strong>Duration:</strong>{' '}
            {formatDuration(reviewData.session.durationSeconds)}
          </p>
        </div>

        <div className="summary-card">
          <h3>Performance</h3>
          <p>
            <strong>Score:</strong> {reviewData.analytics?.correctAnswers} /{' '}
            {reviewData.analytics?.totalQuestions}
          </p>
          <p>
            <strong>Accuracy:</strong>{' '}
            {reviewData.analytics?.accuracy.toFixed(1)}%
          </p>
          <p>
            <strong>Answered:</strong> {reviewData.analytics?.answeredQuestions}{' '}
            / {reviewData.analytics?.totalQuestions}
          </p>
        </div>

        <div className="summary-card subject-breakdown">
          <h3>Subject Breakdown</h3>
          {reviewData.analytics?.subjectBreakdown.map(subject => (
            <div key={subject.subject} className="subject-stat">
              <span className="subject-name">
                {subject.subject.charAt(0).toUpperCase() +
                  subject.subject.slice(1)}
                :
              </span>
              <span className="subject-score">
                {subject.correct}/{subject.total} ({subject.accuracy.toFixed(1)}
                %)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="review-filters">
        <label>Filter Questions:</label>
        <select
          value={filterCorrectness}
          onChange={e => {
            setFilterCorrectness(e.target.value);
            setSelectedQuestion(0);
          }}
        >
          <option value="all">All Questions</option>
          <option value="correct">Correct Answers</option>
          <option value="incorrect">Incorrect Answers</option>
          <option value="unanswered">Unanswered</option>
        </select>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="no-questions">No questions match the filter</div>
      ) : (
        <>
          <div className="question-navigation">
            <button
              onClick={() =>
                setSelectedQuestion(Math.max(0, selectedQuestion - 1))
              }
              disabled={selectedQuestion === 0}
            >
              Previous
            </button>
            <span>
              Question {selectedQuestion + 1} of {filteredQuestions.length}
            </span>
            <button
              onClick={() =>
                setSelectedQuestion(
                  Math.min(filteredQuestions.length - 1, selectedQuestion + 1)
                )
              }
              disabled={selectedQuestion === filteredQuestions.length - 1}
            >
              Next
            </button>
          </div>

          {currentItem && (
            <div className="question-review">
              <div className="question-header">
                <span className="question-number">
                  Question {currentItem.index + 1}
                </span>
                <span
                  className={`question-status ${currentItem.answer?.isCorrect ? 'correct' : 'incorrect'}`}
                >
                  {currentItem.answer?.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
                <span className="question-subject">
                  {currentItem.question.subject}
                </span>
              </div>

              <div className="question-text">
                {currentItem.question.questionText}
              </div>

              <div className="question-options">
                {currentItem.question.options.map((option, idx) => {
                  const isCorrect =
                    option === currentItem.question.correctAnswer;
                  const isSelected =
                    option === currentItem.answer?.selectedAnswer;

                  return (
                    <div
                      key={idx}
                      className={`option ${isCorrect ? 'correct-option' : ''} ${isSelected ? 'selected-option' : ''}`}
                    >
                      <span className="option-label">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="option-text">{option}</span>
                      {isCorrect && (
                        <span className="correct-indicator">✓</span>
                      )}
                      {isSelected && !isCorrect && (
                        <span className="incorrect-indicator">✗</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {currentItem.question.explanation && (
                <div className="question-explanation">
                  <h4>Explanation:</h4>
                  <p>{currentItem.question.explanation}</p>
                </div>
              )}

              {currentItem.answer && (
                <div className="answer-stats">
                  <p>
                    <strong>Time Spent:</strong>{' '}
                    {currentItem.answer.timeSpentSeconds}s
                  </p>
                  {currentItem.answer.isMarkedForReview && (
                    <p className="marked-review">Marked for Review</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
