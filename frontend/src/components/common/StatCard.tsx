import React from 'react';
import { DayformIcon } from './DayformIcon';

export interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  note?: string;
  accent?: 'orange' | 'green' | 'blue' | 'teal' | 'purple' | 'forest' | 'amber' | 'indigo' | 'rose' | 'sage';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  note,
  accent,
  onClick,
  className = ''
}) => {
  // Determine meaningful accent based on props or semantic detection
  const resolvedAccent = React.useMemo(() => {
    if (accent) return accent;
    const l = (label || '').toLowerCase();
    const ic = (icon || '').toLowerCase();
    if (l.includes('streak') || ic === 'flame') return 'orange';
    if (l.includes('done') || l.includes('complete') || l.includes('achiev')) return 'green';
    if (l.includes('focus') || l.includes('timer')) return 'purple';
    if (l.includes('study') || l.includes('hour') || ic === 'book') return 'blue';
    if (l.includes('expense') || l.includes('balance') || l.includes('saving') || ic === 'wallet') return 'teal';
    if (l.includes('goal') || l.includes('rate') || ic === 'chart') return 'forest';
    return undefined;
  }, [accent, label, icon]);

  const accentClass = resolvedAccent ? `st-accent-${resolvedAccent}` : '';

  return (
    <div
      className={`st ${accentClass} ${onClick ? 'st-interactive' : ''} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="l">
        <span className="st-icon-wrap">
          <DayformIcon name={icon} size={15} />
        </span>
        <span>{label}</span>
      </div>
      <div className="v">{value}</div>
      {note ? <small>{note}</small> : null}
    </div>
  );
};
