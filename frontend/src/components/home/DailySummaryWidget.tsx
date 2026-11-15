import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { dashboardService } from '../../services/dashboardService';
import { taskService } from '../../services/taskService';
import { focusService } from '../../services/focusService';
import type { DashboardSummaryDto } from '../../types/api';
import { formatDurationMinutes, toIsoDate } from '../../utils/date';

export const DailySummaryWidget: React.FC = () => {
  const today = toIsoDate();
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [sum, tasks, focus] = await Promise.all([
        dashboardService.getSummary(today),
        taskService.getAll(),
        focusService.getSummary()
      ]);
      setSummary(sum);
      setCompletedTasksCount(tasks.filter((t) => t.isCompleted && t.dueDate === today).length);
      setTodayFocusMinutes(focus.todayFocusMinutes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
    const handleChanged = () => load();
    window.addEventListener('dayform:data-changed', handleChanged);
    return () => window.removeEventListener('dayform:data-changed', handleChanged);
  }, [load]);

  if (loading || !summary) return null;

  const habitsDone = summary.completedHabitsToday ?? 0;
  const habitsTotal = summary.totalActiveHabits ?? 0;
  const completionPct = summary.completionPercentToday ?? 0;

  return (
    <div className="cd" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <DayformIcon name="sun" size={17} />
          <b className="d" style={{ fontSize: 16 }}>Today's Accomplishments</b>
        </div>
        <span className="chip on" style={{ fontSize: 11, padding: '2px 8px' }}>
          {completionPct}% overall
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 8
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--sf)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ac)' }}>
            {habitsDone} / {habitsTotal}
          </div>
          <div className="mut" style={{ fontSize: 11 }}>Habits Logged</div>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--sf)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
            {completedTasksCount}
          </div>
          <div className="mut" style={{ fontSize: 11 }}>Tasks Done</div>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--sf)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
            {formatDurationMinutes(todayFocusMinutes)}
          </div>
          <div className="mut" style={{ fontSize: 11 }}>Focus Logged</div>
        </div>
      </div>
    </div>
  );
};

