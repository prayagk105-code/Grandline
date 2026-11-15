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
      className={`li ${compact ? 'li-compact' : ''}`}
      style={{
        opacity: habit.isActive ? 1 : 0.65,
        padding: compact ? '7px 9px' : '10px 0',
        borderRadius: compact ? 'var(--radius-md)' : undefined,
        background: compact ? 'var(--sf)' : undefined,
        border: compact ? '1px solid var(--ln)' : undefined,
        transition: 'background-color 0.15s ease',
        alignItems: 'center'
      }}
    >
      <span
        className="ic"
        style={{
          width: compact ? 30 : 36,
          height: compact ? 30 : 36,
          borderRadius: compact ? 'var(--radius-xs)' : 'var(--radius-sm)',
          background: habit.completedToday ? 'var(--badge-completed-bg)' : 'var(--cd)',
          color: habit.completedToday ? 'var(--badge-completed-text)' : 'var(--mod-habits)',
          border: compact ? '1px solid var(--ln)' : undefined,
          transition: 'all 0.15s ease',
          flexShrink: 0
        }}
      >
        <DayformIcon name={habit.icon} size={compact ? 14 : 17} />
      </span>

      <div className="g" style={{ minWidth: 0, flex: 1, gap: compact ? 2 : 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: compact ? 'nowrap' : 'wrap', minWidth: 0 }}>
          <b
            style={{
              fontSize: compact ? 13 : 13.5,
              fontWeight: 600,
              textDecoration: habit.completedToday ? 'line-through' : 'none',
              color: habit.completedToday ? 'var(--mut)' : 'var(--ink)',
              transition: 'color 0.15s ease',
              whiteSpace: compact ? 'nowrap' : 'normal',
              overflow: compact ? 'hidden' : 'visible',
              textOverflow: compact ? 'ellipsis' : 'clip'
            }}
          >
            {habit.name}
          </b>
          <span className={`badge ${getCategoryBadgeClass(habit.category)} badge-sm`} style={{ flexShrink: 0 }}>
            {habit.category}
          </span>
          {!habit.isActive && <span className="badge badge-archived badge-sm" style={{ flexShrink: 0 }}>Archived</span>}
        </div>
        {habit.target ? (
          <small
            style={{
              color: 'var(--mut)',
              fontSize: compact ? 11 : 11.5,
              whiteSpace: compact ? 'nowrap' : 'normal',
              overflow: compact ? 'hidden' : 'visible',
              textOverflow: compact ? 'ellipsis' : 'clip'
            }}
          >
            {habit.target}
          </small>
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
          style={compact ? { width: 30, height: 30 } : undefined}
          onClick={() => onToggle(habit)}
          disabled={busy || !habit.isActive}
          aria-label={`${habit.completedToday ? 'Uncheck' : 'Complete'} ${habit.name}`}
          aria-pressed={habit.completedToday}
          title={habit.completedToday ? 'Mark Incomplete' : 'Check In Today'}
        >
          <DayformIcon name="check" size={compact ? 14 : 16} />
        </button>
      </div>
    </div>
  );
};
