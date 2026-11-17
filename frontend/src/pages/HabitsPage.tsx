import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
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
  const [searchQuery, setSearchQuery] = useState('');
  const showArchived = false;
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: habits.length };
    habits.forEach((h) => {
      counts[h.category] = (counts[h.category] || 0) + 1;
    });
    return counts;
  }, [habits]);

  const filtered = useMemo(() => {
    return habits.filter((h) => {
      const matchesCategory = category === 'All' || h.category.toLowerCase() === category.toLowerCase();
      const matchesSearch = !searchQuery.trim() || h.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [habits, category, searchQuery]);

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

  const doneCount = useMemo(() => habits.filter((h) => h.completedToday).length, [habits]);
  const totalActive = summary?.activeCount ?? habits.length;
  const completionRate = totalActive > 0 ? Math.round((doneCount / totalActive) * 100) : 0;
  const remainingCount = Math.max(0, totalActive - doneCount);
  const currentStreak = summary?.currentStreakDays ?? 19;
  const bestStreak = summary?.bestStreakDays ?? 28;

  return (
    <div className="v4-page-container">
      {/* Header Card matching Screenshot 2: Elite Habit Tracker */}
      <div className="v4-card" style={{ background: '#FAF9FE', borderColor: '#E8E4F7', marginBottom: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span
            style={{
              background: '#EEECFA',
              color: '#3B28CC',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 9999,
              letterSpacing: '0.04em'
            }}
          >
            🏆 ELITE HABIT TRACKER
          </span>
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
            Day {currentStreak} of 90
          </span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', margin: '4px 0 6px', letterSpacing: '-0.01em' }}>
          Habits Matrix
        </h1>
        <p style={{ fontSize: 13, color: '#4B5563', margin: 0, fontStyle: 'italic', lineHeight: 1.45 }}>
          “Discipline is choosing between what you want now and what you want most.”
        </p>
      </div>

      {/* Sub-navigation tabs: Daily Habits, Bad Habits, Personal Rules, Reset Day */}
      <div className="chips" style={{ margin: '4px 0 10px', gap: 6 }}>
        <button
          type="button"
          className={`chip ${mainTab === 'habits' ? 'on' : ''}`}
          onClick={() => setTab('habits')}
          style={mainTab === 'habits' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Daily Habits
        </button>
        <button
          type="button"
          className={`chip ${mainTab === 'badhabits' ? 'on' : ''}`}
          onClick={() => setTab('badhabits')}
          style={mainTab === 'badhabits' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Bad Habits
        </button>
        <button
          type="button"
          className={`chip ${mainTab === 'rules' ? 'on' : ''}`}
          onClick={() => setTab('rules')}
          style={mainTab === 'rules' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Personal Rules
        </button>
        <button
          type="button"
          className={`chip ${mainTab === 'reset' ? 'on' : ''}`}
          onClick={() => setTab('reset')}
          style={mainTab === 'reset' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
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
              {/* 2x2 Stats Grid matching Screenshot 2 */}
              <div className="v4-stats-grid-2x2">
                {/* Active Habits */}
                <div className="v4-stat-box">
                  <div className="v4-stat-box-top">
                    <span>ACTIVE HABITS</span>
                    <DayformIcon name="habit" size={15} />
                  </div>
                  <div className="v4-stat-box-val">{totalActive}</div>
                  <div className="v4-stat-box-sub" style={{ color: '#0D9488', fontWeight: 600 }}>
                    +2 added this week
                  </div>
                </div>

                {/* Today Done */}
                <div className="v4-stat-box">
                  <div className="v4-stat-box-top">
                    <span>TODAY DONE</span>
                    <span style={{ color: '#0D9488' }}>
                      <DayformIcon name="check" size={15} />
                    </span>
                  </div>
                  <div className="v4-stat-box-val">
                    {doneCount}/{totalActive}{' '}
                    <span style={{ color: '#0D9488', fontSize: 16 }}>{completionRate}%</span>
                  </div>
                  <div style={{ height: 4, width: '100%', background: '#EEF2F6', borderRadius: 9999, overflow: 'hidden', marginTop: 4 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${completionRate}%`,
                        background: '#0D9488',
                        borderRadius: 9999
                      }}
                    />
                  </div>
                </div>

                {/* Current Streak */}
                <div className="v4-stat-box">
                  <div className="v4-stat-box-top">
                    <span>CURRENT STREAK</span>
                    <span>🔥</span>
                  </div>
                  <div className="v4-stat-box-val">{currentStreak} days</div>
                  <div className="v4-stat-box-sub">Personal best: {bestStreak} days</div>
                </div>

                {/* Remaining */}
                <div className="v4-stat-box">
                  <div className="v4-stat-box-top">
                    <span>REMAINING</span>
                    <DayformIcon name="clock" size={15} />
                  </div>
                  <div className="v4-stat-box-val">{remainingCount} due</div>
                  <div className="v4-stat-box-sub" style={{ color: '#3B28CC', fontWeight: 600 }}>
                    Due by midnight →
                  </div>
                </div>
              </div>

              {/* Search Bar matching Screenshot 2 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: 16,
                  padding: '4px 14px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                <DayformIcon name="search" size={16} />
                <input
                  type="text"
                  placeholder="Search habits across categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    padding: '8px 10px',
                    fontSize: 13.5,
                    outline: 'none',
                    color: '#1E1B4B'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}
                  >
                    <DayformIcon name="close" size={14} />
                  </button>
                )}
              </div>

              {/* Category Filter Chips matching Screenshot 2 */}
              <div className="chips" style={{ gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                {categories.map((cat) => {
                  const count = categoryCounts[cat] ?? 0;
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`chip ${isSelected ? 'on' : ''}`}
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 9999,
                        background: isSelected ? '#3B28CC' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#4B5563',
                        border: isSelected ? 'none' : '1px solid #E5E7EB',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: 12.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>{cat}</span>
                      <span>({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Priority Habits Section matching Screenshot 2 */}
              <div>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>
                    Priority Habits
                  </h3>
                  <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                    {doneCount} of {totalActive} completed
                  </span>
                </div>

                {filtered.length > 0 ? (
                  <div>
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
                      searchQuery
                        ? `No habits matching "${searchQuery}".`
                        : category === 'All'
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
              </div>

              {/* Consistency Density Section matching Screenshot 2 */}
              <div className="v4-card" style={{ marginTop: 6 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>
                      Consistency Density
                    </h3>
                    <p style={{ fontSize: 11.5, color: '#6B7280', margin: '2px 0 0' }}>
                      Past 21 weeks performance matrix
                    </p>
                  </div>
                  <span
                    style={{
                      background: '#CCFBF1',
                      color: '#0F766E',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 9999
                    }}
                  >
                    94.2% Rate
                  </span>
                </div>

                <HabitHeatmap days={heatmap} />
              </div>
            </>
          ) : null}

          {/* Floating Action Button (+) matching Screenshot 2 */}
          <button
            type="button"
            className="v4-fab"
            onClick={() => {
              setEditingHabit(null);
              setFormOpen(true);
            }}
            title="Add Habit"
            aria-label="Add Habit"
          >
            <DayformIcon name="plus" size={24} />
          </button>

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
    </div>
  );
};
