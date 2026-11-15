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
    sendOtp: vi.fn(),
    verifyOtpAndRegister: vi.fn(),
    demoLogin: vi.fn(),
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
    vi.mocked(authService.refresh).mockResolvedValue(null);
  });

  it('redirects unauthenticated users to login page', async () => {
    renderApp('/');
    expect(await screen.findByText('Welcome back')).toBeInTheDocument();
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

  it('validates registration password strength', async () => {
    const user = userEvent.setup();
    renderApp('/register');

    await user.type(await screen.findByLabelText('Your name'), 'Alex');
    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('At least 8 characters')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('handles multi-step OTP registration and account creation', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.sendOtp).mockResolvedValue({
      message: 'Verification code sent',
      expiresAtUtc: new Date(Date.now() + 600000).toISOString(),
      developmentOtp: '123456'
    });
    vi.mocked(authService.verifyOtpAndRegister).mockResolvedValue({
      accessToken: 'token-abc',
      expiresAtUtc: new Date(Date.now() + 60000).toISOString(),
      user: {
        id: 'u-123',
        displayName: 'Prayag',
        email: 'prayag@example.com',
        themePreference: 'Auto',
        journeyStartDate: '2026-11-13',
        timeZoneId: 'UTC',
        isDemoUser: false,
        createdAtUtc: '2026-11-13T00:00:00Z'
      }
    });

    renderApp('/register');

    await user.type(await screen.findByLabelText('Your name'), 'Prayag');
    await user.type(screen.getByLabelText('Email'), 'prayag@example.com');
    await user.type(screen.getByLabelText('Password'), 'ValidPass123!');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(authService.sendOtp).toHaveBeenCalledWith({
      email: 'prayag@example.com',
      displayName: 'Prayag'
    });

    expect(await screen.findByText('Check your inbox')).toBeInTheDocument();
    expect(screen.getByText(/prayagk806@gmail.com/)).toBeInTheDocument();

    const otpInput = screen.getByLabelText('Enter 6-digit verification code');
    await user.type(otpInput, '123456');

    await user.click(screen.getByRole('button', { name: 'Verify & Create Account' }));

    expect(authService.verifyOtpAndRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Prayag',
        email: 'prayag@example.com',
        password: 'ValidPass123!',
        otp: '123456'
      })
    );
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

  it('renders all required Grandline Login UI elements including branding, Google button, and password toggle', async () => {
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

  it('renders all required Grandline Sign Up UI elements including confirm password and terms checkbox', async () => {
    const user = userEvent.setup();
    renderApp('/register');

    // Branding & headings
    expect(await screen.findByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByText('Get started with Grandline.')).toBeInTheDocument();
    expect(screen.getByText('Build Better Habits.')).toBeInTheDocument();
    expect(screen.getByText('Stay focused, organized and make progress daily.')).toBeInTheDocument();

    // Inputs
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /terms/i })).toBeInTheDocument();

    // Validate password mismatch
    await user.type(screen.getByLabelText('Full Name'), 'Alex Morgan');
    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.type(screen.getByLabelText('Confirm Password'), 'DifferentPass123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(authService.sendOtp).not.toHaveBeenCalled();

    // Secondary button & Footer
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});

