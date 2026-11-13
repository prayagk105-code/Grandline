import React from 'react';

export const LoadingSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="cd" aria-busy="true" aria-label="Loading">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="skel"
        style={{ height: i === 0 ? 22 : 16, width: i === lines - 1 ? '65%' : '100%', marginBottom: i === lines - 1 ? 0 : 10 }}
      />
    ))}
  </div>
);

export const EmptyState: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({
  title,
  description,
  action
}) => (
  <div className="cd" style={{ textAlign: 'center', padding: '26px 18px' }}>
    <b className="d" style={{ fontSize: 17 }}>{title}</b>
    <p className="mut" style={{ margin: '6px 0 14px' }}>{description}</p>
    {action}
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="cd" role="alert">
    <b className="d" style={{ color: 'var(--hot)', fontSize: 16 }}>Unable to load</b>
    <p className="mut" style={{ margin: '6px 0 12px' }}>{message}</p>
    {onRetry ? (
      <button type="button" className="btn" onClick={onRetry}>
        Try again
      </button>
    ) : null}
  </div>
);

