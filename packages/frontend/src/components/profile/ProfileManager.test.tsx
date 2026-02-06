import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProfileManager } from './ProfileManager';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock fetch
global.fetch = vi.fn();

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true,
  profileData: {
    targetScore: 150,
    preferredSubjects: ['Physics', 'Mathematics'],
    studyGoals: ['Improve speed'],
    timeZone: 'Asia/Kolkata',
  },
};

const renderProfileManager = () => {
  localStorage.setItem('accessToken', 'mock-token');
  localStorage.setItem('user', JSON.stringify(mockUser));

  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProfileManager />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProfileManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders profile form with user data', async () => {
    renderProfileManager();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('150')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Asia/Kolkata')).toBeInTheDocument();
    });
  });

  it('displays email as disabled field', async () => {
    renderProfileManager();

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue('test@example.com');
      expect(emailInput).toBeDisabled();
    });
  });

  it('validates name length', async () => {
    renderProfileManager();

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'A' } });
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Name must be at least 2 characters long')
      ).toBeInTheDocument();
    });
  });

  it('updates profile successfully', async () => {
    const mockResponse = {
      user: {
        ...mockUser,
        name: 'Updated Name',
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    renderProfileManager();

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Profile updated successfully!')
      ).toBeInTheDocument();
    });
  });

  it('displays error on update failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: { message: 'Update failed' },
      }),
    });

    renderProfileManager();

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'New Name' } });
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('toggles subject preferences', async () => {
    renderProfileManager();

    await waitFor(() => {
      const physicsCheckbox = screen.getByLabelText(
        'Physics'
      ) as HTMLInputElement;
      expect(physicsCheckbox.checked).toBe(true);
    });

    const chemistryCheckbox = screen.getByLabelText(
      'Chemistry'
    ) as HTMLInputElement;
    expect(chemistryCheckbox.checked).toBe(false);

    fireEvent.click(chemistryCheckbox);
    expect(chemistryCheckbox.checked).toBe(true);
  });

  it('updates target score', async () => {
    renderProfileManager();

    await waitFor(() => {
      const targetScoreInput = screen.getByDisplayValue('150');
      fireEvent.change(targetScoreInput, { target: { value: '180' } });
      expect(screen.getByDisplayValue('180')).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    (global.fetch as any).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderProfileManager();

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'New Name' } });
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    expect(submitButton).toHaveTextContent('Saving...');
    expect(submitButton).toBeDisabled();
  });
});
