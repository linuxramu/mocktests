import React, { useState } from 'react';
import { TestSession } from '@eamcet-platform/shared';
import './DataExport.css';

interface DataExportProps {
  userId: string;
}

type ExportFormat = 'json' | 'csv';
type ExportScope = 'all' | 'completed' | 'recent';

export const DataExport: React.FC<DataExportProps> = ({ userId }) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [scope, setScope] = useState<ExportScope>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchHistoryData = async (): Promise<TestSession[]> => {
    const response = await fetch(
      `${import.meta.env.VITE_TEST_ENGINE_URL}/tests/history?userId=${userId}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch test history');
    }

    return await response.json();
  };

  const filterData = (data: TestSession[]): TestSession[] => {
    switch (scope) {
      case 'completed':
        return data.filter(session => session.status === 'completed');
      case 'recent':
        // Get last 10 tests
        return data.slice(0, 10);
      case 'all':
      default:
        return data;
    }
  };

  const exportToJSON = (data: TestSession[]) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (data: TestSession[]) => {
    // CSV headers
    const headers = [
      'Test ID',
      'Date',
      'Test Type',
      'Status',
      'Total Questions',
      'Duration (seconds)',
      'Completed At',
    ];

    // Convert data to CSV rows
    const rows = data.map(session => [
      session.id,
      new Date(session.startedAt).toISOString(),
      session.testType,
      session.status,
      session.totalQuestions.toString(),
      session.durationSeconds?.toString() || '',
      session.completedAt ? new Date(session.completedAt).toISOString() : '',
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Fetch data
      const data = await fetchHistoryData();

      // Filter based on scope
      const filteredData = filterData(data);

      if (filteredData.length === 0) {
        setError('No data to export');
        return;
      }

      // Export based on format
      if (format === 'json') {
        exportToJSON(filteredData);
      } else {
        exportToCSV(filteredData);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-export">
      <h3>Export Test History</h3>

      <div className="export-options">
        <div className="option-group">
          <label>Export Format:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="json"
                checked={format === 'json'}
                onChange={e => setFormat(e.target.value as ExportFormat)}
              />
              JSON
            </label>
            <label>
              <input
                type="radio"
                value="csv"
                checked={format === 'csv'}
                onChange={e => setFormat(e.target.value as ExportFormat)}
              />
              CSV
            </label>
          </div>
        </div>

        <div className="option-group">
          <label>Export Scope:</label>
          <select
            value={scope}
            onChange={e => setScope(e.target.value as ExportScope)}
          >
            <option value="all">All Tests</option>
            <option value="completed">Completed Tests Only</option>
            <option value="recent">Recent 10 Tests</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={loading}
        className="export-button"
      >
        {loading ? 'Exporting...' : 'Export Data'}
      </button>

      {error && <div className="export-error">{error}</div>}
      {success && (
        <div className="export-success">Data exported successfully!</div>
      )}

      <div className="export-info">
        <h4>Export Information:</h4>
        <ul>
          <li>
            <strong>JSON:</strong> Complete data with all fields, suitable for
            backup and data analysis
          </li>
          <li>
            <strong>CSV:</strong> Tabular format, suitable for spreadsheet
            applications
          </li>
          <li>Data includes test sessions, dates, scores, and durations</li>
          <li>
            Personal information is included - handle exported data securely
          </li>
        </ul>
      </div>
    </div>
  );
};
