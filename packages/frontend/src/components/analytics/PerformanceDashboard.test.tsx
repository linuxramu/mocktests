import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PerformanceDashboard } from './PerformanceDashboard';
import { AuthProvider } from '../../contexts/AuthContext';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockMetrics = {
  userId: 'user-123',
  testSessionId: 'session-123',
  overallScore: 75,
  totalQuestions: 100,
  correctAnswers: 75,
  incorrectAnswers: 20,
  unansweredQuestions: 5,
  accuracyPercentage: 78.9,
  averageTimePerQuestion: 95,
  totalTimeSpent: 9500,
  subjectWiseAnalysis: [
    {
      subject: 'physics',
      totalQuestions: 33,
      correctAnswers: 25,
      accuracyPercentage: 75.8,
      averageTimePerQuestion: 90,
      strengths: ['Mechanics', 'Optics'],
      weaknesses: ['Thermodynamics'],
    },
    {
      subject: 'chemistry',
      totalQuestions: 33,
      correctAnswers: 27,
      accuracyPercentage: 81.8,
      averageTimePerQuestion: 85,
      strengths: ['Organic Chemistry'],
      weaknesses: ['Physical Chemistry'],
    },
    {
      subject: 'mathematics',
      totalQuestions: 34,
      correctAnswers: 23,
      accuracyPercentage: 67.6,
      averageTimePerQuestion: 110,
      strengths: ['Algebra'],
      weaknesses: ['Calculus', 'Trigonometry'],
    },
  ],
  timeManagementAnalysis: {
    fastQuestions: 30,
    normalQuestions: 50,
    slowQuestions: 15,
    timeDistribution: {
      physics: 2970,
      chemistry: 2805,
      mathematics: 3740,
    },
    suggestions: ['Consider practicing time management'],
  },
  thinkingAbilityAssessment: {
    quickCorrectAnswers: 20,
    thoughtfulCorrectAnswers: 40,
    slowCorrectAnswers: 15,
    impulsiveErrors: 5,
    confusionErrors: 10,
    confidenceScore: 72,
    insights: ['Good analytical thinking'],
  },
  calculatedAt: new Date(),
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    if (key === 'user') return JSON.stringify(mockUser);
    if (key === 'accessToken') return 'mock-token';
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(
      <AuthProvider>
        <PerformanceDashboard />
      </AuthProvider>
    );

    expect(screen.getByText(/loading metrics/i)).toBeInTheDocument();
  });

  it('renders performance metrics after successful fetch', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetrics,
    });

    render(
      <AuthProvider>
        <PerformanceDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('75/100')).toBeInTheDocument();
    expect(screen.getByText('78.9%')).toBeInTheDocument();
    expect(screen.getByText('95s')).toBeInTheDocument();
  });

  it('renders subject-wise analysis', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetrics,
    });

    render(
      <AuthProvider>
        <PerformanceDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Physics')).toBeInTheDocument();
    });

    expect(screen.getByText('Chemistry')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
  });

  it('displays error message on fetch failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    render(
      <AuthProvider>
        <PerformanceDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no metrics available', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    render(
      <AuthProvider>
        <PerformanceDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no performance data available/i)
      ).toBeInTheDocument();
    });
  });
});
