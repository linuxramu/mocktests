import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionRenderer } from './QuestionRenderer';
import { Question } from '@eamcet-platform/shared';

const mockQuestion: Question = {
  id: 'q1',
  subject: 'physics',
  difficulty: 'medium',
  questionText: 'What is the speed of light?',
  options: ['299,792 km/s', '300,000 km/s', '150,000 km/s', '500,000 km/s'],
  correctAnswer: '299,792 km/s',
  explanation: 'The speed of light in vacuum is approximately 299,792 km/s',
  sourcePattern: 'EAMCET-2020',
  metadata: {
    topic: 'Optics',
    subtopic: 'Light Properties',
    yearSource: 2020,
    estimatedTime: 120,
    conceptTags: ['light', 'speed', 'physics'],
  },
};

describe('QuestionRenderer', () => {
  it('should render question with all options', () => {
    const onAnswerSelect = vi.fn();
    const onToggleReview = vi.fn();

    render(
      <QuestionRenderer
        question={mockQuestion}
        questionNumber={1}
        onAnswerSelect={onAnswerSelect}
        isMarkedForReview={false}
        onToggleReview={onToggleReview}
      />
    );

    expect(screen.getByText('What is the speed of light?')).toBeInTheDocument();
    expect(screen.getByText('299,792 km/s')).toBeInTheDocument();
    expect(screen.getByText('300,000 km/s')).toBeInTheDocument();
  });

  it('should call onAnswerSelect when option is clicked', () => {
    const onAnswerSelect = vi.fn();
    const onToggleReview = vi.fn();

    render(
      <QuestionRenderer
        question={mockQuestion}
        questionNumber={1}
        onAnswerSelect={onAnswerSelect}
        isMarkedForReview={false}
        onToggleReview={onToggleReview}
      />
    );

    const firstOption = screen.getByText('299,792 km/s');
    fireEvent.click(firstOption);

    expect(onAnswerSelect).toHaveBeenCalledWith('299,792 km/s');
  });

  it('should highlight selected answer', () => {
    const onAnswerSelect = vi.fn();
    const onToggleReview = vi.fn();

    render(
      <QuestionRenderer
        question={mockQuestion}
        questionNumber={1}
        selectedAnswer="299,792 km/s"
        onAnswerSelect={onAnswerSelect}
        isMarkedForReview={false}
        onToggleReview={onToggleReview}
      />
    );

    const selectedOption = screen.getByText('299,792 km/s').closest('.option');
    expect(selectedOption).toHaveClass('selected');
  });

  it('should toggle review status when mark button is clicked', () => {
    const onAnswerSelect = vi.fn();
    const onToggleReview = vi.fn();

    render(
      <QuestionRenderer
        question={mockQuestion}
        questionNumber={1}
        onAnswerSelect={onAnswerSelect}
        isMarkedForReview={false}
        onToggleReview={onToggleReview}
      />
    );

    const reviewButton = screen.getByText(/Mark for Review/);
    fireEvent.click(reviewButton);

    expect(onToggleReview).toHaveBeenCalled();
  });

  it('should display marked status correctly', () => {
    const onAnswerSelect = vi.fn();
    const onToggleReview = vi.fn();

    render(
      <QuestionRenderer
        question={mockQuestion}
        questionNumber={1}
        onAnswerSelect={onAnswerSelect}
        isMarkedForReview={true}
        onToggleReview={onToggleReview}
      />
    );

    expect(screen.getByText(/★ Marked for Review/)).toBeInTheDocument();
  });
});
