import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { AuthGuard } from './components/auth/AuthGuard';
import './App.css';

// Lazy load components for code splitting
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then(m => ({ default: m.Dashboard }))
);
const History = lazy(() =>
  import('./pages/History').then(m => ({ default: m.History }))
);
const LoginForm = lazy(() =>
  import('./components/auth/LoginForm').then(m => ({ default: m.LoginForm }))
);
const RegisterForm = lazy(() =>
  import('./components/auth/RegisterForm').then(m => ({
    default: m.RegisterForm,
  }))
);
const ProfileManager = lazy(() =>
  import('./components/profile/ProfileManager').then(m => ({
    default: m.ProfileManager,
  }))
);

// Loading fallback component
const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      fontSize: '1.2rem',
      color: '#666',
    }}
  >
    Loading...
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<LoginForm />} />
              <Route path="register" element={<RegisterForm />} />
              <Route
                path="dashboard"
                element={
                  <AuthGuard>
                    <Dashboard />
                  </AuthGuard>
                }
              />
              <Route
                path="profile"
                element={
                  <AuthGuard>
                    <ProfileManager />
                  </AuthGuard>
                }
              />
              <Route
                path="history"
                element={
                  <AuthGuard>
                    <History />
                  </AuthGuard>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
