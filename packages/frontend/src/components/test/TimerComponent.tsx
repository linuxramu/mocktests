import React, { useState, useEffect, useCallback } from 'react';
import './TimerComponent.css';

interface TimerComponentProps {
  totalTimeSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export const TimerComponent: React.FC<TimerComponentProps> = ({
  totalTimeSeconds,
  onTimeUp,
  isPaused = false,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalTimeSeconds);

  useEffect(() => {
    setRemainingSeconds(totalTimeSeconds);
  }, [totalTimeSeconds]);

  useEffect(() => {
    if (isPaused || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, remainingSeconds, onTimeUp]);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerClass = (): string => {
    const percentRemaining = (remainingSeconds / totalTimeSeconds) * 100;

    if (percentRemaining <= 10) return 'critical';
    if (percentRemaining <= 25) return 'warning';
    return 'normal';
  };

  const getProgressPercentage = (): number => {
    return (remainingSeconds / totalTimeSeconds) * 100;
  };

  return (
    <div className={`timer-component ${getTimerClass()}`}>
      <div className="timer-display">
        <span className="timer-icon">⏱</span>
        <span className="timer-text">{formatTime(remainingSeconds)}</span>
      </div>
      <div className="timer-progress-bar">
        <div
          className="timer-progress-fill"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      {getTimerClass() === 'warning' && (
        <div className="timer-warning">Less than 25% time remaining!</div>
      )}
      {getTimerClass() === 'critical' && (
        <div className="timer-critical">Less than 10% time remaining!</div>
      )}
    </div>
  );
};
