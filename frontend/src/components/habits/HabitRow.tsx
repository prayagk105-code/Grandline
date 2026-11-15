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
    if (c.includes('health')) return 'badge-health';
    if (c.includes('learn') || c.includes('study')) return 'badge-study';
    if (c.includes('mind') || c.includes('focus')) return 'badge-focus';
    if (c.includes('life') || c.includes('person')) return 'badge-personal';
    if (c.includes('finan') || c.includes('money')) return 'badge-finance';
    if (c.includes('goal')) return 'badge-goals';
    return 'badge-info';
  };

  return (
    <div className="li" style={{ opacity: habit.isActive ? 1 : 0.65 }}>
      <span className="ic">
        <DayformIcon name={habit.icon} />
      </span>
      <div className="g">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <b>{habit.name}</b>
          <span className={`badge ${getCategoryBadgeClass(habit.category)} badge-sm`}>
            {habit.category}
          </span>
          {!habit.isActive && <span className="badge badge-archived badge-sm">Archived</span>}
        </div>
        {habit.target ? <small>{habit.target}</small> : null}
      </div>
      {onEdit ? (
        <button type="button" className="ib sm" onClick={() => onEdit(habit)} aria-label={`Edit ${habit.name}`}>
          <DayformIcon name="pen" size={15} />
        </button>
      ) : null}
      {onDelete ? (
        <button type="button" className="ib sm" onClick={() => onDelete(habit)} aria-label={`Delete ${habit.name}`}>
          <DayformIcon name="trash" size={15} />
        </button>
      ) : null}
      <button
        type="button"
        className={`ck ${habit.completedToday ? 'on' : ''}`}
        onClick={() => onToggle(habit)}
        disabled={busy || !habit.isActive}
        aria-label={`${habit.completedToday ? 'Uncheck' : 'Complete'} ${habit.name}`}
        aria-pressed={habit.completedToday}
      >
        <DayformIcon name="check" size={16} />
      </button>
    </div>
  );
};
