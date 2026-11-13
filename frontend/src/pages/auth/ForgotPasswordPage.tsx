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
      <h1>Reset your password.</h1>
      <p className="mut" style={{ margin: '0 0 18px' }}>
        Enter your account email to request a single-use reset token.
      </p>

      {apiError ? (
        <div className="alert-err" role="alert">
          {apiError}
        </div>
      ) : null}

      {resultMsg ? (
        <div className="cd" style={{ background: 'var(--ac2)', borderColor: 'var(--ac)' }}>
          <p style={{ margin: 0 }}>{resultMsg}</p>
          {devToken ? (
            <div style={{ marginTop: 10 }}>
              <small className="mut">Development test token generated:</small>
              <div>
                <Link
                  to={`/reset-password?email=${encodeURIComponent(submittedEmail)}&token=${encodeURIComponent(devToken)}`}
                  className="lk"
                >
                  Continue to Reset Password
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="f">
          <label htmlFor="fp-email">Email</label>
          <input id="fp-email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <div className="field-err">{errors.email.message}</div> : null}
        </div>

        <button type="submit" className="btn pri f" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send reset instructions'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <Link to="/login" className="lk">
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

