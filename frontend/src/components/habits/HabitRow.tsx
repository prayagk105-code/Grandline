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
  return (
    <div className="li" style={{ opacity: habit.isActive ? 1 : 0.65 }}>
      <span className="ic">
        <DayformIcon name={habit.icon} />
      </span>
      <div className="g">
        <b>{habit.name}</b>
        <small>{habit.target || habit.category}{!habit.isActive ? ' · Archived' : ''}</small>
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

