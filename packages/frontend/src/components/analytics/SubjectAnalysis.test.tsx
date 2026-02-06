import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SubjectAnalysis } from './SubjectAnalysis';
import { AuthProvider } from '../../contexts/AuthContext';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
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

const mockSubjectData = [
  {
    subject: 'physics',
    totalQuestions: 100,
    correctAnswers: 75,
    accuracyPercentage: 75.0,
    averageTimePerQuestion: 90,
    strengths: ['Mechanics', 'Optics'],
    weaknesses: ['Thermodynamics'],
    topicBreakdown: [
      {
        topic: 'Mechanics',
        totalQuestions: 30,
        correctAnswers: 25,
        accuracyPercentage: 83.3,
      },
      {
        topic: 'Optics',
        totalQuestions: 25,
        correctAnswers: 22,
        accuracyPercentage: 88.0,
      },
      {
        topic: 'Thermodynamics',
        totalQuestions: 20,
        correctAnswers: 10,
        accuracyPercentage: 50.0,
      },
    ],
  },
  {
    subject: 'chemistry',
    totalQuestions: 100,
    correctAnswers: 80,
    accuracyPercentage: 80.0,
    averageTimePerQuestion: 85,
    strengths: ['Organic Chemistry'],
    weaknesses: ['Physical Chemistry'],
    topicBreakdown: [
      {
        topic: 'Organic Chemistry',
        totalQuestions: 40,
        correctAnswers: 35,
        accuracyPercentage: 87.5,
      },
      {
        topic: 'Physical Chemistry',
        totalQuestions: 30,
        correctAnswers: 20,
        accuracyPercentage: 66.7,
      },
    ],
  },
];

const mockAuthContext = {
  user: mockUser,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  loading: false,
};

describe('SubjectAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(
      <AuthProvider>
        <SubjectAnalysis />
      </AuthProvider>
    );

    expect(screen.getByText(/loading subject analysis/i)).toBeInTheDocument();
  });

  it('renders subject analysis after successful fetch', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubjectData,
    });

    render(
      <AuthProvider>
        <SubjectAnalysis />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Subject-wise Analysis')).toBeInTheDocument();
    });

    expect(screen.getByText('Physics')).toBeInTheDocument();
    expect(screen.getByText('Chemistry')).toBeInTheDocument();
  });

  it('allows switching between subjects', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubjectData,
    });

    render(
      <AuthProvider>
        <SubjectAnalysis />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Physics')).toBeInTheDocument();
    });

    const chemistryButton = screen.getAllByText('Chemistry')[0];
    fireEvent.click(chemistryButton);

    await waitFor(() => {
      expect(screen.getByText('Organic Chemistry')).toBeInTheDocument();
    });
  });

  it('displays topic breakdown', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubjectData,
    });

    render(
      <AuthProvider>
        <SubjectAnalysis />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Mechanics')).toBeInTheDocument();
    });

    expect(screen.getByText('Optics')).toBeInTheDocument();
    expect(screen.getByText('Thermodynamics')).toBeInTheDocument();
  });

  it('displays error message on fetch failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    render(
      <AuthProvider>
        <SubjectAnalysis />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
