import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TestHistoryList } from './TestHistoryList';

// Mock fetch
global.fetch = vi.fn();

describe('TestHistoryList', () => {
  const mockUserId = 'user-123';
  const mockHistory = [
    {
      id: 'session-1',
      userId: mockUserId,
      testType: 'full',
      status: 'completed',
      startedAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T13:00:00Z',
      durationSeconds: 10800,
      totalQuestions: 120,
    },
    {
      id: 'session-2',
      userId: mockUserId,
      testType: 'subject-wise',
      status: 'completed',
      startedAt: '2024-01-10T09:00:00Z',
      completedAt: '2024-01-10T10:00:00Z',
      durationSeconds: 3600,
      totalQuestions: 40,
    },
    {
      id: 'session-3',
      userId: mockUserId,
      testType: 'custom',
      status: 'abandoned',
      startedAt: '2024-01-05T14:00:00Z',
      totalQuestions: 60,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<TestHistoryList userId={mockUserId} />);
    expect(screen.getByText('Loading test history...')).toBeInTheDocument();
  });

  it('should fetch and display test history', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    render(<TestHistoryList userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Full Test')).toBeInTheDocument();
      expect(screen.getByText('Subject Test')).toBeInTheDocument();
      expect(screen.getByText('Custom Test')).toBeInTheDocument();
    });
  });

  it('should filter by status', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    render(<TestHistoryList userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Showing 3 of 3 tests')).toBeInTheDocument();
    });

    // Filter by completed
    const statusFilter = screen.getByLabelText('Status:');
    fireEvent.change(statusFilter, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 3 tests')).toBeInTheDocument();
    });
  });

  it('should filter by test type', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    render(<TestHistoryList userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Showing 3 of 3 tests')).toBeInTheDocument();
    });

    // Filter by full test
    const typeFilter = screen.getByLabelText('Test Type:');
    fireEvent.change(typeFilter, { target: { value: 'full' } });

    await waitFor(() => {
      expect(screen.getByText('Showing 1 of 3 tests')).toBeInTheDocument();
    });
  });

  it('should sort by date', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    render(<TestHistoryList userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Showing 3 of 3 tests')).toBeInTheDocument();
    });

    // Click date header to sort
    const dateHeader = screen.getByText(/Date/);
    fireEvent.click(dateHeader);

    // Verify sort indicator changed
    expect(dateHeader.textContent).toContain('↑');
  });

  it('should handle empty history', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<TestHistoryList userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('No test history found')).toBeInTheDocument();
    });
  });

  it('should handle fetch error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    render(<TestHistoryList userId={mockUserId} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error loading test history/)
      ).toBeInTheDocument();
    });
  });

  it('should call onSelectTest when view button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    const onSelectTest = vi.fn();
    render(<TestHistoryList userId={mockUserId} onSelectTest={onSelectTest} />);

    await waitFor(() => {
      expect(screen.getByText('Showing 3 of 3 tests')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[0]);

    expect(onSelectTest).toHaveBeenCalledWith('session-1');
  });

  it('should disable view button for active sessions', async () => {
    const historyWithActive = [
      ...mockHistory,
      {
        id: 'session-4',
        userId: mockUserId,
        testType: 'full',
        status: 'active',
        startedAt: '2024-01-20T10:00:00Z',
        totalQuestions: 120,
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => historyWithActive,
    });

    render(<TestHistoryList userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Showing 4 of 4 tests')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View Details');
    const disabledButtons = viewButtons.filter(btn =>
      btn.hasAttribute('disabled')
    );
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('should refresh history when refresh button is clicked', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [...mockHistory, mockHistory[0]],
      });

    render(<TestHistoryList userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Showing 3 of 3 tests')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('Showing 4 of 4 tests')).toBeInTheDocument();
    });
  });
});
