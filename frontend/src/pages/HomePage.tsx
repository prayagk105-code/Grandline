import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DayformIcon } from '../components/common/DayformIcon';
import { WidgetErrorBoundary } from '../components/common/ErrorBoundary';
import { PageHeader } from '../components/common/PageHeader';
import { ProgressRing } from '../components/common/ProgressRing';
import { StatCard } from '../components/common/StatCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { HabitRow } from '../components/habits/HabitRow';
import { CustomDashboardModal, DEFAULT_DASHBOARD_CONFIG, type DashboardConfig } from '../components/home/CustomDashboardModal';
import { DailyMissionsWidget } from '../components/home/DailyMissionsWidget';
import { DailySummaryWidget } from '../components/home/DailySummaryWidget';
import { DisciplineScoreCard } from '../components/home/DisciplineScoreCard';
import { GoalOverviewWidget } from '../components/home/GoalOverviewWidget';
import { PersonalCheckInWidget } from '../components/home/PersonalCheckInWidget';
import { PinnedTasksWidget } from '../components/home/PinnedTasksWidget';
import { TodayPrioritiesWidget } from '../components/home/TodayPrioritiesWidget';
import { QuickCaptureModal } from '../components/common/QuickCaptureModal';
import { MemoryCard } from '../components/memories/MemoryCard';
import { MemoryDetailSheet } from '../components/memories/MemoryDetailSheet';
import { RandomMemoryCard } from '../components/memories/RandomMemoryCard';
import { FocusTimerCard } from '../components/study/FocusTimerCard';
import { useAuth } from '../contexts/AuthContext';
import { useFocusTimer } from '../contexts/FocusTimerContext';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { dashboardService } from '../services/dashboardService';
import { habitService } from '../services/habitService';
import type { DashboardSummaryDto, HabitDto, MemoryDto } from '../types/api';
import { formatDurationMinutes, getGreetingWord, toIsoDate } from '../utils/date';

const DASHBOARD_CONFIG_KEY = 'grandline_dashboard_config';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { onSessionLogged } = useFocusTimer();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyHabitId, setBusyHabitId] = useState<string | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<MemoryDto | null>(null);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);

  // Dashboard configuration
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [dashConfig, setDashConfig] = useState<DashboardConfig>(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_CONFIG_KEY);
      return saved ? { ...DEFAULT_DASHBOARD_CONFIG, ...JSON.parse(saved) } : DEFAULT_DASHBOARD_CONFIG;
    } catch {
      return DEFAULT_DASHBOARD_CONFIG;
    }
  });

  const handleConfigChange = (newConfig: DashboardConfig) => {
    setDashConfig(newConfig);
    localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(newConfig));
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getSummary(toIsoDate());
      setSummary(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load dashboard.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handleChanged = () => load(true);
    window.addEventListener('dayform:data-changed', handleChanged);
    const unsubTimer = onSessionLogged(() => load(true));
    return () => {
      window.removeEventListener('dayform:data-changed', handleChanged);
      unsubTimer();
    };
  }, [load, onSessionLogged]);

  const handleToggleHabit = async (habit: HabitDto) => {
    setBusyHabitId(habit.id);
    try {
      await habitService.setLog(habit.id, toIsoDate(), !habit.completedToday);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err, 'Could not update habit.').message, 'error');
    } finally {
      setBusyHabitId(null);
    }
  };

  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  if (loading && !summary) {
    return (
      <>
        <PageHeader eyebrow={todayLabel} title={`Good ${getGreetingWord()}, ${firstName}`} />
        <LoadingSkeleton lines={4} />
        <LoadingSkeleton lines={3} />
      </>
    );
  }

  if (error && !summary) {
    return (
      <>
        <PageHeader eyebrow={todayLabel} title={`Good ${getGreetingWord()}, ${firstName}`} />
        <ErrorState message={error} onRetry={() => load()} />
      </>
    );
  }

  if (!summary) {
    return (
      <>
        <PageHeader eyebrow={todayLabel} title={`Good ${getGreetingWord()}, ${firstName}`} />
        <LoadingSkeleton lines={4} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={todayLabel}
        title={`Good ${getGreetingWord()}, ${firstName}`}
        subtitle={`Day ${summary.journeyDay ?? 1} of your ${summary.journeyTotalDays ?? 100}-day journey`}
        action={
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn pri"
              style={{ padding: '6px 12px', fontSize: 13, gap: 6 }}
              onClick={() => setQuickCaptureOpen(true)}
              title="Quick Capture (Tasks, Thoughts, Ideas, Expenses)"
            >
              <DayformIcon name="zap" size={14} />
              <span>Quick Capture</span>
            </button>
            <button
              type="button"
              className="ib"
              onClick={() => setShowConfigModal(true)}
              title="Customize Dashboard"
              aria-label="Customize Dashboard"
            >
              <DayformIcon name="settings" size={16} />
            </button>
          </div>
        }
      />

      <div className="df-grid-2">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {dashConfig.showDailySummary && (
            <WidgetErrorBoundary>
              <DailySummaryWidget />
            </WidgetErrorBoundary>
          )}

          {dashConfig.showPriorities && (
            <WidgetErrorBoundary>
              <TodayPrioritiesWidget />
            </WidgetErrorBoundary>
          )}

          {(dashConfig.showHabits || dashConfig.showDisciplineScore) && (
            <div className="home-habit-discipline-grid">
              {dashConfig.showHabits && (
                <div className="cd home-duo-card">
                  <div className="home-duo-header">
                    <div className="home-duo-title">
                      <DayformIcon name="check" size={16} />
                      <span>Habits Today</span>
                    </div>
                    <span className="badge badge-completed badge-sm">
                      {summary.completionPercentToday ?? 0}%
                    </span>
                  </div>

                  <div className="home-duo-center">
                    <ProgressRing
                      percent={summary.completionPercentToday ?? 0}
                      size={68}
                      strokeWidth={7}
                      label={`${summary.completionPercentToday ?? 0}%`}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div className="home-duo-stat">
                        {summary.completedHabitsToday ?? 0} of {summary.totalActiveHabits ?? 0} habits done
                      </div>
                      <div className="home-duo-sub">
                        {(summary.totalActiveHabits ?? 0) === 0
                          ? 'Add your first habit to begin tracking.'
                          : summary.nextIncompleteHabitName
                            ? `Next: ${summary.nextIncompleteHabitName}`
                            : 'All done for today.'}
                      </div>
                    </div>
                  </div>

                  <div className="home-duo-action">
                    <Link
                      to="/habits"
                      className="btn pri"
                      style={{ width: '100%', justifyContent: 'center', padding: '6px 10px', fontSize: 12 }}
                    >
                      Check in <DayformIcon name="right" size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {dashConfig.showDisciplineScore && (
                <WidgetErrorBoundary>
                  <DisciplineScoreCard />
                </WidgetErrorBoundary>
              )}
            </div>
          )}

          {dashConfig.showMissions && (
            <WidgetErrorBoundary>
              <DailyMissionsWidget />
            </WidgetErrorBoundary>
          )}

          {dashConfig.showPinnedTasks && (
            <WidgetErrorBoundary>
              <PinnedTasksWidget />
            </WidgetErrorBoundary>
          )}

          <div className="g3">
            <StatCard
              icon="flame"
              label="Streak"
              value={`${summary.currentStreakDays ?? 0}d`}
              note={`Best ${summary.bestStreakDays ?? 0}d`}
            />
            <StatCard
              icon="clock"
              label="Focus 7d"
              value={formatDurationMinutes(summary.focusMinutesLast7Days ?? 0)}
              note="logged"
            />
            <StatCard
              icon="chart"
              label="Habits 7d"
              value={`${Math.round(summary.habitAverageLast7Days ?? 0)}%`}
              note="average"
            />
          </div>

          <div className="sec">
            <h2>Last 7 days</h2>
            <Link to="/progress" className="lk">
              Trends <DayformIcon name="right" size={15} />
            </Link>
          </div>
          <div className="cd">
            <div className="wk">
              {(summary.last7Days ?? []).map((day) => {
                const isToday = day.date === summary.todayDate;
                const dayNum = new Date(`${day.date}T12:00:00`).getDate();
                return (
                  <button
                    key={day.date}
                    type="button"
                    className={isToday ? 'tdy' : ''}
                    onClick={() => navigate(`/planner?date=${day.date}`)}
                    aria-label={`${day.date}: ${Math.round(day.completionPercent ?? 0)}% habits`}
                  >
                    <span>{day.weekdayShort}</span>
                    <div className="tr">
                      <i style={{ height: `${Math.min(100, Math.max(0, day.completionPercent ?? 0))}%` }} />
                    </div>
                    <b>{dayNum}</b>
                  </button>
                );
              })}
            </div>
          </div>

          {dashConfig.showFocusTimer && (
            <>
              <div className="sec">
                <h2>Focus timer</h2>
                <Link to="/study" className="lk">
                  Study <DayformIcon name="right" size={15} />
                </Link>
              </div>
              <FocusTimerCard compact />
            </>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {dashConfig.showCheckIn && (
            <WidgetErrorBoundary>
              <PersonalCheckInWidget />
            </WidgetErrorBoundary>
          )}

          {dashConfig.showGoals && (
            <WidgetErrorBoundary>
              <GoalOverviewWidget />
            </WidgetErrorBoundary>
          )}

          {dashConfig.showRandomMemory && (
            <WidgetErrorBoundary>
              <RandomMemoryCard />
            </WidgetErrorBoundary>
          )}

          {dashConfig.showHabits && (
            <div>
              <div className="sec">
                <h2>Today’s habits</h2>
                <Link to="/habits" className="lk">
                  All <DayformIcon name="right" size={15} />
                </Link>
              </div>
              <div className="cd">
                {(summary.todayHabits ?? []).length > 0 ? (
                  summary.todayHabits.map((h) => (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      busy={busyHabitId === h.id}
                      onToggle={handleToggleHabit}
                    />
                  ))
                ) : (
                  <p className="mut" style={{ margin: 0 }}>
                    No habits yet. <Link to="/habits" className="lk">Create one</Link>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sec" style={{ marginTop: 24 }}>
        <h2>Recent memories</h2>
        <Link to="/memories" className="lk">
          All <DayformIcon name="right" size={15} />
        </Link>
      </div>
      {(summary.recentMemories ?? []).length > 0 ? (
        <div className="hs">
          {summary.recentMemories.map((m) => (
            <MemoryCard key={m.id} memory={m} onSelect={setSelectedMemory} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No memories yet"
          description="Keep snapshots, milestones, and quiet moments here."
          action={
            <Link to="/memories" className="btn">
              Add memory
            </Link>
          }
        />
      )}

      <MemoryDetailSheet
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onEdit={() => {
          setSelectedMemory(null);
          navigate('/memories');
        }}
        onDelete={() => {
          setSelectedMemory(null);
          navigate('/memories');
        }}
      />

      {showConfigModal && (
        <CustomDashboardModal
          config={dashConfig}
          onChange={handleConfigChange}
          onClose={() => setShowConfigModal(false)}
        />
      )}

      <QuickCaptureModal
        isOpen={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
      />
    </>
  );
};
