import React from 'react';
import { DayformIcon } from '../components/common/DayformIcon';

export interface AuthFeature {
  icon: string;
  label: string;
  desc: string;
}

export interface AuthLayoutProps {
  children: React.ReactNode;
  heroHeading?: string;
  heroDescription?: string;
  features?: AuthFeature[];
}

export const GrandlineLogo: React.FC<{ size?: number; className?: string }> = ({ size = 38, className = '' }) => {
  return (
    <div className={`auth-branding-badge ${className}`.trim()} aria-label="Grandline — Personal Life Management">
      <div className="auth-brand-logo-box" style={{ width: size, height: size }} aria-hidden="true">
        <span>⚓</span>
      </div>
      <div className="auth-brand-info">
        <span className="auth-brand-name">GRANDLINE</span>
        <span className="auth-brand-sub">Personal Life Management</span>
      </div>
    </div>
  );
};

export const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthDivider: React.FC<{ text?: string }> = ({ text = 'OR' }) => (
  <div className="auth-divider" role="separator" aria-label={text}>
    <span>{text}</span>
  </div>
);

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  heroHeading,
  heroDescription,
  features
}) => {
  const isTwoCol = Boolean(heroHeading);

  return (
    <div className="auth-page-container">
      <div className={`auth-shell ${isTwoCol ? 'has-two-col' : 'is-single-col'}`}>
        {isTwoCol && (
          <aside className="auth-branding-col desktop-only" aria-label="Brand Overview">
            <GrandlineLogo size={42} />

            <div style={{ marginTop: 10 }}>
              <h2 className="auth-hero-heading">{heroHeading}</h2>
              {heroDescription && <p className="auth-hero-desc">{heroDescription}</p>}
            </div>

            {features && features.length > 0 && (
              <div className="auth-features-list">
                {features.map((feat) => (
                  <div key={feat.label} className="auth-feature-card">
                    <div className="auth-feature-icon">
                      <DayformIcon name={feat.icon} size={15} />
                    </div>
                    <div>
                      <span className="auth-feature-title">{feat.label}</span>
                      <span className="auth-feature-desc">{feat.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        <main className="auth-card-surface">
          {/* Mobile top branding (in required order: 1. Logo, 2. GRANDLINE, 3. Personal Life Management) */}
          <div className="auth-mobile-header">
            <GrandlineLogo size={36} />
          </div>

          {/* Centered logo for single-column views like ForgotPassword / ResetPassword on desktop */}
          {!isTwoCol && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <GrandlineLogo size={38} />
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};
