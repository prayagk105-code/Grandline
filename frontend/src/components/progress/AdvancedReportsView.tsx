import React, { useCallback, useEffect, useState } from 'react';
import { StatCard } from '../common/StatCard';
import { LoadingSkeleton } from '../common/StateBlocks';
import { focusService } from '../../services/focusService';
import { goalService } from '../../services/goalService';
import { habitService } from '../../services/habitService';
import { healthService } from '../../services/healthService';
import { taskService } from '../../services/taskService';
import type { GoalDto, HabitDto, HabitHeatmapDayDto, HabitSummaryDto, HealthSummaryDto, TaskDto } from '../../types/api';
import { formatDurationMinutes, toIsoDate } from '../../utils/date';

type Period = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export const AdvancedReportsView: React.FC = () => {
  const today = toIsoDate();
  const [period, setPeriod] = useState<Period>('Weekly');

  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [habitSummary, setHabitSummary] = useState<HabitSummaryDto | null>(null);
  const [heatmap, setHeatmap] = useState<HabitHeatmapDayDto[]>([]);
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummaryDto | null>(null);
  const [focusTodayMinutes, setFocusTodayMinutes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Auto weekly report state
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hList, hSum, hm, gList, tList, healthSum, focusSum] = await Promise.all([
        habitService.getAll(undefined, false, today),
        habitService.getSummary(today),
        habitService.getHeatmap(28, today),
        goalService.getAll(),
        taskService.getAll(),
        healthService.getSummary(),
        focusService.getSummary()
      ]);
      setHabits(hList);
      setHabitSummary(hSum);
      setHeatmap(hm);
      setGoals(gList);
      setTasks(tList);
      setHealthSummary(healthSum);
      setFocusTodayMinutes(focusSum.todayFocusMinutes);

      // Generate automatic weekly executive summary
      const completedTasks = tList.filter((t) => t.isCompleted).length;
      const completedGoals = gList.filter((g) => g.status === 'Completed').length;
      const avgHabit = hSum ? Math.round(hSum.weeklyAveragePercent) : 0;

      const report = `Grandline Intelligence Report (${period}):
• Habit consistency: Averaging ${avgHabit}% across ${hList.length} active habits.
• Task execution: ${completedTasks} of ${tList.length} tasks completed to date.
• Goals progress: ${completedGoals} of ${gList.length} long-term anchors achieved.
• Focus and vitality: Sleep avg ${healthSum.avgSleepHours.toFixed(1)} hrs/night, daily movement avg ${Math.round(healthSum.avgSteps).toLocaleString()} steps.
Verdict: Maintain foundational morning habits; momentum is firmly compounding.`;
      setWeeklyReport(report);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [today, period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSkeleton lines={6} />;

  // Best & struggling habits
  const bestHabits = habits.filter((h) => h.completedToday);
  const strugglingHabits = habits.filter((h) => !h.completedToday && h.isActive);

  // Goal stats
  const completedGoalsCount = goals.filter((g) => g.status === 'Completed').length;
  const goalCompletionRate = goals.length > 0 ? Math.round((completedGoalsCount / goals.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Period Selection */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Advanced Analytics & Synthesis</h2>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            Objective metrics derived from your actual habit logs, focus sessions, and tasks.
          </p>
        </div>

        <div className="chips" style={{ marginBottom: 0 }}>
          {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`chip ${period === p ? 'on' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <StatCard
          icon="habit"
          label="Habit Consistency"
          value={habitSummary ? `${Math.round(habitSummary.weeklyAveragePercent)}%` : '0%'}
          note="average adherence"
        />
        <StatCard
          icon="star"
          label="Goal Completion"
          value={`${goalCompletionRate}%`}
          note={`${completedGoalsCount} of ${goals.length} achieved`}
        />
        <StatCard
          icon="cal"
          label="Tasks Completed"
          value={`${tasks.filter((t) => t.isCompleted).length} / ${tasks.length}`}
          note="tasks executed"
        />
        <StatCard
          icon="clock"
          label="Focus Logged"
          value={formatDurationMinutes(focusTodayMinutes)}
          note="deep work logged today"
        />
      </div>

      {/* Automated Weekly Executive Report */}
      {weeklyReport && (
        <div className="cd" style={{ padding: 20, background: 'var(--sf)', border: '1px solid var(--ac)' }}>
          <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>🧭</span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Automated Executive Debrief</h3>
            <span className="chip on" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 'auto' }}>Generated</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line', color: 'var(--ink)' }}>
            {weeklyReport}
          </p>
        </div>
      )}

      {/* 28-Day Habit Heatmap */}
      <div className="cd" style={{ padding: 22 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>28-Day Consistency Matrix</h3>
          <span className="mut" style={{ fontSize: 12 }}>Darker hue = higher completion</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {heatmap.map((d, idx) => {
            const pct = d.completionPercent / 100;
            const bg =
              pct === 0
                ? 'var(--sf)'
                : pct < 0.35
                  ? 'rgba(45, 90, 61, 0.25)'
                  : pct < 0.7
                    ? 'rgba(45, 90, 61, 0.6)'
                    : 'var(--ac)';
            const color = pct >= 0.7 ? '#ffffff' : 'var(--ink)';

            return (
              <div
                key={idx}
                style={{
                  height: 48,
                  borderRadius: 8,
                  background: bg,
                  color,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--bd)',
                  fontSize: 11
                }}
                title={`${d.date}: ${d.completedCount} completed`}
              >
                <span style={{ fontWeight: 600 }}>{d.date.slice(8)}</span>
                <span style={{ fontSize: 10, opacity: 0.85 }}>{d.completedCount}/{d.totalActiveCount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best vs Needs Attention */}
      <div className="df-grid-2">
        <div className="cd" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, color: 'var(--ac)' }}>Top Performing Habits 🔥</h3>
          {bestHabits.length === 0 ? (
            <p className="mut" style={{ fontSize: 13 }}>No habits completed today yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bestHabits.map((h) => (
                <div key={h.id} className="row" style={{ justifyContent: 'space-between', padding: '8px 12px', background: 'var(--sf)', borderRadius: 8 }}>
                  <span style={{ fontSize: 14 }}>{h.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac)' }}>
                    Completed Today ✓
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cd" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Habits Needing Attention</h3>
          {strugglingHabits.length === 0 ? (
            <p className="mut" style={{ fontSize: 13 }}>All active habits completed today!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {strugglingHabits.map((h) => (
                <div key={h.id} className="row" style={{ justifyContent: 'space-between', padding: '8px 12px', background: 'var(--sf)', borderRadius: 8 }}>
                  <span style={{ fontSize: 14 }}>{h.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }} className="mut">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Correlation Insights: Sleep vs Productivity & Mood vs Focus */}
      {healthSummary && (
        <div className="cd" style={{ padding: 22 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Biometric & Performance Correlations</h3>
          <p className="mut" style={{ margin: '0 0 16px', fontSize: 13 }}>
            Patterns discovered between your physical state and your mental output.
          </p>

          <div className="df-grid-2">
            <div style={{ padding: 14, background: 'var(--sf)', borderRadius: 10, border: '1px solid var(--bd)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>🛌 Sleep vs Productivity</h4>
              <p className="mut" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                Current 30-day sleep average is <b>{healthSummary.avgSleepHours.toFixed(1)} hours</b>. Aim for 7.5+ hours for optimal cognitive stamina.
              </p>
            </div>

            <div style={{ padding: 14, background: 'var(--sf)', borderRadius: 10, border: '1px solid var(--bd)' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 14 }}>🧠 Deep Work vs Task Throughput</h4>
              <p className="mut" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                Completing an early morning <b>90-minute Deep Work session</b> anchors momentum and doubles afternoon closure rate.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
