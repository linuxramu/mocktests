import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from './ProgressIndicator';

describe('ProgressIndicator', () => {
  it('should render progress statistics', () => {
    render(
      <ProgressIndicator
        totalQuestions={100}
        answeredQuestions={50}
        currentSubject="physics"
        timeUtilization={60}
      />
    );

    expect(screen.getByText('50/100')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('should calculate progress percentage correctly', () => {
    render(
      <ProgressIndicator
        totalQuestions={100}
        answeredQuestions={75}
        timeUtilization={50}
      />
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should show time warning when time usage exceeds progress', () => {
    render(
      <ProgressIndicator
        totalQuestions={100}
        answeredQuestions={50}
        timeUtilization={80}
      />
    );

    expect(
      screen.getByText(/You're using time faster than answering questions/)
    ).toBeInTheDocument();
  });

  it('should not show warning when time usage is appropriate', () => {
    render(
      <ProgressIndicator
        totalQuestions={100}
        answeredQuestions={80}
        timeUtilization={75}
      />
    );

    expect(
      screen.queryByText(/You're using time faster than answering questions/)
    ).not.toBeInTheDocument();
  });

  it('should display time utilization with correct color class', () => {
    const { rerender } = render(
      <ProgressIndicator
        totalQuestions={100}
        answeredQuestions={50}
        timeUtilization={85}
      />
    );

    let timeValue = screen.getByText('85%');
    expect(timeValue).toHaveClass('high');

    rerender(
      <ProgressIndicator
        totalQuestions={100}
        answeredQuestions={50}
        timeUtilization={60}
      />
    );

    timeValue = screen.getByText('60%');
    expect(timeValue).toHaveClass('medium');

    rerender(
      <ProgressIndicator
        totalQuestions={100}
        answeredQuestions={50}
        timeUtilization={30}
      />
    );

    timeValue = screen.getByText('30%');
    expect(timeValue).toHaveClass('low');
  });
});
