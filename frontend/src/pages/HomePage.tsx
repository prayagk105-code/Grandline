import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DayformIcon } from '../components/common/DayformIcon';
import { WidgetErrorBoundary } from '../components/common/ErrorBoundary';
import { PageHeader } from '../components/common/PageHeader';
import { ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { HabitRow } from '../components/habits/HabitRow';
import { CustomDashboardModal, DEFAULT_DASHBOARD_CONFIG, type DashboardConfig } from '../components/home/CustomDashboardModal';
import { DailyMissionsWidget } from '../components/home/DailyMissionsWidget';
import { DailySummaryWidget } from '../components/home/DailySummaryWidget';
import { DisciplineScoreCard } from '../components/home/DisciplineScoreCard';
import { GoalOverviewWidget } from '../components/home/GoalOverviewWidget';
import { HomeFocusWidget } from '../components/home/HomeFocusWidget';
import { PersonalCheckInWidget } from '../components/home/PersonalCheckInWidget';
import { PinnedTasksWidget } from '../components/home/PinnedTasksWidget';
import { QuickActionsBar } from '../components/home/QuickActionsBar';
import { TodayPrioritiesWidget } from '../components/home/TodayPrioritiesWidget';
import { UpcomingScheduleWidget } from '../components/home/UpcomingScheduleWidget';
import { QuickAddModal } from '../components/layout/QuickAddModal';
import { QuickCaptureModal } from '../components/common/QuickCaptureModal';
import { MemoryCard } from '../components/memories/MemoryCard';
import { MemoryDetailSheet } from '../components/memories/MemoryDetailSheet';
import { RandomMemoryCard } from '../components/memories/RandomMemoryCard';
import { useAuth } from '../contexts/AuthContext';
import { useFocusTimer } from '../contexts/FocusTimerContext';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { dashboardService } from '../services/dashboardService';
import { habitService } from '../services/habitService';
import type { DashboardSummaryDto, HabitDto, MemoryDto } from '../types/api';
import { getGreetingWord, toIsoDate } from '../utils/date';

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
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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

  const firstName = user?.displayName?.split(' ')[0] || 'Voyager';
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  if (loading && !summary) {
    return (
      <>
        <div className="desktop-only">
          <PageHeader eyebrow={todayLabel} title={`Good ${getGreetingWord()}, ${firstName}`} />
        </div>
        <div className="mobile-only" style={{ marginBottom: 12 }}>
          <div className="home-mobile-greeting">
            <LoadingSkeleton lines={2} />
          </div>
        </div>
        <LoadingSkeleton lines={4} />
        <LoadingSkeleton lines={3} />
      </>
    );
  }

  if (error && !summary) {
    return (
      <>
        <div className="desktop-only">
          <PageHeader eyebrow={todayLabel} title={`Good ${getGreetingWord()}, ${firstName}`} />
        </div>
        <div className="mobile-only" style={{ marginBottom: 12 }}>
          <div className="home-mobile-greeting">
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Good {getGreetingWord()}, {firstName}</p>
          </div>
        </div>
        <ErrorState message={error} onRetry={() => load()} />
      </>
    );
  }

  if (!summary) {
    return (
      <>
        <div className="desktop-only">
          <PageHeader eyebrow={todayLabel} title={`Good ${getGreetingWord()}, ${firstName}`} />
        </div>
        <div className="mobile-only" style={{ marginBottom: 12 }}>
          <div className="home-mobile-greeting">
            <LoadingSkeleton lines={2} />
          </div>
        </div>
        <LoadingSkeleton lines={4} />
      </>
    );
  }

  const journeyDay = summary.journeyDay ?? 1;
  const journeyTotalDays = summary.journeyTotalDays ?? 180;
  const journeyProgressPct = Math.min(100, Math.round((journeyDay / Math.max(1, journeyTotalDays)) * 100));

  return (
    <>
      {/* Mobile Compact Greeting & Journey Section (< 768px) */}
      <div className="home-mobile-greeting mobile-only">
        <div className="home-mobile-greeting-header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <span className="home-mobile-date">{todayLabel}</span>
            <h1 className="home-mobile-title">
              Good {getGreetingWord()}, {firstName}
            </h1>
            <p className="home-mobile-subtitle">Stay consistent, make progress today.</p>
          </div>
          <div className="home-mobile-actions">
            <button
              type="button"
              className="ib sm"
              onClick={() => setQuickCaptureOpen(true)}
              title="Quick Capture"
              aria-label="Quick Capture"
            >
              <DayformIcon name="zap" size={14} />
            </button>
            <button
              type="button"
              className="ib sm"
              onClick={() => setShowConfigModal(true)}
              title="Customize Dashboard Layout"
              aria-label="Customize Dashboard Layout"
            >
              <DayformIcon name="settings" size={14} />
            </button>
          </div>
        </div>

        {/* Compact Voyage Progress Bar */}
        <div className="home-mobile-voyage">
          <div className="home-mobile-voyage-info">
            <span className="home-mobile-voyage-label">
              ⚓ Day {journeyDay} of {journeyTotalDays}
            </span>
            <span className="home-mobile-voyage-pct">
              {journeyProgressPct}% voyage
            </span>
          </div>
          <div className="home-mobile-voyage-bar">
            <div
              className="home-mobile-voyage-fill"
              style={{ width: `${journeyProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Desktop Greeting & Journey Banner (>= 768px) */}
      <div className="desktop-only">
        <PageHeader
          eyebrow={todayLabel}
          title={`Good ${getGreetingWord()}, ${firstName}`}
          subtitle="Stay consistent, make progress today."
          action={
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn pri sm"
                onClick={() => setQuickCaptureOpen(true)}
                title="Quick Capture thoughts & tasks"
              >
                <DayformIcon name="zap" size={13} />
                <span>Capture</span>
              </button>
              <button
                type="button"
                className="ib sm"
                onClick={() => setShowConfigModal(true)}
                title="Customize Dashboard Layout"
                aria-label="Customize Dashboard Layout"
              >
                <DayformIcon name="settings" size={15} />
              </button>
            </div>
          }
        />

        <div className="home-journey-banner">
          <div className="home-journey-top">
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>⚓</span>
              <span style={{ font: '600 13px var(--font-display)', color: 'var(--ink)' }}>
                Grandline Voyage
              </span>
            </div>
            <span className="badge badge-home badge-sm">
              Day {journeyDay} of {journeyTotalDays} ({journeyProgressPct}%)
            </span>
          </div>
          <div style={{ height: 6, width: '100%', borderRadius: 999, background: 'var(--sf)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${journeyProgressPct}%`,
                background: 'var(--ac)',
                borderRadius: 999,
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <QuickActionsBar
        onQuickAdd={() => setQuickAddOpen(true)}
        onQuickCapture={() => setQuickCaptureOpen(true)}
      />

      {/* Balanced Dashboard Multi-Column Layout */}
      <div className="df-grid-2">
        {/* Left Column: Action & Execution Core */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Section 4: Today's Priorities (Highest Visual Priority) */}
          {dashConfig.showPriorities && (
            <WidgetErrorBoundary>
              <TodayPrioritiesWidget />
            </WidgetErrorBoundary>
          )}

          {/* Section 5: Today's Habits */}
          {dashConfig.showHabits && (
            <div className="cd home-card-habits" style={{ borderLeft: '3px solid var(--mod-habits)', marginBottom: 16 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <span className="mod-icon mod-icon-habits">
                    <DayformIcon name="check" size={16} />
                  </span>
                  <div>
                    <b className="d" style={{ fontSize: 15 }}>Today's Habits</b>
                    <div className="mut" style={{ fontSize: 11 }}>
                      <span>{summary.completedHabitsToday ?? 0} of {summary.totalActiveHabits ?? 0} habits done</span>
                      {summary.nextIncompleteHabitName ? (
                        <> · <span>Next: {summary.nextIncompleteHabitName}</span></>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="row" style={{ gap: 8 }}>
                  <Link to="/habits" className="btn sm" style={{ padding: '3px 8px', fontSize: 11 }}>
                    + New
                  </Link>
                  <Link to="/habits" className="lk" style={{ fontSize: 12 }}>
                    View All <DayformIcon name="right" size={13} />
                  </Link>
                </div>
              </div>

              {(summary.todayHabits ?? []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {summary.todayHabits.slice(0, 5).map((h) => (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      busy={busyHabitId === h.id}
                      onToggle={handleToggleHabit}
                    />
                  ))}
                  {(summary.todayHabits ?? []).length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: 4 }}>
                      <Link to="/habits" className="mut" style={{ fontSize: 12 }}>
                        +{(summary.todayHabits?.length ?? 0) - 5} more habits in Habits tab
                      </Link>
                    </div>
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
          )}

          {/* Section 6: Active Goals */}
          {dashConfig.showGoals && (
            <WidgetErrorBoundary>
              <GoalOverviewWidget />
            </WidgetErrorBoundary>
          )}

          {/* Section 7: Upcoming Schedule */}
          {dashConfig.showSchedule && (
            <WidgetErrorBoundary>
              <UpcomingScheduleWidget />
            </WidgetErrorBoundary>
          )}

          {/* Missions (if enabled) */}
          {dashConfig.showMissions && (
            <WidgetErrorBoundary>
              <DailyMissionsWidget />
            </WidgetErrorBoundary>
          )}
        </div>

        {/* Right Column: Progress, Focus, Discipline & Reflection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Section 4 Pair: Daily Progress */}
          {dashConfig.showDailySummary && (
            <WidgetErrorBoundary>
              <DailySummaryWidget />
            </WidgetErrorBoundary>
          )}

          {/* Section 5 Pair: Focus Session */}
          {dashConfig.showFocusTimer && (
            <WidgetErrorBoundary>
              <HomeFocusWidget />
            </WidgetErrorBoundary>
          )}

          {/* Section 6 Pair: Discipline Score */}
          {dashConfig.showDisciplineScore && (
            <WidgetErrorBoundary>
              <DisciplineScoreCard />
            </WidgetErrorBoundary>
          )}

          {/* Section 7 Pair: Personal Check-in */}
          {dashConfig.showCheckIn && (
            <WidgetErrorBoundary>
              <PersonalCheckInWidget />
            </WidgetErrorBoundary>
          )}

          {/* Pinned Tasks Widget (if enabled) */}
          {dashConfig.showPinnedTasks && (
            <WidgetErrorBoundary>
              <PinnedTasksWidget />
            </WidgetErrorBoundary>
          )}

          {/* 7-Day Consistency Micro-Chart */}
          <div className="cd" style={{ marginBottom: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                <span className="mod-icon mod-icon-home" style={{ width: 26, height: 26 }}>
                  <DayformIcon name="flame" size={14} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Last 7 Days Consistency</span>
              </div>
              <Link to="/progress" className="lk" style={{ fontSize: 11.5 }}>
                Analytics <DayformIcon name="right" size={12} />
              </Link>
            </div>
            <div className="wk">
              {(summary.last7Days ?? []).map((day) => {
                const isToday = day.date === summary.todayDate;
                const dayNum = new Date(`${day.date}T12:00:00`).getDate();
                const pct = Math.min(100, Math.max(0, day.completionPercent ?? 0));
                return (
                  <button
                    key={day.date}
                    type="button"
                    className={isToday ? 'tdy' : ''}
                    onClick={() => navigate(`/planner?date=${day.date}`)}
                    aria-label={`${day.date}: ${Math.round(pct)}% habits`}
                  >
                    <span>{day.weekdayShort}</span>
                    <div className="tr">
                      <i style={{ height: `${pct}%` }} />
                    </div>
                    <b>{dayNum}</b>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section 8: Memory Lane & Recent Memories */}
      {(dashConfig.showRandomMemory || (summary.recentMemories ?? []).length > 0) && (
        <div style={{ marginTop: 8 }}>
          <div className="sec">
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <span className="mod-icon mod-icon-memories">
                <DayformIcon name="img" size={15} />
              </span>
              <h2>Memory Lane & Reflections</h2>
            </div>
            <Link to="/memories" className="lk">
              All Memories <DayformIcon name="right" size={14} />
            </Link>
          </div>

          <div className="df-grid-2">
            {dashConfig.showRandomMemory && (
              <WidgetErrorBoundary>
                <RandomMemoryCard />
              </WidgetErrorBoundary>
            )}

            <div>
              {(summary.recentMemories ?? []).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  {summary.recentMemories.slice(0, 4).map((m) => (
                    <MemoryCard key={m.id} memory={m} onSelect={setSelectedMemory} />
                  ))}
                </div>
              ) : (
                <div className="cd" style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <p className="mut" style={{ margin: '0 0 10px', fontSize: 13 }}>
                    Keep snapshots, milestones, and quiet moments here.
                  </p>
                  <Link to="/memories" className="btn sm">
                    Add Memory
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sheets & Modals */}
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

      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </>
  );
};
