import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
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
  const [reminders, setReminders] = useState<ReminderDto[]>([]);
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
    <>
      <PageHeader
        eyebrow="Design your days & master execution"
        title="Planner & Execution"
        subtitle="Tasks, long-term goals, transformation challenges, and schedule."
        action={
          activeTab === 'calendar' ? (
            <button
              type="button"
              className="btn pri sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              style={{ gap: 6 }}
            >
              <DayformIcon name="plus" size={14} />
              <span>New Reminder</span>
            </button>
          ) : undefined
        }
      />

      {/* Navigation Sub-Tabs */}
      <div className="chips" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={`chip ${activeTab === 'tasks' ? 'on' : ''}`}
          onClick={() => setTab('tasks')}
        >
          Tasks & To-Do
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'goals' ? 'on' : ''}`}
          onClick={() => setTab('goals')}
        >
          Goals & Vision
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'roadmap' ? 'on' : ''}`}
          onClick={() => setTab('roadmap')}
        >
          Life Roadmap
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'calendar' ? 'on' : ''}`}
          onClick={() => setTab('calendar')}
        >
          Calendar & Reminders
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'weeklyreview' ? 'on' : ''}`}
          onClick={() => setTab('weeklyreview')}
        >
          Weekly Review
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'challenge' ? 'on' : ''}`}
          onClick={() => setTab('challenge')}
        >
          90-Day Challenge
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'detox' ? 'on' : ''}`}
          onClick={() => setTab('detox')}
        >
          Digital Detox
        </button>
      </div>

      {activeTab === 'tasks' && <TasksManager />}
      {activeTab === 'goals' && <GoalsManager />}
      {activeTab === 'roadmap' && <LifeRoadmapView />}
      {activeTab === 'weeklyreview' && <WeeklyReviewView />}
      {activeTab === 'challenge' && <NinetyDayChallengeView />}
      {activeTab === 'detox' && <DigitalDetoxView />}

      {activeTab === 'calendar' && (
        <>
          {loading && !calendar ? <LoadingSkeleton lines={6} /> : null}
          {error && !calendar ? <ErrorState message={error} onRetry={() => load()} /> : null}

          {calendar ? (
            <div className="df-grid-2">
              <div className="cd cd-planner">
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
                  <button
                    type="button"
                    className="ib sm"
                    onClick={() => setMonthCursor(new Date(monthRange.y, monthRange.m - 1, 1))}
                    aria-label="Previous month"
                    title="Previous Month"
                  >
                    <DayformIcon name="left" size={14} />
                  </button>
                  <b className="d" style={{ fontSize: 16 }}>
                    {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </b>
                  <button
                    type="button"
                    className="ib sm"
                    onClick={() => setMonthCursor(new Date(monthRange.y, monthRange.m + 1, 1))}
                    aria-label="Next month"
                    title="Next Month"
                  >
                    <DayformIcon name="right" size={14} />
                  </button>
                </div>

                <div className="cal" role="grid" aria-label="Monthly planner calendar">
                  {WEEKDAYS.map((w, idx) => (
                    <span key={idx} className="cal-head">
                      {w}
                    </span>
                  ))}
                  {Array.from({ length: monthRange.firstWeekday }).map((_, i) => (
                    <span key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: monthRange.daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = toIsoDate(new Date(monthRange.y, monthRange.m, dayNum));
                    const info = dayMap.get(dateStr);
                    const isFuture = dateStr > today;
                    const levelClass = isFuture
                      ? 'z'
                      : info && info.habitIntensityLevel > 0
                        ? `a${info.habitIntensityLevel}`
                        : '';
                    const hasReminders = (info?.reminders.length ?? 0) > 0;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        className={`cal-day ${levelClass} ${dateStr === today ? 'tdy' : ''} ${dateStr === selectedDate ? 'sel' : ''} ${hasReminders ? 'rm' : ''}`}
                        onClick={() => setSelectedDate(dateStr)}
                        aria-label={`${formatDisplayDate(dateStr)}`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="g">
                <div className="cd cd-planner">
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span className="mod-icon mod-icon-planner" style={{ width: 28, height: 28 }}>
                        <DayformIcon name="cal" size={14} />
                      </span>
                      <b className="d" style={{ fontSize: 16 }}>
                        {formatDisplayDate(selectedDate)}
                      </b>
                    </div>
                    {selectedDate === today && (
                      <span className="badge badge-completed badge-sm">
                        Today
                      </span>
                    )}
                  </div>

                  <p className="mut" style={{ margin: '0 0 14px', fontSize: 13 }}>
                    Habits completed: {selectedDayData?.habitCompletionPercent ? `${Math.round(selectedDayData.habitCompletionPercent)}%` : '0%'}
                    {selectedDayData?.studyMinutes
                      ? ` · Study logged: ${formatDurationMinutes(selectedDayData.studyMinutes)}`
                      : ''}
                  </p>

                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      Reminders for this day
                    </span>
                    <button
                      type="button"
                      className="btn sm"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {(selectedDayData?.reminders.length ?? 0) === 0 ? (
                    <p className="mut" style={{ fontSize: 13, margin: '8px 0' }}>
                      No reminders scheduled for this date.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {selectedDayData?.reminders.map((r) => {
                        const original = reminders.find((rem) => rem.id === r.reminderId);
                        return (
                          <div
                            key={`${r.reminderId}-${r.occurrenceDate}`}
                            className="row"
                            style={{
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: 'var(--card-planner-inner-bg)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--card-planner-inner-border)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                              {r.reminderTime && (
                                <span className="mut" style={{ fontSize: 11 }}>
                                  {r.reminderTime.slice(0, 5)}
                                </span>
                              )}
                            </div>
                            {original && (
                              <div className="row" style={{ gap: 4 }}>
                                <button
                                  type="button"
                                  className="ib sm"
                                  onClick={() => {
                                    setEditing(original);
                                    setFormOpen(true);
                                  }}
                                  aria-label="Edit reminder"
                                >
                                  <DayformIcon name="pen" size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="ib sm"
                                  onClick={() => setDeleting(original)}
                                  aria-label="Delete reminder"
                                >
                                  <DayformIcon name="trash" size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          <ReminderFormSheet
            isOpen={formOpen}
            defaultDate={selectedDate}
            editing={editing}
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
    </>
  );
};
