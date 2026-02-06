import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome back, {user?.name}!</p>
      <p>Dashboard content will be implemented in later tasks.</p>
    </div>
  );
};
