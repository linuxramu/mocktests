import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ComparisonView } from './ComparisonView';
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

const mockAvailableTests = [
  { id: 'test-1', date: new Date('2024-01-01'), type: 'full' },
  { id: 'test-2', date: new Date('2024-01-05'), type: 'subject-wise' },
  { id: 'test-3', date: new Date('2024-01-10'), type: 'full' },
];

const mockComparisonData = {
  userId: 'user-123',
  testSessions: [
    {
      testSessionId: 'test-1',
      testDate: new Date('2024-01-01'),
      overallScore: 70,
      accuracyPercentage: 70.0,
      subjectScores: [
        { subject: 'physics', accuracy: 68.0 },
        { subject: 'chemistry', accuracy: 72.0 },
        { subject: 'mathematics', accuracy: 70.0 },
      ],
      timeManagement: 95,
    },
    {
      testSessionId: 'test-2',
      testDate: new Date('2024-01-05'),
      overallScore: 75,
      accuracyPercentage: 75.0,
      subjectScores: [
        { subject: 'physics', accuracy: 73.0 },
        { subject: 'chemistry', accuracy: 77.0 },
        { subject: 'mathematics', accuracy: 75.0 },
      ],
      timeManagement: 90,
    },
  ],
  improvements: [
    'Overall accuracy improved by 5.0%',
    'Time management improved',
  ],
  declines: [],
  insights: ['Performance is consistent across tests'],
  calculatedAt: new Date(),
};

// Unused mock context - kept for future test expansion
// const mockAuthContext = {
//   user: mockUser,
//   login: vi.fn(),
//   logout: vi.fn(),
//   register: vi.fn(),
//   updateProfile: vi.fn(),
//   loading: false,
// };

describe('ComparisonView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  it('renders test selection interface', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvailableTests,
    });

    render(
      <AuthProvider>
        <ComparisonView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/select tests to compare/i)).toBeInTheDocument();
    });
  });

  it('allows selecting tests for comparison', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvailableTests,
    });

    render(
      <AuthProvider>
        <ComparisonView />
      </AuthProvider>
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  it('displays comparison results after comparing tests', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvailableTests,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockComparisonData,
      });

    render(
      <AuthProvider>
        <ComparisonView />
      </AuthProvider>
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
    });

    const compareButton = screen.getByText(/compare selected tests/i);
    fireEvent.click(compareButton);

    await waitFor(() => {
      expect(screen.getByText(/comparison overview/i)).toBeInTheDocument();
    });
  });

  it('shows error when less than 2 tests selected', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvailableTests,
    });

    render(
      <AuthProvider>
        <ComparisonView />
      </AuthProvider>
    );

    await waitFor(() => {
      const compareButton = screen.getByText(/compare selected tests/i);
      fireEvent.click(compareButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/please select at least 2 tests/i)
      ).toBeInTheDocument();
    });
  });
});
