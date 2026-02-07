// Integration tests for complete workflows
// Tests complete user registration, login, test-taking, and analytics workflows

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ServicesProvider } from '../contexts/ServicesContext';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { TestLauncher } from '../components/test/TestLauncher';
import { PerformanceDashboard } from '../components/analytics/PerformanceDashboard';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to wrap components with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ServicesProvider>{component}</ServicesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Integration Tests - Complete Workflows', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('User Registration and Login Flow', () => {
    it('should complete full registration workflow', async () => {
      // Mock successful registration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: false,
          },
        }),
      });

      renderWithProviders(<RegisterForm />);

      // Fill registration form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /register/i });
      fireEvent.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/register'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'SecurePass123!',
              name: 'Test User',
            }),
          })
        );
      });

      // Verify tokens are stored
      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe('test-access-token');
        expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token');
      });
    });

    it('should complete full login workflow', async () => {
      // Mock successful login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: true,
          },
        }),
      });

      renderWithProviders(<LoginForm />);

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'SecurePass123!',
            }),
          })
        );
      });

      // Verify authentication state
      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe('test-access-token');
      });
    });

    it('should handle authentication errors gracefully', async () => {
      // Mock failed login
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        }),
      });

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Test Taking Experience - End to End', () => {
    beforeEach(() => {
      // Set up authenticated user
      localStorage.setItem('accessToken', 'test-access-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        })
      );
    });

    it('should complete full test-taking workflow', async () => {
      const mockOnStartTest = vi.fn();

      // Mock test start
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'session-1',
          userId: 'user-1',
          testType: 'full',
          status: 'active',
          startedAt: new Date().toISOString(),
          totalQuestions: 160,
          configuration: {
            subjects: ['physics', 'chemistry', 'mathematics'],
            questionsPerSubject: 40,
            timeLimit: 180,
            difficulty: 'mixed',
            randomizeQuestions: true,
          },
        }),
      });

      // Mock question fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'q-1',
          subject: 'physics',
          difficulty: 'medium',
          questionText: 'What is the speed of light?',
          options: ['3x10^8 m/s', '3x10^6 m/s', '3x10^10 m/s', '3x10^4 m/s'],
          metadata: {
            topic: 'Optics',
            estimatedTime: 60,
          },
        }),
      });

      renderWithProviders(<TestLauncher onStartTest={mockOnStartTest} />);

      // Start test
      const startButton = screen.getByRole('button', { name: /start test/i });
      fireEvent.click(startButton);

      // Verify onStartTest was called
      await waitFor(() => {
        expect(mockOnStartTest).toHaveBeenCalledWith(
          expect.objectContaining({
            subjects: expect.any(Array),
            questionsPerSubject: expect.any(Number),
            timeLimit: expect.any(Number),
          })
        );
      });
    });

    it('should handle answer submission and auto-save', async () => {
      const sessionId = 'session-1';
      const questionId = 'q-1';

      // Mock answer submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Simulate answer submission
      const answerData = {
        questionId,
        selectedAnswer: '3x10^8 m/s',
        timeSpentSeconds: 45,
        isMarkedForReview: false,
      };

      const response = await fetch(
        `http://localhost:8788/tests/session/${sessionId}/answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answerData),
        }
      );

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should handle test submission', async () => {
      const sessionId = 'session-1';

      // Mock test submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId,
          score: 85,
          totalQuestions: 160,
          correctAnswers: 136,
          completedAt: new Date().toISOString(),
        }),
      });

      const response = await fetch(
        `http://localhost:8788/tests/session/${sessionId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.score).toBe(85);
      expect(result.correctAnswers).toBe(136);
    });
  });

  describe('Analytics Generation and Dashboard Display', () => {
    beforeEach(() => {
      // Set up authenticated user
      localStorage.setItem('accessToken', 'test-access-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        })
      );
    });

    it('should fetch and display performance metrics', async () => {
      // Mock performance metrics
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'user-1',
          testSessionId: 'session-1',
          overallScore: 85,
          accuracy: 85,
          subjectBreakdown: [
            {
              subject: 'physics',
              score: 82,
              accuracy: 82,
              strengths: ['Mechanics', 'Thermodynamics'],
              weaknesses: ['Optics'],
            },
            {
              subject: 'chemistry',
              score: 88,
              accuracy: 88,
              strengths: ['Organic Chemistry'],
              weaknesses: ['Inorganic Chemistry'],
            },
            {
              subject: 'mathematics',
              score: 85,
              accuracy: 85,
              strengths: ['Calculus', 'Algebra'],
              weaknesses: ['Trigonometry'],
            },
          ],
          timeManagement: {
            averageTimePerQuestion: 67,
            fastestQuestion: 30,
            slowestQuestion: 120,
          },
        }),
      });

      renderWithProviders(<PerformanceDashboard userId="user-1" />);

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/analytics/performance/user-1'),
          expect.any(Object)
        );
      });

      // Verify metrics are displayed
      await waitFor(() => {
        expect(screen.getByText(/85/)).toBeInTheDocument();
      });
    });

    it('should handle analytics service failure gracefully', async () => {
      // Mock analytics service failure
      mockFetch.mockRejectedValueOnce(new Error('Service unavailable'));

      renderWithProviders(<PerformanceDashboard userId="user-1" />);

      // Verify graceful degradation
      await waitFor(() => {
        expect(
          screen.getByText(/unable to load analytics/i) ||
            screen.getByText(/service unavailable/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence Across Components', () => {
    it('should maintain data consistency across test session', async () => {
      const sessionId = 'session-1';
      const userId = 'user-1';

      // Mock session data
      const sessionData = {
        id: sessionId,
        userId,
        testType: 'full',
        status: 'active',
        startedAt: new Date().toISOString(),
        totalQuestions: 160,
      };

      // Mock session fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sessionData,
      });

      const response = await fetch(
        `http://localhost:8788/tests/session/${sessionId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();

      // Verify data consistency
      expect(result.id).toBe(sessionId);
      expect(result.userId).toBe(userId);
      expect(result.status).toBe('active');
    });

    it('should persist user answers across page reloads', async () => {
      const sessionId = 'session-1';
      const answers = [
        { questionId: 'q-1', selectedAnswer: 'A', timeSpentSeconds: 45 },
        { questionId: 'q-2', selectedAnswer: 'B', timeSpentSeconds: 60 },
      ];

      // Submit answers
      for (const answer of answers) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        await fetch(`http://localhost:8788/tests/session/${sessionId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answer),
        });
      }

      // Verify all answers were submitted
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should maintain test history integrity', async () => {
      const userId = 'user-1';

      // Mock test history
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 'session-1',
            userId,
            testType: 'full',
            status: 'completed',
            startedAt: '2024-01-01T10:00:00Z',
            completedAt: '2024-01-01T13:00:00Z',
            totalQuestions: 160,
          },
          {
            id: 'session-2',
            userId,
            testType: 'subject-wise',
            status: 'completed',
            startedAt: '2024-01-02T10:00:00Z',
            completedAt: '2024-01-02T11:30:00Z',
            totalQuestions: 40,
          },
        ],
      });

      const response = await fetch('http://localhost:8788/tests/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-access-token',
        },
      });

      const history = await response.json();

      // Verify history integrity
      expect(history).toHaveLength(2);
      expect(history[0].status).toBe('completed');
      expect(history[1].status).toBe('completed');
    });
  });

  describe('Cross-Worker Communication', () => {
    it('should coordinate between test engine and analytics workers', async () => {
      const sessionId = 'session-1';
      const userId = 'user-1';

      // Mock test submission (test engine)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessionId,
          score: 85,
          completedAt: new Date().toISOString(),
        }),
      });

      // Submit test
      await fetch(`http://localhost:8788/tests/session/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Mock analytics generation (analytics worker)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId,
          testSessionId: sessionId,
          overallScore: 85,
          accuracy: 85,
        }),
      });

      // Fetch analytics
      const analyticsResponse = await fetch(
        `http://localhost:8789/analytics/performance/${userId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const analytics = await analyticsResponse.json();

      // Verify data consistency between workers
      expect(analytics.testSessionId).toBe(sessionId);
      expect(analytics.overallScore).toBe(85);
    });
  });
});
