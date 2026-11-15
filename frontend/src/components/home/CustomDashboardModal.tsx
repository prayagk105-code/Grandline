import React from 'react';
import { DayformIcon } from '../common/DayformIcon';

export interface DashboardConfig {
  showDisciplineScore: boolean;
  showMissions: boolean;
  showPinnedTasks: boolean;
  showFocusTimer: boolean;
  showRandomMemory: boolean;
  showHabits: boolean;
  showStudy: boolean;
  showCheckIn: boolean;
  showPriorities: boolean;
  showGoals: boolean;
  showDailySummary: boolean;
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  showDisciplineScore: true,
  showMissions: true,
  showPinnedTasks: true,
  showFocusTimer: true,
  showRandomMemory: true,
  showHabits: true,
  showStudy: true,
  showCheckIn: true,
  showPriorities: true,
  showGoals: true,
  showDailySummary: true
};

interface CustomDashboardModalProps {
  config: DashboardConfig;
  onChange: (config: DashboardConfig) => void;
  onClose: () => void;
}

export const CustomDashboardModal: React.FC<CustomDashboardModalProps> = ({
  config,
  onChange,
  onClose
}) => {
  const toggleKey = (key: keyof DashboardConfig) => {
    onChange({
      ...config,
      [key]: !config[key]
    });
  };

  const WIDGETS: { key: keyof DashboardConfig; label: string; desc: string }[] = [
    { key: 'showPriorities', label: 'Today’s Priorities', desc: 'Top 3 urgent actions & upcoming deadlines' },
    { key: 'showCheckIn', label: 'Personal Check-in', desc: 'Daily mood, energy & stress tracking' },
    { key: 'showGoals', label: 'Goal Trajectory', desc: 'Active long-term goal overview' },
    { key: 'showDailySummary', label: 'Daily Accomplishments', desc: 'Summary of tasks, habits, and focus' },
    { key: 'showDisciplineScore', label: 'Discipline Score Card', desc: 'Mathematical consistency gauge (0-100)' },
    { key: 'showMissions', label: 'Daily Missions & Bounties', desc: 'Quick XP claim and daily goals' },
    { key: 'showFocusTimer', label: 'Focus Timer Card', desc: 'Pomodoro and deep work launcher' },
    { key: 'showRandomMemory', label: 'Memory Lane Card', desc: 'Past memories and reflections' },
    { key: 'showHabits', label: 'Habits Summary', desc: 'Daily habit check-in strip' },
    { key: 'showStudy', label: 'Active Study Path', desc: 'Learning journey progress' }
  ];

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Customize Dashboard</h3>
          <button type="button" className="ib" onClick={onClose}>
            <DayformIcon name="close" size={16} />
          </button>
        </div>

        <p className="mut" style={{ margin: '0 0 16px', fontSize: 13 }}>
          Toggle the visibility of widgets on your primary command center.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {WIDGETS.map((w) => (
            <div
              key={w.key}
              className="row"
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--sf)',
                borderRadius: 8
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{w.label}</div>
                <div className="mut" style={{ fontSize: 11 }}>{w.desc}</div>
              </div>
              <button
                type="button"
                className={`chip ${config[w.key] ? 'on' : ''}`}
                style={{ fontSize: 12, padding: '4px 10px', minWidth: 64, textAlign: 'center' }}
                onClick={() => toggleKey(w.key)}
              >
                {config[w.key] ? 'Visible' : 'Hidden'}
              </button>
            </div>
          ))}
        </div>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn pri" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

