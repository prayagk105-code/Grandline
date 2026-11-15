import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '../../layouts/AuthLayout';
import { authService } from '../../services/authService';
import { parseApiError } from '../../services/api/apiError';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address')
});

type FormValues = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    setResultMsg(null);
    setDevToken(null);
    try {
      const res = await authService.forgotPassword(values.email);
      setResultMsg(res.message);
      setSubmittedEmail(values.email);
      if (import.meta.env.DEV && res.developmentResetToken) {
        setDevToken(res.developmentResetToken);
      }
    } catch (err) {
      setApiError(parseApiError(err).message);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-header">
        <h1 className="auth-form-title">Reset password</h1>
        <p className="auth-form-desc">
          Enter your account email to receive a secure, single-use reset link.
        </p>
      </div>

      {apiError ? (
        <div className="alert-err" role="alert" style={{ marginBottom: 16 }}>
          {apiError}
        </div>
      ) : null}

      {resultMsg ? (
        <div className="alert-info" role="status" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, fontWeight: 500 }}>{resultMsg}</p>
          {devToken ? (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <span className="mut">Development test token:</span>
              <div style={{ marginTop: 4 }}>
                <Link
                  to={`/reset-password?email=${encodeURIComponent(submittedEmail)}&token=${encodeURIComponent(devToken)}`}
                  className="auth-link-bold"
                >
                  Continue to Reset Password →
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-field">
          <label htmlFor="fp-email" className="auth-label">
            Email
          </label>
          <div className="auth-input-wrapper">
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className="auth-input"
              {...register('email')}
            />
          </div>
          {errors.email ? <div className="auth-field-error">{errors.email.message}</div> : null}
        </div>

        <button type="submit" className="auth-btn-primary" disabled={isSubmitting} style={{ marginTop: 8 }}>
          {isSubmitting ? 'Sending instructions…' : 'Send Reset Instructions'}
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
