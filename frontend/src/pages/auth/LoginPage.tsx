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

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof schema>;

const loginFeatures = [
  { icon: 'habit', label: 'Habits', desc: 'Build daily consistency & streaks' },
  { icon: 'book', label: 'Study', desc: 'Focus sessions & learning logs' },
  { icon: 'cal', label: 'Planner', desc: 'Tasks & milestone roadmap' },
  { icon: 'chart', label: 'Progress', desc: 'Visual analytics & reflections' }
];

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('grandline_remember_me') === 'true';
  });

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    if (rememberMe) {
      const savedEmail = localStorage.getItem('grandline_remember_email');
      if (savedEmail) {
        setValue('email', savedEmail, { shouldValidate: true });
      }
    }
  }, [rememberMe, setValue]);

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setApiError(null);
  };

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
      await login(values);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setApiError(parseApiError(err, 'Invalid email or password.').message);
    }
  };

  const handleGoogleLogin = () => {
    showToast('Google Sign-In is not configured for this environment. Please sign in with email or use Demo Login.');
  };

  const handleDemoLogin = async () => {
    setApiError(null);
    setDemoBusy(true);
    try {
      await demoLogin();
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(parseApiError(err, 'Demo login is unavailable.').message);
    } finally {
      setDemoBusy(false);
    }
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
        {/* Email input */}
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

        {/* Password input with show/hide control */}
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
          disabled={isSubmitting || demoBusy}
          aria-label="Sign in"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Simple OR divider */}
      <AuthDivider text="OR" />

      {/* Continue with Google Secondary Button */}
      <button
        type="button"
        className="auth-btn-google"
        onClick={handleGoogleLogin}
        disabled={isSubmitting || demoBusy}
      >
        <GoogleIcon size={18} />
        <span>Continue with Google</span>
      </button>

      {/* Footer: New to Grandline? Create account */}
      <div className="auth-footer">
        <span>New to Grandline?</span>
        <Link to="/register" className="auth-link-bold">
          Create account
        </Link>
      </div>

      {/* Developer Demo & Instant Access Section */}
      <div className="auth-demo-box">
        <p className="auth-demo-title">Quick autofill demo accounts:</p>
        <div className="auth-demo-grid">
          <button
            type="button"
            className="auth-demo-btn"
            onClick={() => fillCredentials('tracker@grandline.com', 'Tracker@123')}
          >
            👤 tracker@grandline.com
          </button>
          <button
            type="button"
            className="auth-demo-btn"
            onClick={() => fillCredentials('user@grandline.com', 'Password@123')}
          >
            👤 user@grandline.com
          </button>
        </div>
        <button
          type="button"
          className="auth-demo-btn"
          style={{ width: '100%' }}
          onClick={() => fillCredentials('Prayagk@gmail.com', 'Prayagk@123')}
        >
          👤 Prayagk@gmail.com
        </button>

        <button
          type="button"
          className="auth-instant-demo-btn"
          onClick={handleDemoLogin}
          disabled={isSubmitting || demoBusy}
        >
          {demoBusy ? 'Loading demo account…' : '⚡ 1-Click Instant Demo Login'}
        </button>
      </div>
    </AuthLayout>
  );
};
