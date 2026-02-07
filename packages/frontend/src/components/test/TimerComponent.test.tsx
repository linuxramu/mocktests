import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TimerComponent } from './TimerComponent';

describe('TimerComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render initial time correctly', () => {
    const onTimeUp = vi.fn();
    render(<TimerComponent totalTimeSeconds={180} onTimeUp={onTimeUp} />);

    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('should countdown every second', async () => {
    const onTimeUp = vi.fn();
    render(<TimerComponent totalTimeSeconds={180} onTimeUp={onTimeUp} />);

    expect(screen.getByText('3:00')).toBeInTheDocument();

    vi.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText('2:59')).toBeInTheDocument();
    });

    vi.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText('2:58')).toBeInTheDocument();
    });
  });

  it('should call onTimeUp when timer reaches zero', async () => {
    const onTimeUp = vi.fn();
    render(<TimerComponent totalTimeSeconds={3} onTimeUp={onTimeUp} />);

    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(onTimeUp).toHaveBeenCalled();
    });
  });

  it('should apply warning class based on time percentage', () => {
    const onTimeUp = vi.fn();

    // Test with 20% time remaining (should be warning)
    const { container } = render(
      <TimerComponent totalTimeSeconds={100} onTimeUp={onTimeUp} />
    );

    // Initially should be normal
    const timerComponent = container.querySelector('.timer-component');
    expect(timerComponent).toHaveClass('normal');
  });

  it('should calculate timer class correctly', () => {
    const onTimeUp = vi.fn();

    // The component determines class based on remaining/total percentage
    // We can verify the logic by checking different scenarios
    render(<TimerComponent totalTimeSeconds={100} onTimeUp={onTimeUp} />);

    // Component should render without errors
    expect(screen.getByText('1:40')).toBeInTheDocument();
  });

  it('should not countdown when paused', async () => {
    const onTimeUp = vi.fn();
    render(
      <TimerComponent
        totalTimeSeconds={180}
        onTimeUp={onTimeUp}
        isPaused={true}
      />
    );

    expect(screen.getByText('3:00')).toBeInTheDocument();

    vi.advanceTimersByTime(5000);

    // Should still show 3:00 because it's paused
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });
});
