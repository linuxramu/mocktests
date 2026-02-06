import React, { useState, useEffect } from 'react';
import { TestSession } from '@eamcet-platform/shared';
import './TestHistoryList.css';

interface TestHistoryListProps {
  userId: string;
  onSelectTest?: (sessionId: string) => void;
}

interface TestHistoryItem extends Omit<TestSession, 'configuration'> {
  score?: number;
  accuracy?: number;
}

type SortField = 'startedAt' | 'score' | 'accuracy' | 'testType';
type SortOrder = 'asc' | 'desc';

export const TestHistoryList: React.FC<TestHistoryListProps> = ({
  userId,
  onSelectTest,
}) => {
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('startedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTestType, setFilterTestType] = useState<string>('all');

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_TEST_ENGINE_URL}/tests/history?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch test history');
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedHistory = React.useMemo(() => {
    let filtered = [...history];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Apply test type filter
    if (filterTestType !== 'all') {
      filtered = filtered.filter(item => item.testType === filterTestType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'startedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [history, sortField, sortOrder, filterStatus, filterTestType]);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'status-completed',
      active: 'status-active',
      abandoned: 'status-abandoned',
    };
    return (
      <span
        className={`status-badge ${statusClasses[status as keyof typeof statusClasses] || ''}`}
      >
        {status}
      </span>
    );
  };

  const getTestTypeLabel = (testType: string) => {
    const labels = {
      full: 'Full Test',
      'subject-wise': 'Subject Test',
      custom: 'Custom Test',
    };
    return labels[testType as keyof typeof labels] || testType;
  };

  if (loading) {
    return <div className="history-loading">Loading test history...</div>;
  }

  if (error) {
    return (
      <div className="history-error">
        <p>Error loading test history: {error}</p>
        <button onClick={fetchHistory}>Retry</button>
      </div>
    );
  }

  return (
    <div className="test-history-list">
      <div className="history-header">
        <h2>Test History</h2>
        <button onClick={fetchHistory} className="refresh-button">
          Refresh
        </button>
      </div>

      <div className="history-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Test Type:</label>
          <select
            value={filterTestType}
            onChange={e => setFilterTestType(e.target.value)}
          >
            <option value="all">All</option>
            <option value="full">Full Test</option>
            <option value="subject-wise">Subject Test</option>
            <option value="custom">Custom Test</option>
          </select>
        </div>
      </div>

      {filteredAndSortedHistory.length === 0 ? (
        <div className="history-empty">
          <p>No test history found</p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('startedAt')}
                  className="sortable"
                >
                  Date{' '}
                  {sortField === 'startedAt' &&
                    (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('testType')} className="sortable">
                  Type{' '}
                  {sortField === 'testType' &&
                    (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Questions</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedHistory.map(item => (
                <tr key={item.id}>
                  <td>{formatDate(item.startedAt)}</td>
                  <td>{getTestTypeLabel(item.testType)}</td>
                  <td>{item.totalQuestions}</td>
                  <td>{formatDuration(item.durationSeconds)}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <button
                      onClick={() => onSelectTest?.(item.id)}
                      className="view-button"
                      disabled={item.status === 'active'}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="history-summary">
        <p>
          Showing {filteredAndSortedHistory.length} of {history.length} tests
        </p>
      </div>
    </div>
  );
};
