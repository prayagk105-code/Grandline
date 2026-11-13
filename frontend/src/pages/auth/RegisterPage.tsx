import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { parseApiError } from '../../services/api/apiError';

const schema = z.object({
  displayName: z.string().trim().min(1, 'Display name is required').max(100),
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Za-z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number')
});

type RegisterFormValues = z.infer<typeof schema>;

export const RegisterPage: React.FC = () => {
  const { verifyOtpAndRegister } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [pendingValues, setPendingValues] = useState<RegisterFormValues | null>(null);
  const [otpCode, setOtpCode] = useState('');

  const [resendTimer, setResendTimer] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: pendingValues || {
      displayName: '',
      email: '',
      password: ''
    }
  });

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const onFormSubmit = async (values: RegisterFormValues) => {
    setApiError(null);
    setSuccessNotice(null);
    setIsSendingOtp(true);

    try {
      await authService.sendOtp({
        email: values.email,
        displayName: values.displayName
      });

      setPendingValues(values);
      setResendTimer(60);
      setStep('otp');
      setOtpCode('');
      setSuccessNotice(`Verification code sent to ${values.email}`);
    } catch (err) {
      setApiError(parseApiError(err, 'Failed to send verification code.').message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingValues || resendTimer > 0 || isSendingOtp) return;
    setApiError(null);
    setIsSendingOtp(true);
    try {
      await authService.sendOtp({
        email: pendingValues.email,
        displayName: pendingValues.displayName
      });
      setResendTimer(60);
      setSuccessNotice('A new verification code has been sent to your email.');
    } catch (err) {
      setApiError(parseApiError(err, 'Could not resend verification code.').message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingValues) return;

    const trimmedOtp = otpCode.trim();
    if (trimmedOtp.length !== 6 || !/^\d{6}$/.test(trimmedOtp)) {
      setApiError('Please enter a valid 6-digit verification code.');
      return;
    }

    setApiError(null);
    setIsVerifying(true);

    try {
      const timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      await verifyOtpAndRegister({
        displayName: pendingValues.displayName,
        email: pendingValues.email,
        password: pendingValues.password,
        otp: trimmedOtp,
        timeZoneId
      });
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(parseApiError(err, 'Verification failed.').message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToForm = () => {
    setApiError(null);
    setSuccessNotice(null);
    setStep('form');
  };

  return (
    <AuthLayout>
      <h1>Build the days that build you.</h1>
      <p className="mut" style={{ margin: '0 0 14px' }}>
        Create your private DAYFORM workspace.
      </p>

      <div className="auth-tabs" role="tablist">
        <Link to="/login" className="auth-tab" role="tab" aria-selected="false">
          Sign In
        </Link>
        <Link to="/register" className="auth-tab active" role="tab" aria-selected="true">
          Create Account
        </Link>
      </div>

      {apiError ? (
        <div className="alert-err" role="alert">
          {apiError}
        </div>
      ) : null}

      {successNotice && !apiError && step === 'otp' ? (
        <div className="alert-info" role="status" style={{ marginBottom: 12 }}>
          {successNotice}
        </div>
      ) : null}

      {step === 'form' ? (
        <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
          <div className="f">
            <label htmlFor="reg-name">Your name</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Alex Morgan"
              {...register('displayName')}
            />
            {errors.displayName ? <div className="field-err">{errors.displayName.message}</div> : null}
          </div>

          <div className="f">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="name@gmail.com"
              {...register('email')}
            />
            {errors.email ? <div className="field-err">{errors.email.message}</div> : null}
          </div>

          <div className="f">
            <label htmlFor="reg-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="8+ characters with a letter and number"
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
                  color: 'var(--mut)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password ? <div className="field-err">{errors.password.message}</div> : null}
          </div>

          <button
            type="submit"
            className="btn pri f"
            disabled={isSendingOtp}
            aria-label="Create account"
          >
            {isSendingOtp ? 'Sending verification code…' : 'Continue & Send Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerifyOtp} noValidate>
          <div className="alert-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 600 }}>
              <Mail size={16} /> Check your inbox
            </div>
            <div>
              We sent a 6-digit code to <strong>{pendingValues?.email}</strong>.
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: 'var(--mut)' }}>
              From: <code>prayagk806@gmail.com</code>
            </div>
          </div>

          <div className="f">
            <label htmlFor="otp-input" style={{ textAlign: 'center', display: 'block' }}>
              Enter 6-digit verification code
            </label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="••••••"
              className="otp-field"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn pri f"
            disabled={isVerifying || otpCode.trim().length !== 6}
          >
            {isVerifying ? 'Verifying & creating account…' : 'Verify & Create Account'}
          </button>

          <div className="otp-actions">
            <button
              type="button"
              onClick={handleBackToForm}
              className="lk"
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <ArrowLeft size={14} /> Change details
            </button>

            {resendTimer > 0 ? (
              <span className="mut" style={{ fontSize: 13 }}>
                Resend in {resendTimer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSendingOtp}
                className="lk"
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <RefreshCw size={13} className={isSendingOtp ? 'spin' : ''} /> Resend code
              </button>
            )}
          </div>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: 18 }}>
        <Link to="/login" className="lk">
          Already have an account? Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
