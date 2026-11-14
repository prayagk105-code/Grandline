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
        subtitle="Consistency, not perfection."
        action={
          mainTab === 'habits' ? (
            <button
              type="button"
              className="ib"
              onClick={() => {
                setEditingHabit(null);
                setFormOpen(true);
              }}
              aria-label="Add habit"
            >
              <DayformIcon name="plus" />
            </button>
          ) : undefined
        }
      />

      {/* Main Subtabs */}
      <div className="chips" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={`chip ${mainTab === 'habits' ? 'on' : ''}`}
          onClick={() => setTab('habits')}
        >
          My Habits
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
          {loading && !summary ? <LoadingSkeleton lines={3} /> : null}
          {error && !summary ? <ErrorState message={error} onRetry={() => load()} /> : null}

          {summary ? (
            <>
              <div className="g3">
                <StatCard icon="habit" label="7 days" value={`${Math.round(summary.weeklyAveragePercent)}%`} note="completion" />
                <StatCard icon="flame" label="Streak" value={`${summary.currentStreakDays}d`} note="current" />
                <StatCard icon="star" label="Best" value={`${summary.bestStreakDays}d`} note="longest" />
              </div>

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
                <label className="mut" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                  />
                  <span>Show archived</span>
                </label>
              </div>

              {filtered.length > 0 ? (
                <div className="cd">
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
                      ? 'Add a daily habit you want to build.'
                      : `No habits in ${category} yet.`
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

              <div className="sec">
                <h2>Activity</h2>
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
