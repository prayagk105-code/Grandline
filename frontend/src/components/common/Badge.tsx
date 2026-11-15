import React from 'react';

export type BadgeVariant =
  | 'streak'
  | 'completed'
  | 'pending'
  | 'overdue'
  | 'high'
  | 'medium'
  | 'low'
  | 'active'
  | 'archived'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'goals'
  | 'study'
  | 'finance'
  | 'health'
  | 'focus'
  | 'personal';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant | string;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  size = 'md',
  icon,
  className = '',
  style
}) => {
  const normVariant = (variant || 'info').toLowerCase().replace(/\s+/g, '-');
  
  // Mapping synonyms to standard tokens
  let classKey = normVariant;
  if (classKey === 'high-priority') classKey = 'high';
  if (classKey === 'medium-priority' || classKey === 'med') classKey = 'med';
  if (classKey === 'low-priority') classKey = 'low';
  if (classKey === 'medium') classKey = 'med';
  if (classKey === 'in-progress' || classKey === 'pending') classKey = 'pending';
  if (classKey === 'done' || classKey === 'complete') classKey = 'completed';

  const badgeClass = `badge badge-${classKey} badge-${size} ${className}`.trim();

  return (
    <span className={badgeClass} style={style}>
      {icon ? <span className="badge-icon">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
};

