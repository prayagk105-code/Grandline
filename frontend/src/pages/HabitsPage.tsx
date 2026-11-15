import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { BadHabitsManager } from '../components/habits/BadHabitsManager';
import { HabitFormSheet, type HabitFormValues } from '../components/habits/HabitFormSheet';
import { HabitHeatmap } from '../components/habits/HabitHeatmap';
import { HabitRow } from '../components/habits/HabitRow';
import { PersonalRulesManager } from '../components/habits/PersonalRulesManager';
import { ResetDayView } from '../components/habits/ResetDayView';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { habitService } from '../services/habitService';
import type { HabitDto, HabitHeatmapDayDto, HabitSummaryDto } from '../types/api';
import { toIsoDate } from '../utils/date';

const BASE_CATEGORIES = ['All', 'Health', 'Learning', 'Mind', 'Lifestyle'];

type HabitMainTab = 'habits' | 'badhabits' | 'rules' | 'reset';

export const HabitsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();

  const tabParam = (params.get('tab') as HabitMainTab) || 'habits';
  const [mainTab, setMainTab] = useState<HabitMainTab>(tabParam);

  const setTab = (t: HabitMainTab) => {
    setMainTab(t);
    setParams((p) => {
      p.set('tab', t);
      return p;
    });
  };

  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [summary, setSummary] = useState<HabitSummaryDto | null>(null);
  const [heatmap, setHeatmap] = useState<HabitHeatmapDayDto[]>([]);
  const [category, setCategory] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitDto | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<HabitDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const today = toIsoDate();
      const [hList, sum, hm] = await Promise.all([
        habitService.getAll(undefined, showArchived, today),
        habitService.getSummary(today),
        habitService.getHeatmap(21, today)
      ]);
      setHabits(hList);
      setSummary(sum);
      setHeatmap(hm);
    } catch (err) {
      setError(parseApiError(err, 'Could not load habits.').message);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    load();
    const handleChanged = () => load(true);
    window.addEventListener('dayform:data-changed', handleChanged);
    return () => window.removeEventListener('dayform:data-changed', handleChanged);
  }, [load]);

  const categories = useMemo(() => {
    const dynamic = new Set(BASE_CATEGORIES);
    habits.forEach((h) => dynamic.add(h.category));
    return Array.from(dynamic);
  }, [habits]);

  const filtered = useMemo(
    () => habits.filter((h) => category === 'All' || h.category.toLowerCase() === category.toLowerCase()),
    [habits, category]
  );

  const handleToggle = async (habit: HabitDto) => {
    setBusyId(habit.id);
    try {
      await habitService.setLog(habit.id, toIsoDate(), !habit.completedToday);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err, 'Could not update habit check-in.').message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveForm = async (vals: HabitFormValues) => {
    try {
      if (editingHabit) {
        await habitService.update(editingHabit.id, {
          name: vals.name,
          category: vals.category,
          target: vals.target,
          icon: vals.icon,
          isActive: vals.isActive
        });
        showToast('Habit updated');
      } else {
        await habitService.create({
          name: vals.name,
          category: vals.category,
          target: vals.target,
          icon: vals.icon
        });
        showToast('Habit created');
      }
      setFormOpen(false);
      setEditingHabit(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingHabit) return;
    setDeleteBusy(true);
    try {
      await habitService.remove(deletingHabit.id);
      showToast('Habit removed');
      setDeletingHabit(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Show up for yourself"
        title="Habits & Principles"
        subtitle="Consistency, not perfection. Build identity through daily ritual."
        action={
          mainTab === 'habits' ? (
            <button
              type="button"
              className="btn pri sm"
              onClick={() => {
                setEditingHabit(null);
                setFormOpen(true);
              }}
              style={{ gap: 6 }}
            >
              <DayformIcon name="plus" size={14} />
              <span>Add habit</span>
            </button>
          ) : undefined
        }
      />

      {/* Main Subtabs */}
      <div className="chips" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={`chip ${mainTab === 'habits' ? 'on' : ''}`}
          onClick={() => setTab('habits')}
        >
          Daily Habits
        </button>
        <button
          type="button"
          className={`chip ${mainTab === 'badhabits' ? 'on' : ''}`}
          onClick={() => setTab('badhabits')}
        >
          Bad Habits
        </button>
        <button
          type="button"
          className={`chip ${mainTab === 'rules' ? 'on' : ''}`}
          onClick={() => setTab('rules')}
        >
          Personal Rules
        </button>
        <button
          type="button"
          className={`chip ${mainTab === 'reset' ? 'on' : ''}`}
          onClick={() => setTab('reset')}
        >
          Reset Day
        </button>
      </div>

      {mainTab === 'badhabits' && <BadHabitsManager />}
      {mainTab === 'rules' && <PersonalRulesManager />}
      {mainTab === 'reset' && <ResetDayView habits={habits} />}

      {mainTab === 'habits' && (
        <>
          {loading && !summary ? <LoadingSkeleton lines={4} /> : null}
          {error && !summary ? <ErrorState message={error} onRetry={() => load()} /> : null}

          {summary ? (
            <>
              {/* Stat Cards with Module-aware Accents */}
              <div className="g4">
                <StatCard
                  icon="habit"
                  label="Active Habits"
                  value={summary.activeCount ?? 0}
                  note={`${habits.filter((h) => h.completedToday).length} done today`}
                  accent="green"
                />
                <StatCard
                  icon="chart"
                  label="Today Done"
                  value={`${summary.activeCount > 0 ? Math.round((habits.filter((h) => h.completedToday).length / summary.activeCount) * 100) : 0}%`}
                  note="completion rate"
                  accent="forest"
                />
                <StatCard
                  icon="flame"
                  label="Current Streak"
                  value={`${summary.currentStreakDays ?? 0}d`}
                  note={`Best: ${summary.bestStreakDays ?? 0}d`}
                  accent="orange"
                />
                <StatCard
                  icon="clock"
                  label="7-Day Avg"
                  value={`${Math.round(summary.weeklyAveragePercent ?? 0)}%`}
                  note="consistency"
                  accent="blue"
                />
              </div>

              {/* Filters & Category Pills */}
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div className="chips" style={{ marginBottom: 0 }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`chip ${category === cat ? 'on' : ''}`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <label className="mut" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    style={{ accentColor: 'var(--ac)' }}
                  />
                  <span>Show archived habits</span>
                </label>
              </div>

              {/* Habits List Container */}
              {filtered.length > 0 ? (
                <div className="cd" style={{ marginBottom: 20 }}>
                  {filtered.map((h) => (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      busy={busyId === h.id}
                      onToggle={handleToggle}
                      onEdit={(item) => {
                        setEditingHabit(item);
                        setFormOpen(true);
                      }}
                      onDelete={setDeletingHabit}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No habits here"
                  description={
                    category === 'All'
                      ? 'Add a daily habit you want to build and stay consistent with.'
                      : `No habits found under category "${category}".`
                  }
                  action={
                    <button
                      type="button"
                      className="btn pri"
                      onClick={() => {
                        setEditingHabit(null);
                        setFormOpen(true);
                      }}
                    >
                      Add habit
                    </button>
                  }
                />
              )}

              {/* 21-Week Habit Consistency Heatmap */}
              <div className="sec">
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <span className="mod-icon mod-icon-habits">
                    <DayformIcon name="flame" size={16} />
                  </span>
                  <h2>Consistency Heatmap</h2>
                </div>
                <span className="eyebrow">Last 21 weeks</span>
              </div>
              <div className="cd">
                <HabitHeatmap days={heatmap} />
              </div>
            </>
          ) : null}

          <HabitFormSheet
            isOpen={formOpen}
            editing={editingHabit}
            onClose={() => {
              setFormOpen(false);
              setEditingHabit(null);
            }}
            onSubmit={handleSaveForm}
          />

          <ConfirmDialog
            isOpen={Boolean(deletingHabit)}
            title="Delete habit"
            message={`Delete "${deletingHabit?.name}" and its check-in history? This cannot be undone.`}
            isBusy={deleteBusy}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeletingHabit(null)}
          />
        </>
      )}
    </>
  );
};
