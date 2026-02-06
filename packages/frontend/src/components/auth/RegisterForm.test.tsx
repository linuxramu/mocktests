import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RegisterForm } from './RegisterForm';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch
global.fetch = vi.fn();

const renderRegisterForm = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders registration form with all fields', () => {
    renderRegisterForm();

    expect(
      screen.getByRole('heading', { name: 'Register' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /register/i })
    ).toBeInTheDocument();
  });

  it('validates empty fields', async () => {
    renderRegisterForm();

    const submitButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    });
  });

  it('validates invalid email format', async () => {
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
    });

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('validates short name', async () => {
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'A' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Name must be at least 2 characters long')
      ).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Pass1' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Pass1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 8 characters long')
      ).toBeInTheDocument();
    });
  });

  it('validates password requires uppercase', async () => {
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one uppercase letter')
      ).toBeInTheDocument();
    });
  });

  it('validates password requires lowercase', async () => {
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'PASSWORD123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'PASSWORD123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one lowercase letter')
      ).toBeInTheDocument();
    });
  });

  it('validates password requires number', async () => {
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one number')
      ).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
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

    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on registration failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { message: 'Email already exists' },
      }),
    });

    renderRegisterForm();

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'Password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });
});
