import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DataExport } from './DataExport';

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL and related functions
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('DataExport', () => {
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
    // Mock document.createElement and appendChild
    document.createElement = vi.fn(tag => {
      const element = {
        click: vi.fn(),
        href: '',
        download: '',
      };
      return element as any;
    });
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it('should render export options', () => {
    render(<DataExport userId={mockUserId} />);

    expect(screen.getByText('Export Test History')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Export Data')).toBeInTheDocument();
  });

  it('should export data as JSON', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    render(<DataExport userId={mockUserId} />);

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(
        screen.getByText('Data exported successfully!')
      ).toBeInTheDocument();
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should export data as CSV', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    render(<DataExport userId={mockUserId} />);

    // Select CSV format
    const csvRadio = screen.getByLabelText('CSV');
    fireEvent.click(csvRadio);

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(
        screen.getByText('Data exported successfully!')
      ).toBeInTheDocument();
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should filter by completed tests only', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    render(<DataExport userId={mockUserId} />);

    // Select completed only
    const scopeSelect = screen.getByLabelText('Export Scope:');
    fireEvent.change(scopeSelect, { target: { value: 'completed' } });

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(
        screen.getByText('Data exported successfully!')
      ).toBeInTheDocument();
    });
  });

  it('should filter by recent 10 tests', async () => {
    const manyTests = Array.from({ length: 20 }, (_, i) => ({
      id: `session-${i}`,
      userId: mockUserId,
      testType: 'full',
      status: 'completed',
      startedAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      completedAt: `2024-01-${String(i + 1).padStart(2, '0')}T13:00:00Z`,
      durationSeconds: 10800,
      totalQuestions: 120,
    }));

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => manyTests,
    });

    render(<DataExport userId={mockUserId} />);

    // Select recent 10
    const scopeSelect = screen.getByLabelText('Export Scope:');
    fireEvent.change(scopeSelect, { target: { value: 'recent' } });

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(
        screen.getByText('Data exported successfully!')
      ).toBeInTheDocument();
    });
  });

  it('should handle empty data', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<DataExport userId={mockUserId} />);

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('No data to export')).toBeInTheDocument();
    });
  });

  it('should handle fetch error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    render(<DataExport userId={mockUserId} />);

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText(/Export failed/)).toBeInTheDocument();
    });
  });

  it('should show loading state during export', async () => {
    (global.fetch as any).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockHistory,
              }),
            100
          )
        )
    );

    render(<DataExport userId={mockUserId} />);

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    expect(screen.getByText('Exporting...')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText('Data exported successfully!')
      ).toBeInTheDocument();
    });
  });

  it('should display export information', () => {
    render(<DataExport userId={mockUserId} />);

    expect(screen.getByText('Export Information:')).toBeInTheDocument();
    expect(
      screen.getByText(/Complete data with all fields/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Tabular format/)).toBeInTheDocument();
  });

  it('should allow switching between JSON and CSV formats', () => {
    render(<DataExport userId={mockUserId} />);

    const jsonRadio = screen.getByLabelText('JSON') as HTMLInputElement;
    const csvRadio = screen.getByLabelText('CSV') as HTMLInputElement;

    expect(jsonRadio.checked).toBe(true);
    expect(csvRadio.checked).toBe(false);

    fireEvent.click(csvRadio);

    expect(csvRadio.checked).toBe(true);
  });

  it('should clear success message after timeout', async () => {
    vi.useFakeTimers();

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory,
    });

    render(<DataExport userId={mockUserId} />);

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(
        screen.getByText('Data exported successfully!')
      ).toBeInTheDocument();
    });

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(
        screen.queryByText('Data exported successfully!')
      ).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
