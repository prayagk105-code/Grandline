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
      shortLabel: 'Quick Add',
      fullLabel: 'Quick Add',
      icon: 'plus',
      primary: true,
      onClick: onQuickAdd,
      title: 'Add Habit, Session, Task or Memory',
      color: '#3B28CC',
      bg: '#EEECFA'
    },
    {
      shortLabel: 'Focus',
      fullLabel: 'Start Focus',
      icon: 'zap',
      onClick: () => navigate('/study?tab=focus'),
      title: 'Open Focus Timer and deep work session',
      color: '#0D9488',
      bg: '#E6FFFA'
    },
    {
      shortLabel: 'Plan Day',
      fullLabel: 'Plan Day',
      icon: 'cal',
      onClick: () => navigate('/planner?tab=calendar'),
      title: 'View daily schedule and timeline',
      color: '#D97706',
      bg: '#FEF3C7'
    },
    {
      shortLabel: 'Review',
      fullLabel: 'Daily Review',
      icon: 'chart',
      onClick: () => navigate('/journal'),
      title: 'Open daily evening reflection journal',
      color: '#6366F1',
      bg: '#EEF2FF'
    },
    {
      shortLabel: 'Capture',
      fullLabel: 'Quick Capture',
      icon: 'pen',
      onClick: onQuickCapture,
      title: 'Capture thoughts, notes, and quick items',
      color: '#8B5CF6',
      bg: '#F5F3FF'
    },
    {
      shortLabel: 'New Goal',
      fullLabel: 'New Goal',
      icon: 'star',
      onClick: () => navigate('/planner?tab=goals'),
      title: 'Create or review active goals',
      color: '#10B981',
      bg: '#ECFDF5'
    }
  ];

  return (
    <div className="home-quick-actions-bar v4-quick-grid" aria-label="Quick actions">
      {actions.map((act) => (
        <button
          key={act.fullLabel}
          type="button"
          className={`v4-quick-card home-quick-btn ${act.primary ? 'home-quick-btn-pri' : ''}`}
          onClick={act.onClick}
          title={act.title}
        >
          <div
            className="v4-quick-icon-wrap"
            style={{ color: act.color, background: act.bg }}
          >
            <DayformIcon name={act.icon} size={18} />
          </div>
          <span className="v4-quick-label">{act.shortLabel}</span>
          {act.fullLabel !== act.shortLabel && (
            <span className="sr-only">{act.fullLabel}</span>
          )}
        </button>
      ))}
    </div>
  );
};
