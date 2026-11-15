import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { personalDevelopmentService } from '../../services/personalDevelopmentService';
import type { BadHabitDto } from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

export const BadHabitsManager: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [habits, setHabits] = useState<BadHabitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [replacementHabit, setReplacementHabit] = useState('');

  // Relapse modal
  const [relapseHabit, setRelapseHabit] = useState<BadHabitDto | null>(null);
  const [relapseTrigger, setRelapseTrigger] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await personalDevelopmentService.getBadHabits();
      setHabits(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load bad habits.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await personalDevelopmentService.createBadHabit({
        name: name.trim(),
        trigger: trigger.trim() || undefined,
        replacementHabit: replacementHabit.trim() || undefined,
        cleanDaysStartDate: today
      });
      showToast('Habit registered for elimination');
      setModalOpen(false);
      resetForm();
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleConfirmRelapse = async () => {
    if (!relapseHabit) return;
    try {
      await personalDevelopmentService.logRelapse(relapseHabit.id);
      showToast('Relapse recorded. Take a breath: awareness is step one.');
      setRelapseHabit(null);
      setRelapseTrigger('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this bad habit tracker?')) return;
    try {
      await personalDevelopmentService.removeBadHabit(id);
      showToast('Habit removed');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const resetForm = () => {
    setName('');
    setTrigger('');
    setReplacementHabit('');
  };

  if (loading) return <LoadingSkeleton lines={4} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Bad Habit Elimination</h2>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            Identify compulsive loops, dismantle triggers, and replace unconscious behaviors.
          </p>
        </div>
        <button
          type="button"
          className="btn pri"
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <DayformIcon name="plus" size={14} />
          <span>Add Bad Habit</span>
        </button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          title="No Bad Habits Tracked"
          description="Track the habits you want to break, their triggers, and the replacement routines."
          action={
            <button
              type="button"
              className="btn pri"
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
            >
              Add Bad Habit
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
          {habits.map((h) => (
            <div key={h.id} className="cd" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{h.name}</h3>
                    <span className="mut" style={{ fontSize: 11 }}>
                      Began clean streak: {formatDisplayDate(h.cleanDaysStartDate)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ac)' }}>
                      {h.cleanStreakDays}d
                    </div>
                    <span className="mut" style={{ fontSize: 11 }}>Clean Streak 🔥</span>
                  </div>
                </div>

                {h.trigger && (
                  <div style={{ marginBottom: 8, fontSize: 12, background: 'var(--cd-sec)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--ln)' }}>
                    <b style={{ color: 'var(--ink)' }}>Trigger:</b> <span className="mut">{h.trigger}</span>
                  </div>
                )}

                {h.replacementHabit && (
                  <div style={{ marginBottom: 12, fontSize: 12, background: 'var(--cd-sec)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--ln)' }}>
                    <b style={{ color: 'var(--ac)' }}>Replacement:</b> <span style={{ fontWeight: 500 }}>{h.replacementHabit}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="row" style={{ gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn pri"
                    style={{ flex: 1, fontSize: 13 }}
                    onClick={() => showToast(`Clean day confirmed for "${h.name}"! Stay strong.`)}
                  >
                    Clean Today ✓
                  </button>
                  <button
                    type="button"
                    className="btn sec"
                    style={{ fontSize: 13, color: 'var(--badge-overdue-text)' }}
                    onClick={() => {
                      setRelapseHabit(h);
                      setRelapseTrigger('');
                    }}
                  >
                    Relapsed
                  </button>
                  <button
                    type="button"
                    className="ib"
                    onClick={() => handleDelete(h.id)}
                    aria-label="Delete"
                  >
                    <DayformIcon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {modalOpen && (
        <div className="sheet-backdrop" onClick={() => setModalOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Target Habit to Break</h3>
              <button type="button" className="ib" onClick={() => setModalOpen(false)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">Habit Name</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. Late night doomscrolling"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Common Trigger / Context</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. Lying in bed tired, feeling stressed or bored"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                />
              </div>

              <div>
                <label className="lbl">Replacement Habit</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. Read 5 pages of a physical book"
                  value={replacementHabit}
                  onChange={(e) => setReplacementHabit(e.target.value)}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri">
                  Add Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relapse Modal */}
      {relapseHabit && (
        <div className="sheet-backdrop" onClick={() => setRelapseHabit(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Log Slip / Relapse</h3>
              <button type="button" className="ib" onClick={() => setRelapseHabit(null)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <p className="mut" style={{ margin: '0 0 14px', fontSize: 13 }}>
              Progress is not linear. Recording what prompted the slip helps you build stronger safeguards.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">What triggered the slip?</label>
                <textarea
                  className="inp"
                  rows={3}
                  placeholder="What was happening? How were you feeling (tired, stressed, alone)?"
                  value={relapseTrigger}
                  onChange={(e) => setRelapseTrigger(e.target.value)}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn sec" onClick={() => setRelapseHabit(null)}>
                  Cancel
                </button>
                <button type="button" className="btn pri" onClick={handleConfirmRelapse}>
                  Record & Reset Streak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
