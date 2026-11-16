import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { parseApiError } from '../../services/api/apiError';

const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const registerFeatures = [
  { icon: 'habit', label: 'Habits', desc: 'Build daily consistency & streaks' },
  { icon: 'book', label: 'Study', desc: 'Deep focus sessions & logs' },
  { icon: 'cal', label: 'Planner', desc: 'Structured tasks & goal roadmaps' },
  { icon: 'chart', label: 'Progress', desc: 'Life insights & visual analytics' }
];

export const RegisterPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError(null);
    try {
      const timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const displayName = values.email.split('@')[0];

      await authService.register({
        displayName,
        email: values.email.trim(),
        password: values.password,
        timeZoneId
      });

      showToast('Account created successfully! Please sign in with your email and password.', 'success');
      navigate('/login', {
        replace: true,
        state: { registeredEmail: values.email.trim() }
      });
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Failed to create account.');
      if (parsed.code === 'email_in_use' || parsed.message.toLowerCase().includes('already exists')) {
        setApiError('An account with this email address already exists. Please sign in or use another email.');
      } else {
        setApiError(parsed.message);
      }
    }
  };

  return (
    <AuthLayout
      heroHeading="Build Better Habits."
      heroDescription="Stay focused, organized and make progress daily."
      features={registerFeatures}
    >
      <div className="auth-form-header">
        <h1 className="auth-form-title">Create Account</h1>
        <p className="auth-form-desc">Get started with your personal Grandline workspace.</p>
      </div>

      {apiError ? (
        <div className="alert-err" role="alert" style={{ marginBottom: 16 }}>
          {apiError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* 1. Email Address Field */}
        <div className="auth-field">
          <label htmlFor="reg-email" className="auth-label">
            Email Address
          </label>
          <div className="auth-input-wrapper">
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className="auth-input"
              {...register('email')}
            />
          </div>
          {errors.email ? <div className="auth-field-error">{errors.email.message}</div> : null}
        </div>

        {/* 2. Password Field */}
        <div className="auth-field">
          <label htmlFor="reg-password" className="auth-label">
            Password
          </label>
          <div className="auth-input-wrapper">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8+ characters with a letter & number"
              className="auth-input has-toggle"
              {...register('password')}
            />
            <button
              type="button"
              className="auth-input-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password ? <div className="auth-field-error">{errors.password.message}</div> : null}
        </div>

        {/* 3. Confirm Password Field */}
        <div className="auth-field">
          <label htmlFor="reg-confirm-password" className="auth-label">
            Confirm Password
          </label>
          <div className="auth-input-wrapper">
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="auth-input has-toggle"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="auth-input-toggle"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword ? (
            <div className="auth-field-error">{errors.confirmPassword.message}</div>
          ) : null}
        </div>

        {/* Create Account Primary Button */}
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={isSubmitting}
          aria-label="Create account"
          style={{ marginTop: 8 }}
        >
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      {/* Footer: Already have an account? Sign in */}
      <div className="auth-footer" style={{ marginTop: 24 }}>
        <span>Already have an account?</span>
        <Link to="/login" className="auth-link-bold">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
