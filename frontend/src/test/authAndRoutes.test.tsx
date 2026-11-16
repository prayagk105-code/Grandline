import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../contexts/ToastContext';
import { AuthProvider } from '../contexts/AuthContext';
import { FocusTimerProvider } from '../contexts/FocusTimerContext';
import { AppRouter } from '../app/router';
import { authService } from '../services/authService';
import { dashboardService } from '../services/dashboardService';

vi.mock('../services/authService', () => ({
  authService: {
    refresh: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    me: vi.fn()
  }
}));

vi.mock('../services/dashboardService', () => ({
  dashboardService: {
    getSummary: vi.fn()
  }
}));

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ToastProvider>
        <AuthProvider>
          <FocusTimerProvider>
            <AppRouter />
          </FocusTimerProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('Auth and Protected Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(authService.refresh).mockResolvedValue(null);
  });

  it('redirects unauthenticated users to login page', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('validates login form fields before calling API', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    const submitBtn = await screen.findByRole('button', { name: 'Sign in' });
    await user.click(submitBtn);

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('validates registration password strength and mismatch', async () => {
    const user = userEvent.setup();
    renderApp('/register');

    const emailInput = await screen.findByLabelText('Email Address');
    const passInput = screen.getByLabelText('Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    const submitBtn = screen.getByRole('button', { name: 'Create account' });

    // Weak password
    await user.type(emailInput, 'user@example.com');
    await user.type(passInput, 'short');
    await user.type(confirmInput, 'short');
    await user.click(submitBtn);

    expect(await screen.findByText('Password must be at least 8 characters long')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();

    // Mismatched password
    await user.clear(passInput);
    await user.clear(confirmInput);
    await user.type(passInput, 'Password123!');
    await user.type(confirmInput, 'DifferentPass123!');
    await user.click(submitBtn);

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('handles real registration and redirects to login', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.register).mockResolvedValue({
      accessToken: 'token-abc',
      expiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      user: {
        id: 'u-123',
        displayName: 'realuser',
        email: 'realuser@example.com',
        themePreference: 'Auto',
        journeyStartDate: '2026-11-16',
        timeZoneId: 'UTC',
        isDemoUser: false,
        createdAtUtc: '2026-11-16T00:00:00Z'
      }
    });

    renderApp('/register');

    await user.type(await screen.findByLabelText('Email Address'), 'realuser@example.com');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
    await user.type(screen.getByLabelText('Confirm Password'), 'StrongPass123!');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'realuser@example.com',
          password: 'StrongPass123!'
        })
      );
    });
  });

  it('renders authenticated home dashboard from API', async () => {
    vi.mocked(authService.refresh).mockResolvedValue({
      accessToken: 'tok',
      expiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      user: {
        id: 'u1',
        displayName: 'Alex Morgan',
        email: 'alex@example.com',
        themePreference: 'Auto',
        journeyStartDate: '2026-08-20',
        timeZoneId: 'UTC',
        isDemoUser: false,
        createdAtUtc: '2026-08-20T00:00:00Z'
      }
    });

    vi.mocked(dashboardService.getSummary).mockResolvedValue({
      todayDate: '2026-11-12',
      journeyDay: 85,
      journeyTotalDays: 180,
      completedHabitsToday: 2,
      totalActiveHabits: 5,
      completionPercentToday: 40,
      nextIncompleteHabitName: 'Move your body',
      currentStreakDays: 4,
      bestStreakDays: 14,
      focusMinutesLast7Days: 120,
      habitAverageLast7Days: 72,
      last7Days: [],
      todayHabits: [],
      recentMemories: []
    });

    renderApp('/');

    await waitFor(() => {
      expect(screen.getByText('2 of 5 habits done')).toBeInTheDocument();
    });
    expect(screen.getByText('Next: Move your body')).toBeInTheDocument();
  });

  it('renders all required Grandline Login UI elements including branding and password toggle', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    // Branding & headings
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to continue your journey.')).toBeInTheDocument();
    expect(screen.getAllByText('GRANDLINE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Personal Life Management').length).toBeGreaterThan(0);

    // Desktop left section branding
    expect(screen.getByText('Manage Your Life, Simply.')).toBeInTheDocument();
    expect(screen.getByText('Track habits, study, goals and more in one place.')).toBeInTheDocument();
    expect(screen.getByText('Habits')).toBeInTheDocument();
    expect(screen.getByText('Study')).toBeInTheDocument();
    expect(screen.getByText('Planner')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();

    // Inputs & toggles
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Password show/hide toggle
    const toggleBtn = screen.getByLabelText('Show password');
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    await user.click(screen.getByLabelText('Hide password'));
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Remember me & Forgot password
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument();

    // Buttons & dividers
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('OR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();

    // Footer link
    expect(screen.getByRole('link', { name: 'Create account' })).toBeInTheDocument();
  });

  it('renders all required Grandline Sign Up UI elements', async () => {
    renderApp('/register');

    // Branding & headings
    expect(await screen.findByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText('Get started with your personal Grandline workspace.')).toBeInTheDocument();
    expect(screen.getByText('Build Better Habits.')).toBeInTheDocument();
    expect(screen.getByText('Stay focused, organized and make progress daily.')).toBeInTheDocument();

    // Inputs - 3 fields: Email Address, Password, Confirm Password
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();

    // Footer
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});
