import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { dashboardService } from '../../services/dashboardService';
import { taskService } from '../../services/taskService';
import { focusService } from '../../services/focusService';
import { goalService } from '../../services/goalService';
import type { DashboardSummaryDto } from '../../types/api';
import { formatDurationMinutes, toIsoDate } from '../../utils/date';

export const DailySummaryWidget: React.FC = () => {
  const today = toIsoDate();
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [focusTargetMinutes, setFocusTargetMinutes] = useState(120);
  const [activeGoalsAvg, setActiveGoalsAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [sum, tasks, focus, goals] = await Promise.all([
        dashboardService.getSummary(today),
        taskService.getAll().catch(() => []),
        focusService.getSummary().catch(() => ({ todayFocusMinutes: 0, dailyTargetMinutes: 120 })),
        goalService.getAll().catch(() => [])
      ]);

      setSummary(sum);
      setCompletedTasksCount(tasks.filter((t) => t.isCompleted && t.dueDate === today).length);
      setTodayFocusMinutes(focus.todayFocusMinutes ?? 0);
      setFocusTargetMinutes(focus.dailyTargetMinutes || 120);

      const active = goals.filter((g) => g.status === 'Active');
      if (active.length > 0) {
        const avg = Math.round(active.reduce((s, g) => s + (g.progressPercentage || 0), 0) / active.length);
        setActiveGoalsAvg(avg);
      } else {
        setActiveGoalsAvg(0);
      }
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
  const habitPct = summary.completionPercentToday ?? 0;
  const focusPct = Math.min(100, Math.round((todayFocusMinutes / Math.max(1, focusTargetMinutes)) * 100));

  return (
    <div className="cd home-card-daily-progress">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className="mod-icon mod-icon-home">
            <DayformIcon name="chart" size={16} />
          </span>
          <div>
            <b className="d" style={{ fontSize: 16 }}>Daily Progress</b>
            <div className="mut" style={{ fontSize: 11 }}>Today’s execution velocity</div>
          </div>
        </div>

        <span className="badge badge-completed badge-sm">
          {habitPct}% Habits
        </span>
      </div>

      <div className="home-daily-progress-grid">
        {/* 1. Habits Completed */}
        <div className="home-stat-box">
          <div className="home-stat-top">
            <span className="home-stat-icon-tag" style={{ color: 'var(--mod-habits)', background: 'var(--mod-habits-soft)' }}>
              <DayformIcon name="habit" size={13} />
            </span>
            <span className="home-stat-val">{habitsDone}/{habitsTotal}</span>
          </div>
          <div className="home-stat-label">Habits Done</div>
          <div className="home-stat-bar-wrap">
            <div className="home-stat-bar" style={{ width: `${habitPct}%`, background: 'var(--mod-habits)' }} />
          </div>
        </div>

        {/* 2. Tasks Completed */}
        <div className="home-stat-box">
          <div className="home-stat-top">
            <span className="home-stat-icon-tag" style={{ color: 'var(--mod-planner)', background: 'var(--mod-planner-soft)' }}>
              <DayformIcon name="check" size={13} />
            </span>
            <span className="home-stat-val">{completedTasksCount}</span>
          </div>
          <div className="home-stat-label">Tasks Done</div>
          <div className="home-stat-sub">Due today</div>
        </div>

        {/* 3. Focus Time */}
        <div className="home-stat-box">
          <div className="home-stat-top">
            <span className="home-stat-icon-tag" style={{ color: 'var(--mod-focus)', background: 'var(--mod-focus-soft)' }}>
              <DayformIcon name="clock" size={13} />
            </span>
            <span className="home-stat-val">{formatDurationMinutes(todayFocusMinutes)}</span>
          </div>
          <div className="home-stat-label">Focus Logged</div>
          <div className="home-stat-bar-wrap">
            <div className="home-stat-bar" style={{ width: `${focusPct}%`, background: 'var(--mod-focus)' }} />
          </div>
        </div>

        {/* 4. Active Goal Progress */}
        <div className="home-stat-box">
          <div className="home-stat-top">
            <span className="home-stat-icon-tag" style={{ color: 'var(--mod-progress)', background: 'var(--mod-progress-soft)' }}>
              <DayformIcon name="star" size={13} />
            </span>
            <span className="home-stat-val">{activeGoalsAvg}%</span>
          </div>
          <div className="home-stat-label">Goal Trajectory</div>
          <div className="home-stat-bar-wrap">
            <div className="home-stat-bar" style={{ width: `${activeGoalsAvg}%`, background: 'var(--mod-progress)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
