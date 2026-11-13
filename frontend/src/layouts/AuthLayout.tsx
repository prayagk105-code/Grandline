import React from 'react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="auth-wrap">
      <div className="cd auth-card">
        <div className="df-logo">
          <b className="df-logo-mark">d</b>
          <span>DAYFORM</span>
        </div>
        {children}
      </div>
    </div>
  );
};

