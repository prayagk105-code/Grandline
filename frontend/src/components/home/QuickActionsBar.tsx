import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';

interface QuickActionsBarProps {
  onQuickAdd: () => void;
  onQuickCapture: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onQuickAdd,
  onQuickCapture
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Quick Add',
      icon: 'plus',
      primary: true,
      onClick: onQuickAdd,
      title: 'Add Habit, Session, Task or Memory'
    },
    {
      label: 'Quick Capture',
      icon: 'zap',
      onClick: onQuickCapture,
      title: 'Capture thoughts, notes, and quick items',
      color: 'var(--hot)',
      bg: 'var(--hot-soft)'
    },
    {
      label: 'Start Focus',
      icon: 'play',
      onClick: () => navigate('/study?tab=focus'),
      title: 'Open Focus Timer and deep work session',
      color: 'var(--mod-focus)',
      bg: 'var(--mod-focus-soft)'
    },
    {
      label: 'Plan Day',
      icon: 'cal',
      onClick: () => navigate('/planner?tab=calendar'),
      title: 'View daily schedule and timeline',
      color: 'var(--mod-planner)',
      bg: 'var(--mod-planner-soft)'
    },
    {
      label: 'Daily Review',
      icon: 'pen',
      onClick: () => navigate('/journal'),
      title: 'Open daily evening reflection journal',
      color: 'var(--mod-personal)',
      bg: 'var(--mod-personal-soft)'
    },
    {
      label: 'New Goal',
      icon: 'star',
      onClick: () => navigate('/planner?tab=goals'),
      title: 'Create or review active goals',
      color: 'var(--mod-progress)',
      bg: 'var(--mod-progress-soft)'
    }
  ];

  return (
    <div className="home-quick-actions-bar" aria-label="Quick actions">
      {actions.map((act) => (
        <button
          key={act.label}
          type="button"
          className={`home-quick-btn ${act.primary ? 'home-quick-btn-pri' : ''}`}
          onClick={act.onClick}
          title={act.title}
        >
          <span
            className="home-quick-icon"
            style={!act.primary && act.color ? { color: act.color, background: act.bg } : undefined}
          >
            <DayformIcon name={act.icon} size={13} />
          </span>
          <span className="home-quick-label">{act.label}</span>
        </button>
      ))}
    </div>
  );
};
