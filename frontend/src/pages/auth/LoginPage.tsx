import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { parseApiError } from '../../services/api/apiError';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormValues = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  const showDemoOption = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'false';
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      await login(values);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setApiError(parseApiError(err, 'Invalid email or password.').message);
    }
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
    <AuthLayout>
      <h1>Build the days you want.</h1>
      <p className="mut" style={{ margin: '0 0 14px' }}>
        Habits, study, memories and reflection in one private place.
      </p>

      <div className="auth-tabs" role="tablist">
        <Link to="/login" className="auth-tab active" role="tab" aria-selected="true">
          Sign In
        </Link>
        <Link to="/register" className="auth-tab" role="tab" aria-selected="false">
          Create Account
        </Link>
      </div>

      {apiError ? (
        <div className="alert-err" role="alert">
          {apiError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="f">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <div className="field-err">{errors.email.message}</div> : null}
        </div>

        <div className="f">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="login-password">Password</label>
            <Link to="/forgot-password" className="lk" style={{ marginBottom: 5 }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              style={{ paddingRight: 42 }}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 32,
                height: 32,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 8,
                color: 'var(--mut)'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password ? <div className="field-err">{errors.password.message}</div> : null}
        </div>

        <button type="submit" className="btn pri f" disabled={isSubmitting || demoBusy}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <Link to="/register" className="lk">
          New here? Create account
        </Link>
      </div>

      {showDemoOption ? (
        <div style={{ marginTop: 14 }}>
          <button type="button" className="btn f" onClick={handleDemoLogin} disabled={isSubmitting || demoBusy}>
            {demoBusy ? 'Loading demo account…' : 'Continue with dev demo account'}
          </button>
          <p className="mut" style={{ fontSize: 11, textAlign: 'center', margin: '8px 0 0' }}>
            Dev demo login: <code>alex@example.com</code> / <code>DayformDemo123!</code>
          </p>
        </div>
      ) : null}
    </AuthLayout>
  );
};

