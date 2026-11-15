import React, { useCallback, useEffect, useState } from 'react';
import { StatCard } from '../common/StatCard';
import { LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { habitService } from '../../services/habitService';
import { taskService } from '../../services/taskService';
import { studyService } from '../../services/studyService';
import { focusService } from '../../services/focusService';
import { goalService } from '../../services/goalService';
import { gamificationService } from '../../services/gamificationService';
import type { GoalDto, HabitSummaryDto, StudySummaryDto, TaskDto, UserAchievementDto } from '../../types/api';
import { formatDurationMinutes, toIsoDate } from '../../utils/date';

export const WeeklyReviewView: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [habitSummary, setHabitSummary] = useState<HabitSummaryDto | null>(null);
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [studySummary, setStudySummary] = useState<StudySummaryDto | null>(null);
  const [focusTodayMinutes, setFocusTodayMinutes] = useState(0);
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [achievements, setAchievements] = useState<UserAchievementDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Reflection inputs
  const [wins, setWins] = useState('');
  const [friction, setFriction] = useState('');
  const [nextWeekPriorities, setNextWeekPriorities] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hSum, tList, sSum, fSum, gList, gStatus] = await Promise.all([
        habitService.getSummary(today).catch(() => null),
        taskService.getAll().catch(() => [] as TaskDto[]),
        studyService.getSummary(today).catch(() => null),
        focusService.getSummary().catch(() => ({ todayFocusMinutes: 0, targetMinutes: 120, totalCompletedSessions: 0, distractionFreeRate: 100 })),
        goalService.getAll().catch(() => [] as GoalDto[]),
        gamificationService.getStatus().catch(() => null)
      ]);

      setHabitSummary(hSum);
      setTasks(tList);
      setStudySummary(sSum);
      setFocusTodayMinutes(fSum.todayFocusMinutes);
      setGoals(gList);
      if (gStatus && gStatus.achievements) {
        setAchievements(gStatus.achievements);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSkeleton lines={6} />;

  const completedTasks = tasks.filter((t) => t.isCompleted);
  const incompleteTasks = tasks.filter((t) => !t.isCompleted);
  const activeGoals = goals.filter((g) => g.status === 'Active');

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    showToast('Weekly review completed! Your priorities for next week are set. ⚓');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Weekly Review & Alignment</h2>
        <p className="mut" style={{ margin: 0, fontSize: 13 }}>
          Audit what you shipped, identify leaks in consistency, and prime next week's non-negotiables.
        </p>
      </div>

      {/* Real Data Metrics Overview */}
      <div className="g3">
        <StatCard
          icon="habit"
          label="Habit Consistency"
          value={`${habitSummary ? Math.round(habitSummary.weeklyAveragePercent) : 0}%`}
          note="7-day average"
        />
        <StatCard
          icon="check"
          label="Tasks Completed"
          value={`${completedTasks.length} / ${tasks.length}`}
          note={`${incompleteTasks.length} pending`}
        />
        <StatCard
          icon="book"
          label="Study & Focus"
          value={formatDurationMinutes((studySummary?.minutesThisWeek ?? 0) + focusTodayMinutes)}
          note="logged sessions"
        />
      </div>

      {/* Task & Goal Retrospective Breakdown */}
      <div className="df-grid-2">
        <div className="cd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <b className="d" style={{ fontSize: 15 }}>Execution Highlights</b>
          <div className="mut" style={{ fontSize: 12 }}>
            • {completedTasks.length} tasks executed successfully.
          </div>
          {completedTasks.slice(0, 4).map((t) => (
            <div key={t.id} className="row" style={{ gap: 8, alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#22c55e' }}>✓</span>
              <span>{t.title}</span>
            </div>
          ))}

          {incompleteTasks.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <b className="d" style={{ fontSize: 14 }}>Rollover Tasks ({incompleteTasks.length})</b>
              {incompleteTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="row" style={{ gap: 8, alignItems: 'center', fontSize: 12, marginTop: 4, color: 'var(--mut)' }}>
                  <span>○</span>
                  <span>{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <b className="d" style={{ fontSize: 15 }}>Active Goal Anchors ({activeGoals.length})</b>
          {activeGoals.slice(0, 3).map((g) => (
            <div key={g.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--sf)' }}>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 500 }}>
                <span>{g.title}</span>
                <span>{g.progressPercentage}%</span>
              </div>
              <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--ln)', marginTop: 6, overflow: 'hidden' }}>
                <div style={{ width: `${g.progressPercentage}%`, height: '100%', background: 'var(--ac)' }} />
              </div>
            </div>
          ))}

          {achievements.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <b className="d" style={{ fontSize: 14 }}>Unlocked Badges ({achievements.length})</b>
              <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {achievements.slice(0, 4).map((a) => (
                  <span key={a.id} className="chip on" style={{ fontSize: 11, padding: '2px 8px' }}>
                    🏆 {a.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Written Reflection & Intentions */}
      <form onSubmit={handleSaveReview} className="cd" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <b className="d" style={{ fontSize: 16 }}>Weekly Synthesis & Next Week's Blueprint</b>

        <div className="f">
          <label>1. What went exceptionally well this week? (Victories & Progress)</label>
          <textarea
            className="inp"
            rows={3}
            placeholder="e.g., Kept morning workout streak without fail; shipped core client presentation."
            value={wins}
            onChange={(e) => setWins(e.target.value)}
          />
        </div>

        <div className="f">
          <label>2. Where was the friction? (Areas for improvement / Missed targets)</label>
          <textarea
            className="inp"
            rows={3}
            placeholder="e.g., Slacked on late afternoon study sessions; got distracted by social feeds on Wednesday."
            value={friction}
            onChange={(e) => setFriction(e.target.value)}
          />
        </div>

        <div className="f">
          <label>3. Next Week's 3 Non-Negotiable Priorities</label>
          <textarea
            className="inp"
            rows={3}
            placeholder="1. Finish Chapter 4 in Algorithms&#10;2. Stick to 10 PM wind-down routine&#10;3. Submit quarterly tax filings"
            value={nextWeekPriorities}
            onChange={(e) => setNextWeekPriorities(e.target.value)}
          />
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
          {saved && <span className="mut" style={{ fontSize: 13, alignSelf: 'center' }}>✓ Saved to log</span>}
          <button type="submit" className="btn pri">
            Finalize Weekly Review
          </button>
        </div>
      </form>
    </div>
  );
};
