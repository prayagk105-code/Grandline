import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';
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

  const initialLimit = 2;
  const visibleHabits = expanded ? habits : habits.slice(0, initialLimit);
  const hasMore = habits.length > initialLimit;

  return (
    <div className="cd home-card-habits" style={{ borderLeft: '3px solid var(--mod-habits)', marginBottom: 16 }}>
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center', minWidth: 0, flex: 1 }}>
          <span className="mod-icon mod-icon-habits" style={{ flexShrink: 0 }}>
            <DayformIcon name="check" size={16} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="row" style={{ alignItems: 'center', gap: 6 }}>
              <b className="d" style={{ fontSize: 15 }}>Today's Habits</b>
              <span className="badge badge-habits badge-sm" style={{ fontWeight: 600 }}>
                {completionPct}%
              </span>
            </div>
            <div className="mut" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span>{completedCount} of {totalCount} habits done</span>
              {summary.nextIncompleteHabitName ? (
                <> · <span>Next: {summary.nextIncompleteHabitName}</span></>
              ) : null}
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 6, flexShrink: 0 }}>
          <Link to="/habits" className="btn sm" style={{ padding: '3px 8px', fontSize: 11 }}>
            + New
          </Link>
          <Link to="/habits" className="lk" style={{ fontSize: 12 }} title="Go to Habits page">
            Habits <DayformIcon name="right" size={13} />
          </Link>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div style={{ height: 4, width: '100%', borderRadius: 999, background: 'var(--sf)', overflow: 'hidden', marginBottom: 10 }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, completionPct))}%`,
            background: 'var(--mod-habits)',
            borderRadius: 999,
            transition: 'width 0.3s ease'
          }}
        />
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
              className="home-view-toggle-btn"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  <span>View Less</span>
                  <DayformIcon name="up" size={12} />
                </>
              ) : (
                <>
                  <span>View All ({habits.length})</span>
                  <DayformIcon name="down" size={12} />
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: '14px 0', textAlign: 'center' }}>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            No habits active for today.
          </p>
          <Link to="/habits" className="lk" style={{ fontSize: 12, marginTop: 4 }}>
            Create your first habit
          </Link>
        </div>
      )}
    </div>
  );
};
