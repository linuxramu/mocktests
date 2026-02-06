import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TestReview } from './TestReview';

// Mock fetch
global.fetch = vi.fn();

describe('TestReview', () => {
  const mockSessionId = 'session-123';
  const mockSessionData = {
    session: {
      id: mockSessionId,
      userId: 'user-123',
      testType: 'full',
      status: 'completed',
      startedAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T13:00:00Z',
      durationSeconds: 10800,
      totalQuestions: 3,
      configuration: {
        subjects: ['physics', 'chemistry', 'mathematics'],
        questionsPerSubject: 1,
        timeLimit: 180,
        difficulty: 'mixed',
        randomizeQuestions: true,
      },
    },
  };

  const mockQuestions = [
    {
      question: {
        id: 'q1',
        subject: 'physics',
        difficulty: 'medium',
        questionText: "What is Newton's first law?",
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        explanation: 'This is the explanation',
        sourcePattern: 'pattern-1',
        metadata: {
          topic: 'Mechanics',
          estimatedTime: 60,
          conceptTags: ['newton', 'laws'],
        },
      },
      existingAnswer: {
        selectedAnswer: 'Option A',
        isCorrect: true,
        timeSpentSeconds: 45,
        isMarkedForReview: false,
      },
    },
    {
      question: {
        id: 'q2',
        subject: 'chemistry',
        difficulty: 'easy',
        questionText: 'What is H2O?',
        options: ['Water', 'Hydrogen', 'Oxygen', 'Helium'],
        correctAnswer: 'Water',
        explanation: 'H2O is water',
        sourcePattern: 'pattern-2',
        metadata: {
          topic: 'Basic Chemistry',
          estimatedTime: 30,
          conceptTags: ['molecules'],
        },
      },
      existingAnswer: {
        selectedAnswer: 'Hydrogen',
        isCorrect: false,
        timeSpentSeconds: 60,
        isMarkedForReview: true,
      },
    },
    {
      question: {
        id: 'q3',
        subject: 'mathematics',
        difficulty: 'hard',
        questionText: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        sourcePattern: 'pattern-3',
        metadata: {
          topic: 'Arithmetic',
          estimatedTime: 20,
          conceptTags: ['addition'],
        },
      },
      existingAnswer: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<TestReview sessionId={mockSessionId} />);
    expect(screen.getByText('Loading test review...')).toBeInTheDocument();
  });

  it('should fetch and display test review data', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[1],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[2],
      });

    render(<TestReview sessionId={mockSessionId} />);

    await waitFor(() => {
      expect(screen.getByText('Test Review')).toBeInTheDocument();
      expect(screen.getByText(/Score:/)).toBeInTheDocument();
    });
  });

  it('should display performance summary', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[1],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[2],
      });

    render(<TestReview sessionId={mockSessionId} />);

    await waitFor(() => {
      expect(screen.getByText(/Accuracy:/)).toBeInTheDocument();
      expect(screen.getByText(/Answered:/)).toBeInTheDocument();
    });
  });

  it('should navigate between questions', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[1],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[2],
      });

    render(<TestReview sessionId={mockSessionId} />);

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Question 2 of 3')).toBeInTheDocument();
    });
  });

  it('should filter questions by correctness', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[1],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[2],
      });

    render(<TestReview sessionId={mockSessionId} />);

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'correct' } });

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 1')).toBeInTheDocument();
    });
  });

  it('should display correct and incorrect indicators', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[1],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[2],
      });

    render(<TestReview sessionId={mockSessionId} />);

    await waitFor(() => {
      expect(screen.getByText('✓ Correct')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('✗ Incorrect')).toBeInTheDocument();
    });
  });

  it('should display explanation when available', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[1],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[2],
      });

    render(<TestReview sessionId={mockSessionId} />);

    await waitFor(() => {
      expect(screen.getByText('Explanation:')).toBeInTheDocument();
      expect(screen.getByText('This is the explanation')).toBeInTheDocument();
    });
  });

  it('should handle fetch error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    render(<TestReview sessionId={mockSessionId} />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading test review/)).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[1],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[2],
      });

    const onClose = vi.fn();
    render(<TestReview sessionId={mockSessionId} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Test Review')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should show marked for review indicator', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[1],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions[2],
      });

    render(<TestReview sessionId={mockSessionId} />);

    await waitFor(() => {
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Marked for Review')).toBeInTheDocument();
    });
  });
});
