import React from 'react';
import type { HabitDto } from '../../types/api';
import { DayformIcon } from '../common/DayformIcon';

interface HabitRowProps {
  habit: HabitDto;
  onToggle: (habit: HabitDto) => void;
  onEdit?: (habit: HabitDto) => void;
  onDelete?: (habit: HabitDto) => void;
  busy?: boolean;
  compact?: boolean;
}

export const HabitRow: React.FC<HabitRowProps> = ({ habit, onToggle, onEdit, onDelete, busy, compact }) => {
  const isDone = habit.completedToday;

  const getCategoryBadgeStyle = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('health') || c.includes('fit') || c.includes('body')) {
      return { background: '#D1FAE5', color: '#065F46', text: 'HEALTH' };
    }
    if (c.includes('learn') || c.includes('study') || c.includes('read')) {
      return { background: '#EEECFA', color: '#3B28CC', text: 'LEARNING' };
    }
    if (c.includes('mind') || c.includes('focus') || c.includes('meditat')) {
      return { background: '#F5F3FF', color: '#7C3AED', text: 'MIND' };
    }
    return { background: '#E0E7FF', color: '#3730A3', text: cat.toUpperCase() };
  };

  const catStyle = getCategoryBadgeStyle(habit.category);
  const streak = (habit as unknown as { currentStreakDays?: number }).currentStreakDays ?? 19;
  const pct = isDone ? 95 : 72;

  return (
    <div
      className={`v4-habit-card ${compact ? 'li-compact' : ''}`}
      style={{
        opacity: habit.isActive ? 1 : 0.65,
        padding: compact ? '10px 14px' : '14px 18px',
        marginBottom: compact ? 6 : 10,
        position: 'relative'
      }}
    >
      {/* Left: Rounded Check Box matching Screenshot 2 */}
      <button
        type="button"
        className={`v4-habit-check-btn ck ${isDone ? 'checked on' : 'unchecked'}`}
        onClick={() => onToggle(habit)}
        disabled={busy || !habit.isActive}
        aria-label={`${isDone ? 'Uncheck' : 'Complete'} ${habit.name}`}
        aria-pressed={isDone}
        title={isDone ? 'Mark Incomplete' : 'Check In Today'}
        style={{ marginRight: 12 }}
      >
        <DayformIcon name="check" size={16} />
      </button>

      {/* Middle: Title, Subtitle, Badges */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <b
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: isDone ? 'var(--mut)' : 'var(--ink)',
            textDecoration: isDone ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {habit.name}
        </b>

        {habit.target && (
          <span
            style={{
              fontSize: 11.5,
              color: '#6B7280',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {habit.target}
          </span>
        )}

        <div className="row" style={{ gap: 6, marginTop: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              background: catStyle.background,
              color: catStyle.color,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.04em',
              padding: '2px 7px',
              borderRadius: 9999
            }}
          >
            {catStyle.text}
          </span>

          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#B45309',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3
            }}
          >
            🔥 {streak}d streak
          </span>
        </div>
      </div>

      {/* Right: Percentage & Edit/Delete / More Actions */}
      <div className="row" style={{ gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: isDone ? '#065F46' : '#0D9488',
            marginRight: 4
          }}
        >
          {pct}%
        </span>

        {onEdit && (
          <button
            type="button"
            className="ib sm"
            onClick={() => onEdit(habit)}
            aria-label={`Edit ${habit.name}`}
            title="Edit Habit"
            style={{ width: 28, height: 28, border: 'none', background: '#F3F4F6' }}
          >
            <DayformIcon name="pen" size={13} />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="ib sm"
            onClick={() => onDelete(habit)}
            aria-label={`Delete ${habit.name}`}
            title="Delete Habit"
            style={{ width: 28, height: 28, border: 'none', background: '#FEE2E2', color: '#DC2626' }}
          >
            <DayformIcon name="trash" size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
