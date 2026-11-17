import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { DigitalDetoxView } from '../components/planner/DigitalDetoxView';
import { GoalsManager } from '../components/planner/GoalsManager';
import { LifeRoadmapView } from '../components/planner/LifeRoadmapView';
import { NinetyDayChallengeView } from '../components/planner/NinetyDayChallengeView';
import { ReminderFormSheet, type ReminderFormValues } from '../components/planner/ReminderFormSheet';
import { TasksManager } from '../components/planner/TasksManager';
import { WeeklyReviewView } from '../components/planner/WeeklyReviewView';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { reminderService } from '../services/reminderService';
import type { PlannerCalendarDto, PlannerDayDto, ReminderDto } from '../types/api';
import { formatDisplayDate, formatDurationMinutes, toIsoDate } from '../utils/date';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type PlannerTab = 'tasks' | 'goals' | 'roadmap' | 'calendar' | 'weeklyreview' | 'challenge' | 'detox';

export const PlannerPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();
  const today = toIsoDate();

  const tabParam = (params.get('tab') as PlannerTab) || 'tasks';
  const [activeTab, setActiveTab] = useState<PlannerTab>(tabParam);

  const setTab = (t: PlannerTab) => {
    setActiveTab(t);
    setParams((p) => {
      p.set('tab', t);
      return p;
    });
  };

  const initialDate = params.get('date') || today;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [monthCursor, setMonthCursor] = useState(() => {
    const dt = new Date(`${initialDate}T12:00:00`);
    return new Date(dt.getFullYear(), dt.getMonth(), 1);
  });

  const [calendar, setCalendar] = useState<PlannerCalendarDto | null>(null);
  const [_reminders, setReminders] = useState<ReminderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReminderDto | null>(null);
  const [deleting, setDeleting] = useState<ReminderDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const monthRange = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const from = toIsoDate(new Date(y, m, 1));
    const to = toIsoDate(new Date(y, m + 1, 0));
    return { y, m, from, to, firstWeekday: new Date(y, m, 1).getDay(), daysInMonth: new Date(y, m + 1, 0).getDate() };
  }, [monthCursor]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [cal, rems] = await Promise.all([
        reminderService.getCalendar(monthRange.from, monthRange.to),
        reminderService.getAll(true)
      ]);
      setCalendar(cal);
      setReminders(rems);
    } catch (err) {
      setError(parseApiError(err, 'Could not load planner.').message);
    } finally {
      setLoading(false);
    }
  }, [monthRange.from, monthRange.to]);

  useEffect(() => {
    load();
    const handleChanged = () => load(true);
    window.addEventListener('dayform:data-changed', handleChanged);
    return () => window.removeEventListener('dayform:data-changed', handleChanged);
  }, [load]);

  const dayMap = useMemo(() => {
    const map = new Map<string, PlannerDayDto>();
    calendar?.days.forEach((d) => map.set(d.date, d));
    return map;
  }, [calendar]);

  const selectedDayData = dayMap.get(selectedDate);

  const handleSaveReminder = async (vals: ReminderFormValues) => {
    try {
      const payload = {
        title: vals.title,
        reminderDate: vals.reminderDate,
        reminderTime: vals.reminderTime ? `${vals.reminderTime}:00` : null,
        repeatFrequency: vals.repeatFrequency
      };

      if (editing) {
        await reminderService.update(editing.id, { ...payload, isActive: editing.isActive });
        showToast('Reminder updated');
      } else {
        await reminderService.create(payload);
        showToast('Reminder saved');
        setSelectedDate(vals.reminderDate);
      }
      setFormOpen(false);
      setEditing(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await reminderService.remove(deleting.id);
      showToast('Reminder removed');
      setDeleting(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="v4-page-container">
      {/* Hero Card matching Screenshot 3: Supreme Mastery Mode */}
      <div className="v4-hero-card" style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="v4-hero-badge">
            ⚡ PHASE 4 • WEEK 2
          </span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 9999,
              backdropFilter: 'blur(6px)'
            }}
          >
            📈 84% Velocity
          </span>
        </div>

        <h1 className="v4-hero-title">Supreme Mastery Mode</h1>
        <p className="v4-hero-subtitle">
          Execute with absolute clarity. 4 missions remaining today.
        </p>

        {/* Weekly Sprint Progress Inner Box matching Screenshot 3 */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            borderRadius: 14,
            padding: '10px 14px',
            marginTop: 14,
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>
            <span>🏁 Weekly Sprint Progress</span>
            <span style={{ color: '#A7F3D0' }}>18 / 22 Tasks</span>
          </div>

          <div style={{ height: 6, width: '100%', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 9999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: '82%',
                background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                borderRadius: 9999
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="chips" style={{ margin: '4px 0 10px', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        <button
          type="button"
          className={`chip ${activeTab === 'tasks' ? 'on' : ''}`}
          onClick={() => setTab('tasks')}
          style={activeTab === 'tasks' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Tasks & To-Do
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'calendar' ? 'on' : ''}`}
          onClick={() => setTab('calendar')}
          style={activeTab === 'calendar' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Calendar & Reminders
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'goals' ? 'on' : ''}`}
          onClick={() => setTab('goals')}
          style={activeTab === 'goals' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Goals & Vision
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'roadmap' ? 'on' : ''}`}
          onClick={() => setTab('roadmap')}
          style={activeTab === 'roadmap' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Life Roadmap
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'weeklyreview' ? 'on' : ''}`}
          onClick={() => setTab('weeklyreview')}
          style={activeTab === 'weeklyreview' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Weekly Review
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'challenge' ? 'on' : ''}`}
          onClick={() => setTab('challenge')}
          style={activeTab === 'challenge' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          90-Day Challenge
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'detox' ? 'on' : ''}`}
          onClick={() => setTab('detox')}
          style={activeTab === 'detox' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Digital Detox
        </button>
      </div>

      {activeTab === 'tasks' && <TasksManager onViewCalendar={() => setTab('calendar')} />}
      {activeTab === 'goals' && <GoalsManager />}
      {activeTab === 'roadmap' && <LifeRoadmapView />}
      {activeTab === 'weeklyreview' && <WeeklyReviewView />}
      {activeTab === 'challenge' && <NinetyDayChallengeView />}
      {activeTab === 'detox' && <DigitalDetoxView />}

      {activeTab === 'calendar' && (
        <>
          {loading && !calendar ? <LoadingSkeleton lines={4} /> : null}
          {error && !calendar ? <ErrorState message={error} onRetry={() => load()} /> : null}

          {calendar ? (
            <div className="v4-card">
              <div className="cal-head" style={{ marginBottom: 14 }}>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="ib sm"
                    onClick={() => {
                      const prev = new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1);
                      setMonthCursor(prev);
                    }}
                    aria-label="Previous month"
                  >
                    <DayformIcon name="left" size={15} />
                  </button>
                  <b className="d" style={{ fontSize: 16 }}>
                    {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </b>
                  <button
                    type="button"
                    className="ib sm"
                    onClick={() => {
                      const next = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);
                      setMonthCursor(next);
                    }}
                    aria-label="Next month"
                  >
                    <DayformIcon name="right" size={15} />
                  </button>
                </div>

                <div className="row" style={{ gap: 6 }}>
                  <button
                    type="button"
                    className="btn sec sm"
                    onClick={() => {
                      const now = new Date();
                      setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                      setSelectedDate(today);
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="btn pri sm"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                  >
                    + Reminder
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="cal-grid" style={{ marginBottom: 4 }}>
                {WEEKDAYS.map((w, idx) => (
                  <span key={idx} className="cal-dow">
                    {w}
                  </span>
                ))}
              </div>

              {/* Month Days Grid */}
              <div className="cal-grid">
                {Array.from({ length: monthRange.firstWeekday }).map((_, i) => (
                  <span key={`empty-${i}`} className="cal-cell off" />
                ))}

                {Array.from({ length: monthRange.daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = toIsoDate(new Date(monthRange.y, monthRange.m, dayNum));
                  const dData = dayMap.get(dateStr);
                  const isSel = dateStr === selectedDate;
                  const isTdy = dateStr === today;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      className={`cal-cell ${isSel ? 'sel' : ''} ${isTdy ? 'tdy' : ''}`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      <span className="cal-num">{dayNum}</span>
                      <div className="cal-dots">
                        {(dData?.habitCompletionPercent ?? 0) > 0 && <i className="cal-dot cal-dot-habits" title="Habits logged" />}
                        {((dData?.studyMinutes ?? 0) > 0 || (dData?.studySessions?.length ?? 0) > 0) && (
                          <i className="cal-dot cal-dot-study" title="Study session" />
                        )}
                        {(dData?.memories?.length ?? 0) > 0 && <i className="cal-dot cal-dot-journal" title="Memories & Journal" />}
                        {(dData?.reminders?.length ?? 0) > 0 && <i className="cal-dot cal-dot-reminders" title="Reminder due" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Day Details */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <b style={{ fontSize: 15, fontWeight: 700 }}>
                    {formatDisplayDate(selectedDate)}
                  </b>
                  <button
                    type="button"
                    className="btn sec sm"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                  >
                    + Add Reminder
                  </button>
                </div>

                {selectedDayData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ color: '#0D9488', fontWeight: 600 }}>Habits:</span>
                      <span>
                        {Math.round(selectedDayData.habitCompletionPercent)}% completion score
                      </span>
                    </div>
                    {selectedDayData.studyMinutes > 0 && (
                      <div className="row" style={{ gap: 8 }}>
                        <span style={{ color: '#2563EB', fontWeight: 600 }}>Focus & Study:</span>
                        <span>{formatDurationMinutes(selectedDayData.studyMinutes)}</span>
                      </div>
                    )}
                    {selectedDayData.reminders.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ color: '#D97706', fontWeight: 600 }}>Scheduled Reminders:</span>
                        {selectedDayData.reminders.map((r) => (
                          <span key={r.reminderId} style={{ color: '#4B5563' }}>
                            • {r.title} {r.reminderTime ? `at ${r.reminderTime}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mut" style={{ fontSize: 13, margin: 0 }}>
                    No recorded logs for this date.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* Reminder Sheet & Dialog */}
          <ReminderFormSheet
            isOpen={formOpen}
            editing={editing}
            defaultDate={selectedDate}
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSubmit={handleSaveReminder}
          />

          <ConfirmDialog
            isOpen={Boolean(deleting)}
            title="Delete reminder"
            message={`Delete "${deleting?.title}"?`}
            isBusy={deleteBusy}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleting(null)}
          />
        </>
      )}
    </div>
  );
};
