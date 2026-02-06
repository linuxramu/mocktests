import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock fetch
global.fetch = vi.fn();

const ProtectedComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

const renderAuthGuard = (isAuthenticated: boolean) => {
  // Mock localStorage based on authentication state
  if (isAuthenticated) {
    localStorage.setItem('accessToken', 'mock-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
      })
    );
  } else {
    localStorage.clear();
  }

  return render(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginComponent />} />
          <Route
            path="/protected"
            element={
              <AuthGuard>
                <ProtectedComponent />
              </AuthGuard>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Set initial route to protected
    window.history.pushState({}, '', '/protected');
  });

  it('renders protected content when authenticated', () => {
    renderAuthGuard(true);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    renderAuthGuard(false);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    localStorage.clear();

    render(
      <BrowserRouter>
        <AuthProvider>
          <AuthGuard>
            <ProtectedComponent />
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    );

    // During initial load, should show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
