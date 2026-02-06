import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestLauncher } from './TestLauncher';
import { TestConfiguration } from '@eamcet-platform/shared';

describe('TestLauncher', () => {
  it('should render test configuration form', () => {
    const onStartTest = vi.fn();
    render(<TestLauncher onStartTest={onStartTest} />);

    expect(screen.getByText('Configure Your Mock Test')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('Chemistry')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
  });

  it('should call onStartTest with correct configuration', () => {
    const onStartTest = vi.fn();
    render(<TestLauncher onStartTest={onStartTest} />);

    const startButton = screen.getByText('Start Test');
    fireEvent.click(startButton);

    expect(onStartTest).toHaveBeenCalledWith(
      expect.objectContaining({
        subjects: expect.arrayContaining([
          'physics',
          'chemistry',
          'mathematics',
        ]),
        questionsPerSubject: 40,
        timeLimit: 180,
        difficulty: 'mixed',
        randomizeQuestions: true,
      })
    );
  });

  it('should update subjects when checkboxes are toggled', () => {
    const onStartTest = vi.fn();
    render(<TestLauncher onStartTest={onStartTest} />);

    const physicsCheckbox = screen.getByLabelText('Physics');
    fireEvent.click(physicsCheckbox);

    const startButton = screen.getByText('Start Test');
    fireEvent.click(startButton);

    const config: TestConfiguration = onStartTest.mock.calls[0][0];
    expect(config.subjects).not.toContain('physics');
  });

  it('should disable start button when no subjects selected', () => {
    const onStartTest = vi.fn();
    render(<TestLauncher onStartTest={onStartTest} />);

    // Uncheck all subjects
    fireEvent.click(screen.getByLabelText('Physics'));
    fireEvent.click(screen.getByLabelText('Chemistry'));
    fireEvent.click(screen.getByLabelText('Mathematics'));

    const startButton = screen.getByText('Start Test');
    expect(startButton).toBeDisabled();
  });
});
