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

  const isDone = habit.completedToday;

  return (
    <div
      className={`li ${compact ? 'li-compact' : ''}`}
      style={{
        opacity: habit.isActive ? 1 : 0.65,
        padding: compact ? '8px 10px' : '11px 4px',
        borderRadius: compact ? 'var(--radius-md)' : undefined,
        background: compact ? (isDone ? 'var(--color-success-bg, #EAF5EE)' : 'var(--cd-sec)') : undefined,
        border: compact ? (isDone ? '1px solid var(--color-success-border, #C6E7D2)' : '1px solid var(--ln)') : undefined,
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        alignItems: 'center'
      }}
    >
      <span
        className="ic"
        style={{
          width: compact ? 30 : 36,
          height: compact ? 30 : 36,
          borderRadius: compact ? 'var(--radius-xs)' : 'var(--radius-sm)',
          background: isDone ? 'var(--color-success-bg, #EAF5EE)' : 'var(--cd-sec)',
          color: isDone ? 'var(--color-success, #287447)' : 'var(--mod-habits)',
          border: isDone ? '1px solid var(--color-success-border, #C6E7D2)' : '1px solid var(--ln)',
          transition: 'all 0.18s ease',
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
              textDecoration: isDone ? 'line-through' : 'none',
              color: isDone ? 'var(--mut)' : 'var(--ink)',
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
          {isDone ? (
            <span className="badge badge-completed badge-sm" style={{ flexShrink: 0 }}>
              Done ✓
            </span>
          ) : habit.isActive ? (
            <span className="badge badge-pending badge-sm" style={{ flexShrink: 0 }}>
              To Do
            </span>
          ) : (
            <span className="badge badge-archived badge-sm" style={{ flexShrink: 0 }}>
              Archived
            </span>
          )}
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
          className={`ck ${isDone ? 'on' : ''}`}
          style={compact ? { width: 30, height: 30 } : undefined}
          onClick={() => onToggle(habit)}
          disabled={busy || !habit.isActive}
          aria-label={`${isDone ? 'Uncheck' : 'Complete'} ${habit.name}`}
          aria-pressed={isDone}
          title={isDone ? 'Mark Incomplete' : 'Check In Today'}
        >
          <DayformIcon name="check" size={compact ? 14 : 16} />
        </button>
      </div>
    </div>
  );
};
