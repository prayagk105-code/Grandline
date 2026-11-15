import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { authService } from '../../services/authService';
import { parseApiError } from '../../services/api/apiError';
import { useToast } from '../../contexts/ToastContext';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  token: z.string().trim().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Za-z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number')
});

type FormValues = z.infer<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: params.get('email') || '',
      token: params.get('token') || '',
      newPassword: ''
    }
  });

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    try {
      await authService.resetPassword(values);
      showToast('Password updated successfully. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setApiError(parseApiError(err).message);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-header">
        <h1 className="auth-form-title">Choose a new password</h1>
        <p className="auth-form-desc">
          Your reset token can only be used once. Choose a strong new password.
        </p>
      </div>

      {apiError ? (
        <div className="alert-err" role="alert" style={{ marginBottom: 16 }}>
          {apiError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-field">
          <label htmlFor="rp-email" className="auth-label">
            Email
          </label>
          <div className="auth-input-wrapper">
            <input
              id="rp-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className="auth-input"
              {...register('email')}
            />
          </div>
          {errors.email ? <div className="auth-field-error">{errors.email.message}</div> : null}
        </div>

        <div className="auth-field">
          <label htmlFor="rp-token" className="auth-label">
            Reset token
          </label>
          <div className="auth-input-wrapper">
            <input
              id="rp-token"
              type="text"
              placeholder="Paste your reset token"
              className="auth-input"
              {...register('token')}
            />
          </div>
          {errors.token ? <div className="auth-field-error">{errors.token.message}</div> : null}
        </div>

        <div className="auth-field">
          <label htmlFor="rp-password" className="auth-label">
            New password
          </label>
          <div className="auth-input-wrapper">
            <input
              id="rp-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8+ characters with a letter and number"
              className="auth-input has-toggle"
              {...register('newPassword')}
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
          {errors.newPassword ? <div className="auth-field-error">{errors.newPassword.message}</div> : null}
        </div>

        <button type="submit" className="auth-btn-primary" disabled={isSubmitting} style={{ marginTop: 8 }}>
          {isSubmitting ? 'Updating password…' : 'Update Password'}
        </button>
      </form>

      <div className="auth-footer">
        <Link to="/login" className="auth-link-bold">
          ← Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
