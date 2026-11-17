import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DayformIcon } from '../components/common/DayformIcon';
import { WidgetErrorBoundary } from '../components/common/ErrorBoundary';
import { PageHeader } from '../components/common/PageHeader';
import { ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { TodayHabitsWidget } from '../components/home/TodayHabitsWidget';
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
import { HomeStudyWidget } from '../components/home/HomeStudyWidget';
import { HomeBalanceSnapshotWidget } from '../components/home/HomeBalanceSnapshotWidget';
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
    <div className="v4-page-container">
      {/* 1. Hero Mission Progress Card matching Screenshot 1 (APEX PROTOCOL V4) */}
      <div className="v4-hero-card" style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span className="v4-hero-badge">APEX PROTOCOL V4</span>
            <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>
              Day {journeyDay} of {journeyTotalDays}
            </span>
          </div>

          <div className="v4-progress-ring-container" title={`${journeyProgressPct}% completed`}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="4"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * journeyProgressPct) / 100}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
              />
            </svg>
            <span className="v4-progress-ring-text">{journeyProgressPct}%</span>
          </div>
        </div>

        <h2 className="v4-hero-title">Unrivaled Momentum</h2>
        <p className="v4-hero-subtitle">
          All neural synapses firing at peak operational efficiency. Stay relentless, {firstName}.
        </p>

        {/* Action icons top right */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="ib sm"
            onClick={() => setShowConfigModal(true)}
            title="Customize Dashboard Layout"
            aria-label="Customize Dashboard Layout"
            style={{ width: 28, height: 28, background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#FFFFFF' }}
          >
            <DayformIcon name="settings" size={14} />
          </button>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <QuickActionsBar
        onQuickAdd={() => setQuickAddOpen(true)}
        onQuickCapture={() => setQuickCaptureOpen(true)}
      />

      {/* Balanced Dashboard Multi-Column Layout (Prioritized Pairs) */}
      <div className="df-grid-2">
        {/* Pair 1: Today's Priorities & Today's Habits */}
        {dashConfig.showPriorities && (
          <WidgetErrorBoundary>
            <TodayPrioritiesWidget />
          </WidgetErrorBoundary>
        )}

        {dashConfig.showHabits && (
          <WidgetErrorBoundary>
            <TodayHabitsWidget
              summary={summary}
              busyHabitId={busyHabitId}
              onToggleHabit={handleToggleHabit}
            />
          </WidgetErrorBoundary>
        )}

        {/* Pair 2: Study & Mastery and Upcoming Schedule */}
        {dashConfig.showStudy && (
          <WidgetErrorBoundary>
            <HomeStudyWidget />
          </WidgetErrorBoundary>
        )}

        {dashConfig.showSchedule && (
          <WidgetErrorBoundary>
            <UpcomingScheduleWidget />
          </WidgetErrorBoundary>
        )}

        {/* Pair 3: Daily Velocity & Focus Session */}
        {dashConfig.showDailySummary && (
          <WidgetErrorBoundary>
            <DailySummaryWidget />
          </WidgetErrorBoundary>
        )}

        {dashConfig.showFocusTimer && (
          <WidgetErrorBoundary>
            <HomeFocusWidget />
          </WidgetErrorBoundary>
        )}

        {/* Pair 4: Active Goals & Daily Missions */}
        {dashConfig.showGoals && (
          <WidgetErrorBoundary>
            <GoalOverviewWidget />
          </WidgetErrorBoundary>
        )}

        {dashConfig.showMissions && (
          <WidgetErrorBoundary>
            <DailyMissionsWidget />
          </WidgetErrorBoundary>
        )}

        {/* Pair 5: Discipline Score & Health/Balance Snapshot */}
        {dashConfig.showDisciplineScore && (
          <WidgetErrorBoundary>
            <DisciplineScoreCard />
          </WidgetErrorBoundary>
        )}

        {dashConfig.showBalanceSnapshot && (
          <WidgetErrorBoundary>
            <HomeBalanceSnapshotWidget />
          </WidgetErrorBoundary>
        )}

        {/* Pair 6: Personal Check-In & 7-Day Consistency Micro-Chart */}
        {dashConfig.showCheckIn && (
          <WidgetErrorBoundary>
            <PersonalCheckInWidget />
          </WidgetErrorBoundary>
        )}

        {/* 7-Day Consistency Micro-Chart */}
        <div className="cd cd-discipline home-card-consistency" style={{ marginBottom: 0 }}>
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

        {/* Pinned Tasks Widget (if enabled) */}
        {dashConfig.showPinnedTasks && (
          <WidgetErrorBoundary>
            <PinnedTasksWidget />
          </WidgetErrorBoundary>
        )}
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
    </div>
  );
};
