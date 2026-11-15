import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';
import { AuthDivider, AuthLayout, GoogleIcon } from '../../layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { parseApiError } from '../../services/api/apiError';

const schema = z
  .object({
    displayName: z.string().trim().min(1, 'Full name is required').max(100),
    email: z.string().trim().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain at least one letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().optional(),
    agreeTerms: z.boolean().optional()
  })
  .refine(
    (data) => {
      if (data.confirmPassword && data.confirmPassword.length > 0 && data.password !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }
  );

type RegisterFormValues = z.infer<typeof schema>;

const registerFeatures = [
  { icon: 'habit', label: 'Habits', desc: 'Build daily consistency & streaks' },
  { icon: 'book', label: 'Study', desc: 'Deep focus sessions & logs' },
  { icon: 'cal', label: 'Planner', desc: 'Structured tasks & goal roadmaps' },
  { icon: 'chart', label: 'Progress', desc: 'Life insights & visual analytics' }
];

export const RegisterPage: React.FC = () => {
  const { verifyOtpAndRegister } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    defaultValues: {
      displayName: pendingValues?.displayName ?? '',
      email: pendingValues?.email ?? '',
      password: pendingValues?.password ?? '',
      confirmPassword: '',
      agreeTerms: true
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

  const handleGoogleRegister = () => {
    showToast('Google Sign-In is not configured for this environment. Please register using email or use Demo Login.');
  };

  return (
    <AuthLayout
      heroHeading="Build Better Habits."
      heroDescription="Stay focused, organized and make progress daily."
      features={registerFeatures}
    >
      <div className="auth-form-header">
        <h1 className="auth-form-title">{step === 'form' ? 'Create account' : 'Verify your email'}</h1>
        <p className="auth-form-desc">
          {step === 'form' ? 'Get started with Grandline.' : 'Enter the 6-digit code sent to your email.'}
        </p>
      </div>

      {apiError ? (
        <div className="alert-err" role="alert" style={{ marginBottom: 16 }}>
          {apiError}
        </div>
      ) : null}

      {successNotice && !apiError && step === 'otp' ? (
        <div className="alert-info" role="status" style={{ marginBottom: 16 }}>
          {successNotice}
        </div>
      ) : null}

      {step === 'form' ? (
        <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
          {/* Full Name input */}
          <div className="auth-field">
            <label htmlFor="reg-name" className="auth-label">
              Full Name
            </label>
            <div className="auth-input-wrapper">
              <input
                id="reg-name"
                aria-label="Your name"
                type="text"
                autoComplete="name"
                placeholder="Alex Morgan"
                className="auth-input"
                {...register('displayName')}
              />
            </div>
            {errors.displayName ? <div className="auth-field-error">{errors.displayName.message}</div> : null}
          </div>

          {/* Email input */}
          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">
              Email
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

          {/* Password input with show/hide control */}
          <div className="auth-field">
            <label htmlFor="reg-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="8+ characters with a letter and number"
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

          {/* Confirm Password input with show/hide control */}
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

          {/* Terms and Privacy Policy checkbox */}
          <div className="auth-field" style={{ marginTop: 2, marginBottom: 20 }}>
            <label className="auth-checkbox-label">
              <input type="checkbox" defaultChecked {...register('agreeTerms')} />
              <span style={{ fontSize: 12.5, color: 'var(--mut)' }}>
                I agree to the <span style={{ color: 'var(--ink)' }}>Terms</span> and{' '}
                <span style={{ color: 'var(--ink)' }}>Privacy Policy</span>
              </span>
            </label>
          </div>

          {/* Create Account Primary Button */}
          <button
            type="submit"
            className="auth-btn-primary"
            disabled={isSendingOtp}
            aria-label="Create account"
          >
            {isSendingOtp ? 'Sending verification code…' : 'Create Account'}
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

          <div className="auth-field">
            <label htmlFor="otp-input" className="auth-label" style={{ textAlign: 'center', display: 'block' }}>
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
            className="auth-btn-primary"
            disabled={isVerifying || otpCode.trim().length !== 6}
            aria-label="Verify & Create Account"
          >
            {isVerifying ? 'Verifying & creating account…' : 'Verify & Create Account'}
          </button>

          <div className="otp-actions" style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={handleBackToForm}
              className="auth-link"
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
                className="auth-link"
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <RefreshCw size={13} className={isSendingOtp ? 'spin' : ''} /> Resend code
              </button>
            )}
          </div>
        </form>
      )}

      {/* Simple OR divider & Google Button (only on step form) */}
      {step === 'form' && (
        <>
          <AuthDivider text="OR" />

          {/* Continue with Google Secondary Button */}
          <button
            type="button"
            className="auth-btn-google"
            onClick={handleGoogleRegister}
            disabled={isSendingOtp}
          >
            <GoogleIcon size={18} />
            <span>Continue with Google</span>
          </button>
        </>
      )}

      {/* Footer: Already have an account? Sign in */}
      <div className="auth-footer">
        <span>Already have an account?</span>
        <Link to="/login" className="auth-link-bold">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
};
