import React from 'react';
import type { HabitDto } from '../../types/api';
import { DayformIcon } from '../common/DayformIcon';

interface HabitRowProps {
  habit: HabitDto;
  onToggle: (habit: HabitDto) => void;
  onEdit?: (habit: HabitDto) => void;
  onDelete?: (habit: HabitDto) => void;
  busy?: boolean;
}

export const HabitRow: React.FC<HabitRowProps> = ({ habit, onToggle, onEdit, onDelete, busy }) => {
  const getCategoryBadgeClass = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('health') || c.includes('fit') || c.includes('body')) return 'badge-health';
    if (c.includes('learn') || c.includes('study') || c.includes('read')) return 'badge-study';
    if (c.includes('mind') || c.includes('focus') || c.includes('meditat')) return 'badge-focus';
    if (c.includes('life') || c.includes('person') || c.includes('routine')) return 'badge-personal';
    if (c.includes('finan') || c.includes('money') || c.includes('save')) return 'badge-balance';
    if (c.includes('goal')) return 'badge-goals';
    return 'badge-habits';
  };

  return (
    <div
      className="li"
      style={{
        opacity: habit.isActive ? 1 : 0.65,
        padding: '10px 0',
        transition: 'background-color 0.15s ease'
      }}
    >
      <span
        className="ic"
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-sm)',
          background: habit.completedToday ? 'var(--badge-completed-bg)' : 'var(--sf)',
          color: habit.completedToday ? 'var(--badge-completed-text)' : 'var(--mod-habits)',
          transition: 'all 0.15s ease'
        }}
      >
        <DayformIcon name={habit.icon} size={17} />
      </span>

      <div className="g" style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <b
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: habit.completedToday ? 'line-through' : 'none',
              color: habit.completedToday ? 'var(--mut)' : 'var(--ink)',
              transition: 'color 0.15s ease'
            }}
          >
            {habit.name}
          </b>
          <span className={`badge ${getCategoryBadgeClass(habit.category)} badge-sm`}>
            {habit.category}
          </span>
          {!habit.isActive && <span className="badge badge-archived badge-sm">Archived</span>}
        </div>
        {habit.target ? (
          <small style={{ color: 'var(--mut)', fontSize: 11.5 }}>{habit.target}</small>
        ) : null}
      </div>

      <div className="row" style={{ gap: 4, flexShrink: 0 }}>
        {onEdit ? (
          <button
            type="button"
            className="ib sm"
            onClick={() => onEdit(habit)}
            aria-label={`Edit ${habit.name}`}
            title="Edit Habit"
          >
            <DayformIcon name="pen" size={14} />
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            className="ib sm"
            onClick={() => onDelete(habit)}
            aria-label={`Delete ${habit.name}`}
            title="Delete Habit"
          >
            <DayformIcon name="trash" size={14} />
          </button>
        ) : null}

        <button
          type="button"
          className={`ck ${habit.completedToday ? 'on' : ''}`}
          onClick={() => onToggle(habit)}
          disabled={busy || !habit.isActive}
          aria-label={`${habit.completedToday ? 'Uncheck' : 'Complete'} ${habit.name}`}
          aria-pressed={habit.completedToday}
          title={habit.completedToday ? 'Mark Incomplete' : 'Check In Today'}
        >
          <DayformIcon name="check" size={16} />
        </button>
      </div>
    </div>
  );
};
