import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

// Mock fetch
global.fetch = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads user from localStorage on mount', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
    };

    localStorage.setItem('accessToken', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logs in user successfully', async () => {
    const mockResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toEqual(mockResponse.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
  });

  it('throws error on login failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { message: 'Invalid credentials' },
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      })
    ).rejects.toThrow('Invalid credentials');
  });

  it('registers user successfully', async () => {
    const mockResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: false,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register(
        'test@example.com',
        'Password123',
        'Test User'
      );
    });

    expect(result.current.user).toEqual(mockResponse.user);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logs out user', async () => {
    localStorage.setItem('accessToken', 'mock-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: '1', email: 'test@example.com' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('updates profile successfully', async () => {
    const initialUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
    };

    localStorage.setItem('accessToken', 'mock-token');
    localStorage.setItem('user', JSON.stringify(initialUser));

    const mockResponse = {
      user: {
        ...initialUser,
        name: 'Updated Name',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateProfile({ name: 'Updated Name' });
    });

    expect(result.current.user?.name).toBe('Updated Name');
  });

  it('refreshes access token', async () => {
    localStorage.setItem('accessToken', 'old-token');
    localStorage.setItem('refreshToken', 'refresh-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: '1', email: 'test@example.com' })
    );

    const mockResponse = {
      accessToken: 'new-access-token',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshAccessToken();
    });

    expect(result.current.accessToken).toBe('new-access-token');
    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
  });

  it('logs out on token refresh failure', async () => {
    localStorage.setItem('accessToken', 'old-token');
    localStorage.setItem('refreshToken', 'refresh-token');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: '1', email: 'test@example.com' })
    );

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });

    await expect(
      act(async () => {
        await result.current.refreshAccessToken();
      })
    ).rejects.toThrow('Token refresh failed');

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
