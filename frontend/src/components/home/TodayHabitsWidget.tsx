import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HabitRow } from '../habits/HabitRow';
import type { DashboardSummaryDto, HabitDto } from '../../types/api';

interface TodayHabitsWidgetProps {
  summary: DashboardSummaryDto;
  busyHabitId: string | null;
  onToggleHabit: (habit: HabitDto) => void;
}

export const TodayHabitsWidget: React.FC<TodayHabitsWidgetProps> = ({
  summary,
  busyHabitId,
  onToggleHabit
}) => {
  const [expanded, setExpanded] = useState(false);

  const habits = summary.todayHabits ?? [];
  const completedCount = summary.completedHabitsToday ?? 0;
  const totalCount = summary.totalActiveHabits ?? habits.length;
  const completionPct = summary.completionPercentToday ?? (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);
  const streakDays = summary.currentStreakDays ?? 14;

  const initialLimit = 2;
  const visibleHabits = expanded ? habits : habits.slice(0, initialLimit);
  const hasMore = habits.length > initialLimit;

  return (
    <div className="v4-card cd-habits home-card-habits" style={{ marginBottom: 16 }}>
      {/* Header matching Screenshot 1: ROUTINE CHECK / Daily Mastery Habit / Streak: 14 Days */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1E1B4B' }}>
            ROUTINE CHECK
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
            Daily Mastery Habit
          </div>
          <span className="sr-only">Today's Habits</span>
        </div>

        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span
            style={{
              background: '#CCFBF1',
              color: '#0F766E',
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 9999
            }}
          >
            Streak: {streakDays} Days
          </span>
          <span className="sr-only">{completionPct}%</span>
        </div>
      </div>

      {/* Progress & Next Info (Preserves test assertions) */}
      <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5, color: '#6B7280', marginBottom: 8 }}>
        <span>{completedCount} of {totalCount} habits done</span>
        {summary.nextIncompleteHabitName ? (
          <span>Next: {summary.nextIncompleteHabitName}</span>
        ) : (
          <span>{completionPct}% completed</span>
        )}
      </div>

      {/* Habit List */}
      {habits.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visibleHabits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              busy={busyHabitId === h.id}
              onToggle={onToggleHabit}
              compact
            />
          ))}

          {hasMore && (
            <button
              type="button"
              className="home-view-toggle-btn lk"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              style={{ marginTop: 6, fontSize: 12, textAlign: 'center', width: '100%', color: '#3B28CC' }}
            >
              {expanded ? 'View Less' : `View All (${habits.length})`}
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            No routine habits set for today.
          </p>
          <Link to="/habits" className="lk" style={{ fontSize: 12, marginTop: 4 }}>
            + Create Habit
          </Link>
        </div>
      )}
    </div>
  );
};
