import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TestHistoryList } from '../components/history/TestHistoryList';
import { TestReview } from '../components/history/TestReview';
import { DataExport } from '../components/history/DataExport';
import './History.css';

type ViewMode = 'list' | 'review' | 'export';

export const History: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  if (!user) {
    return (
      <div className="history-page">Please log in to view test history</div>
    );
  }

  const handleSelectTest = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setViewMode('review');
  };

  const handleCloseReview = () => {
    setSelectedSessionId(null);
    setViewMode('list');
  };

  return (
    <div className="history-page">
      <div className="history-navigation">
        <button
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => setViewMode('list')}
        >
          Test History
        </button>
        <button
          className={viewMode === 'export' ? 'active' : ''}
          onClick={() => setViewMode('export')}
        >
          Export Data
        </button>
      </div>

      <div className="history-content">
        {viewMode === 'list' && (
          <TestHistoryList userId={user.id} onSelectTest={handleSelectTest} />
        )}

        {viewMode === 'review' && selectedSessionId && (
          <TestReview
            sessionId={selectedSessionId}
            onClose={handleCloseReview}
          />
        )}

        {viewMode === 'export' && <DataExport userId={user.id} />}
      </div>
    </div>
  );
};
