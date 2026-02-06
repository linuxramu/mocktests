import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubmissionConfirmation } from './SubmissionConfirmation';

describe('SubmissionConfirmation', () => {
  it('should render submission summary', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <SubmissionConfirmation
        totalQuestions={100}
        answeredQuestions={75}
        markedForReview={10}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Confirm Test Submission')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // Unanswered
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should show warning when there are unanswered questions', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <SubmissionConfirmation
        totalQuestions={100}
        answeredQuestions={75}
        markedForReview={10}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(
      screen.getByText(/You have 25 unanswered questions/)
    ).toBeInTheDocument();
  });

  it('should show info message when there are marked questions', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <SubmissionConfirmation
        totalQuestions={100}
        answeredQuestions={90}
        markedForReview={5}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(
      screen.getByText(/You have 5 questions marked for review/)
    ).toBeInTheDocument();
  });

  it('should call onConfirm when submit button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <SubmissionConfirmation
        totalQuestions={100}
        answeredQuestions={100}
        markedForReview={0}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const submitButton = screen.getByText('Submit Test');
    fireEvent.click(submitButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel when go back button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <SubmissionConfirmation
        totalQuestions={100}
        answeredQuestions={100}
        markedForReview={0}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByText('Go Back');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});
