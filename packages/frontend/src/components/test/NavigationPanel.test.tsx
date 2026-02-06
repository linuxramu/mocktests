import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationPanel } from './NavigationPanel';

describe('NavigationPanel', () => {
  const mockQuestionStatuses = new Map([
    [1, { answered: true, markedForReview: false, visited: true }],
    [2, { answered: false, markedForReview: true, visited: true }],
    [3, { answered: false, markedForReview: false, visited: false }],
  ]);

  it('should render all question buttons', () => {
    const onNavigate = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSubmit = vi.fn();

    render(
      <NavigationPanel
        totalQuestions={10}
        currentQuestion={1}
        questionStatuses={mockQuestionStatuses}
        onNavigate={onNavigate}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    );

    const questionButtons = screen
      .getAllByRole('button')
      .filter(btn => /^\d+$/.test(btn.textContent || ''));
    expect(questionButtons).toHaveLength(10);
  });

  it('should call onNavigate when question button is clicked', () => {
    const onNavigate = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSubmit = vi.fn();

    render(
      <NavigationPanel
        totalQuestions={10}
        currentQuestion={1}
        questionStatuses={mockQuestionStatuses}
        onNavigate={onNavigate}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    );

    const questionButton = screen.getByText('5');
    fireEvent.click(questionButton);

    expect(onNavigate).toHaveBeenCalledWith(5);
  });

  it('should disable previous button on first question', () => {
    const onNavigate = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSubmit = vi.fn();

    render(
      <NavigationPanel
        totalQuestions={10}
        currentQuestion={1}
        questionStatuses={mockQuestionStatuses}
        onNavigate={onNavigate}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    );

    const prevButton = screen.getByText('← Previous');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last question', () => {
    const onNavigate = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSubmit = vi.fn();

    render(
      <NavigationPanel
        totalQuestions={10}
        currentQuestion={10}
        questionStatuses={mockQuestionStatuses}
        onNavigate={onNavigate}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    );

    const nextButton = screen.getByText('Next →');
    expect(nextButton).toBeDisabled();
  });

  it('should display correct statistics', () => {
    const onNavigate = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onSubmit = vi.fn();

    const { container } = render(
      <NavigationPanel
        totalQuestions={3}
        currentQuestion={1}
        questionStatuses={mockQuestionStatuses}
        onNavigate={onNavigate}
        onPrevious={onPrevious}
        onNext={onNext}
        onSubmit={onSubmit}
      />
    );

    // Check that stats summary exists
    const statsSummary = container.querySelector('.stats-summary');
    expect(statsSummary).toBeInTheDocument();

    // Check that all stat items are present
    const statItems = container.querySelectorAll('.stat-item');
    expect(statItems.length).toBe(4); // Answered, Not Answered, Marked, Not Visited
  });
});
