import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
      showToast('Password updated. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setApiError(parseApiError(err).message);
    }
  };

  return (
    <AuthLayout>
      <h1>Choose a new password.</h1>
      <p className="mut" style={{ margin: '0 0 18px' }}>
        Your reset token can only be used once.
      </p>

      {apiError ? (
        <div className="alert-err" role="alert">
          {apiError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="f">
          <label htmlFor="rp-email">Email</label>
          <input id="rp-email" type="email" {...register('email')} />
          {errors.email ? <div className="field-err">{errors.email.message}</div> : null}
        </div>

        <div className="f">
          <label htmlFor="rp-token">Reset token</label>
          <input id="rp-token" type="text" {...register('token')} />
          {errors.token ? <div className="field-err">{errors.token.message}</div> : null}
        </div>

        <div className="f">
          <label htmlFor="rp-password">New password</label>
          <input id="rp-password" type="password" placeholder="8+ characters with a letter and number" {...register('newPassword')} />
          {errors.newPassword ? <div className="field-err">{errors.newPassword.message}</div> : null}
        </div>

        <button type="submit" className="btn pri f" disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Update password'}
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

