import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { AuthDivider, AuthLayout, GoogleIcon } from '../../layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const loginFeatures = [
  { icon: 'habit', label: 'Habits', desc: 'Build daily consistency & streaks' },
  { icon: 'book', label: 'Study', desc: 'Focus sessions & learning logs' },
  { icon: 'cal', label: 'Planner', desc: 'Tasks & milestone roadmap' },
  { icon: 'chart', label: 'Progress', desc: 'Visual analytics & reflections' }
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('grandline_remember_me') === 'true';
  });

  const locationState = location.state as { from?: { pathname?: string }; registeredEmail?: string } | null;
  const fromPath = locationState?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: locationState?.registeredEmail || '',
      password: ''
    }
  });

  useEffect(() => {
    if (locationState?.registeredEmail) {
      setValue('email', locationState.registeredEmail, { shouldValidate: true });
    } else if (rememberMe) {
      const savedEmail = localStorage.getItem('grandline_remember_email');
      if (savedEmail) {
        setValue('email', savedEmail, { shouldValidate: true });
      }
    }
  }, [locationState?.registeredEmail, rememberMe, setValue]);

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      if (rememberMe) {
        localStorage.setItem('grandline_remember_me', 'true');
        localStorage.setItem('grandline_remember_email', values.email);
      } else {
        localStorage.removeItem('grandline_remember_me');
        localStorage.removeItem('grandline_remember_email');
      }

      await login({
        email: values.email.trim(),
        password: values.password
      });

      navigate(fromPath, { replace: true });
    } catch (err: unknown) {
      const parsed = parseApiError(err, 'Invalid email or password.');
      setApiError(parsed.message || 'Invalid email or password. Please verify your credentials.');
    }
  };

  const handleGoogleLogin = () => {
    showToast('Google Sign-In is not configured for this environment. Please sign in with email.');
  };

  return (
    <AuthLayout
      heroHeading="Manage Your Life, Simply."
      heroDescription="Track habits, study, goals and more in one place."
      features={loginFeatures}
    >
      <div className="auth-form-header">
        <h1 className="auth-form-title">Welcome back</h1>
        <p className="auth-form-desc">Sign in to continue your journey.</p>
      </div>

      {apiError ? (
        <div className="alert-err" role="alert" style={{ marginBottom: 16 }}>
          {apiError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Email Field */}
        <div className="auth-field">
          <label htmlFor="login-email" className="auth-label">
            Email
          </label>
          <div className="auth-input-wrapper">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className="auth-input"
              {...register('email')}
            />
          </div>
          {errors.email ? <div className="auth-field-error">{errors.email.message}</div> : null}
        </div>

        {/* Password Field */}
        <div className="auth-field">
          <label htmlFor="login-password" className="auth-label">
            Password
          </label>
          <div className="auth-input-wrapper">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
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

        {/* Remember me & Forgot Password row */}
        <div className="auth-options-row">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <Link to="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>

        {/* Sign In Primary Button */}
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={isSubmitting}
          aria-label="Sign in"
          style={{ marginTop: 8 }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Simple OR divider */}
      <AuthDivider text="OR" />

      {/* Continue with Google Secondary Button */}
      <button
        type="button"
        className="auth-btn-google"
        onClick={handleGoogleLogin}
        disabled={isSubmitting}
      >
        <GoogleIcon size={18} />
        <span>Continue with Google</span>
      </button>

      {/* Footer: New to Grandline? Create account */}
      <div className="auth-footer" style={{ marginTop: 24 }}>
        <span>New to Grandline?</span>
        <Link to="/register" className="auth-link-bold">
          Create account
        </Link>
      </div>
    </AuthLayout>
  );
};
