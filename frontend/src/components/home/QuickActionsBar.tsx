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
      title: 'Capture thoughts, notes, and quick items'
    },
    {
      label: 'Start Focus',
      icon: 'play',
      onClick: () => navigate('/study?tab=focus'),
      title: 'Open Focus Timer and deep work session'
    },
    {
      label: 'Plan Day',
      icon: 'cal',
      onClick: () => navigate('/planner?tab=calendar'),
      title: 'View daily schedule and timeline'
    },
    {
      label: 'Daily Review',
      icon: 'pen',
      onClick: () => navigate('/journal'),
      title: 'Open daily evening reflection journal'
    },
    {
      label: 'New Goal',
      icon: 'star',
      onClick: () => navigate('/planner?tab=goals'),
      title: 'Create or review active goals'
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
          <span className="home-quick-icon">
            <DayformIcon name={act.icon} size={15} />
          </span>
          <span className="home-quick-label">{act.label}</span>
        </button>
      ))}
    </div>
  );
};

