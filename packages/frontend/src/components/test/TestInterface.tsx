import React, { useState, useEffect, useCallback } from 'react';
import {
  Question,
  TestConfiguration,
  UserAnswer,
} from '@eamcet-platform/shared';
import { QuestionRenderer } from './QuestionRenderer';
import { NavigationPanel } from './NavigationPanel';
import { TimerComponent } from './TimerComponent';
import { SubmissionConfirmation } from './SubmissionConfirmation';
import { ProgressIndicator } from './ProgressIndicator';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAutoSave } from '../../hooks/useAutoSave';
import './TestInterface.css';

interface TestInterfaceProps {
  testSessionId: string;
  questions: Question[];
  configuration: TestConfiguration;
  onSubmitTest: (answers: Map<string, UserAnswer>) => void;
  websocketUrl?: string;
}

interface QuestionStatus {
  answered: boolean;
  markedForReview: boolean;
  visited: boolean;
}

export const TestInterface: React.FC<TestInterfaceProps> = ({
  testSessionId,
  questions,
  configuration,
  onSubmitTest,
  websocketUrl,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(
    new Set()
  );
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(
    new Set([1])
  );
  const [startTime] = useState<Date>(new Date());
  const [questionStartTimes, setQuestionStartTimes] = useState<
    Map<number, Date>
  >(new Map([[1, new Date()]]));
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionNumber = currentQuestionIndex + 1;

  // WebSocket connection for real-time updates
  const { isConnected, sendMessage } = useWebSocket({
    url: websocketUrl || `ws://localhost:8787/ws/test/${testSessionId}`,
    onMessage: message => {
      console.log('Received WebSocket message:', message);
      // Handle real-time updates from server
      if (message.type === 'SYNC_STATE') {
        // Sync state with server if needed
      }
    },
    onConnect: () => {
      console.log('Connected to test session WebSocket');
      sendMessage({
        type: 'JOIN_SESSION',
        payload: { testSessionId },
      });
    },
  });

  // Auto-save functionality
  const { hasUnsavedChanges } = useAutoSave({
    data: {
      answers: Array.from(answers.entries()),
      markedForReview: Array.from(markedForReview),
      currentQuestionIndex,
    },
    onSave: async data => {
      // Send auto-save to server
      if (isConnected) {
        sendMessage({
          type: 'AUTO_SAVE',
          payload: {
            testSessionId,
            answers: data.answers,
            markedForReview: data.markedForReview,
            currentQuestionIndex: data.currentQuestionIndex,
          },
        });
      }
    },
    interval: 5000, // Auto-save every 5 seconds
  });

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(
        Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    setVisitedQuestions(prev => new Set(prev).add(currentQuestionNumber));
    if (!questionStartTimes.has(currentQuestionNumber)) {
      setQuestionStartTimes(prev =>
        new Map(prev).set(currentQuestionNumber, new Date())
      );
    }
  }, [currentQuestionNumber, questionStartTimes]);

  const handleAnswerSelect = useCallback(
    (answer: string) => {
      setAnswers(prev => {
        const newAnswers = new Map(prev);
        newAnswers.set(currentQuestion.id, answer);
        return newAnswers;
      });
    },
    [currentQuestion.id]
  );

  const handleToggleReview = useCallback(() => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionNumber)) {
        newSet.delete(currentQuestionNumber);
      } else {
        newSet.add(currentQuestionNumber);
      }
      return newSet;
    });
  }, [currentQuestionNumber]);

  const handleNavigate = useCallback((questionNumber: number) => {
    setCurrentQuestionIndex(questionNumber - 1);
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const calculateTimeSpent = useCallback(
    (questionNumber: number): number => {
      const startTime = questionStartTimes.get(questionNumber);
      if (!startTime) return 0;
      return Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    },
    [questionStartTimes]
  );

  const handleSubmit = useCallback(() => {
    setShowSubmissionModal(true);
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    const userAnswers = new Map<string, UserAnswer>();

    questions.forEach((question, index) => {
      const questionNumber = index + 1;
      const selectedAnswer = answers.get(question.id);
      const timeSpent = calculateTimeSpent(questionNumber);

      const userAnswer: UserAnswer = {
        id: `${testSessionId}-${question.id}`,
        testSessionId,
        questionId: question.id,
        selectedAnswer,
        isCorrect: selectedAnswer === question.correctAnswer,
        timeSpentSeconds: timeSpent,
        answeredAt: selectedAnswer ? new Date() : undefined,
        isMarkedForReview: markedForReview.has(questionNumber),
      };

      userAnswers.set(question.id, userAnswer);
    });

    // Send final submission via WebSocket
    if (isConnected) {
      sendMessage({
        type: 'SUBMIT_TEST',
        payload: {
          testSessionId,
          answers: Array.from(userAnswers.entries()),
        },
      });
    }

    onSubmitTest(userAnswers);
  }, [
    answers,
    questions,
    testSessionId,
    markedForReview,
    calculateTimeSpent,
    onSubmitTest,
    isConnected,
    sendMessage,
  ]);

  const handleCancelSubmit = useCallback(() => {
    setShowSubmissionModal(false);
  }, []);

  const handleTimeUp = useCallback(() => {
    alert('Time is up! Your test will be submitted automatically.');
    handleConfirmSubmit();
  }, [handleConfirmSubmit]);

  const getQuestionStatuses = useCallback((): Map<number, QuestionStatus> => {
    const statuses = new Map<number, QuestionStatus>();

    questions.forEach((question, index) => {
      const questionNumber = index + 1;
      statuses.set(questionNumber, {
        answered: answers.has(question.id),
        markedForReview: markedForReview.has(questionNumber),
        visited: visitedQuestions.has(questionNumber),
      });
    });

    return statuses;
  }, [questions, answers, markedForReview, visitedQuestions]);

  const totalTimeSeconds = configuration.timeLimit * 60;
  const timeUtilization = (elapsedSeconds / totalTimeSeconds) * 100;

  return (
    <div className="test-interface">
      <div className="test-header">
        <div className="header-left">
          <h2>EAMCET Mock Test</h2>
          {hasUnsavedChanges && (
            <span className="save-indicator">Saving...</span>
          )}
          {isConnected && (
            <span className="connection-indicator connected">● Live</span>
          )}
          {!isConnected && (
            <span className="connection-indicator disconnected">● Offline</span>
          )}
        </div>
        <TimerComponent
          totalTimeSeconds={totalTimeSeconds}
          onTimeUp={handleTimeUp}
        />
      </div>

      <ProgressIndicator
        totalQuestions={questions.length}
        answeredQuestions={answers.size}
        currentSubject={currentQuestion.subject}
        timeUtilization={timeUtilization}
      />

      <div className="test-content">
        <div className="question-section">
          <QuestionRenderer
            question={currentQuestion}
            questionNumber={currentQuestionNumber}
            selectedAnswer={answers.get(currentQuestion.id)}
            onAnswerSelect={handleAnswerSelect}
            isMarkedForReview={markedForReview.has(currentQuestionNumber)}
            onToggleReview={handleToggleReview}
          />
        </div>

        <div className="navigation-section">
          <NavigationPanel
            totalQuestions={questions.length}
            currentQuestion={currentQuestionNumber}
            questionStatuses={getQuestionStatuses()}
            onNavigate={handleNavigate}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {showSubmissionModal && (
        <SubmissionConfirmation
          totalQuestions={questions.length}
          answeredQuestions={answers.size}
          markedForReview={markedForReview.size}
          onConfirm={handleConfirmSubmit}
          onCancel={handleCancelSubmit}
        />
      )}
    </div>
  );
};
