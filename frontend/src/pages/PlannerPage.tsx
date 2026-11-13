import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { ReminderFormSheet, type ReminderFormValues } from '../components/planner/ReminderFormSheet';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { reminderService } from '../services/reminderService';
import type { PlannerCalendarDto, PlannerDayDto, ReminderDto } from '../types/api';
import { formatDisplayDate, formatDurationMinutes, toIsoDate } from '../utils/date';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const PlannerPage: React.FC = () => {
  const [params] = useSearchParams();
  const { showToast } = useToast();
  const today = toIsoDate();

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

  const upcomingReminders = useMemo(
    () => reminders.filter((r) => r.reminderDate >= today || r.repeatFrequency !== 'Never'),
    [reminders, today]
  );

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
        eyebrow="Make room for what’s ahead"
        title="Planner"
        subtitle="Dates, plans and reminders."
        action={
          <button
            type="button"
            className="ib"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            aria-label="New reminder"
          >
            <DayformIcon name="plus" />
          </button>
        }
      />

      {loading && !calendar ? <LoadingSkeleton lines={6} /> : null}
      {error && !calendar ? <ErrorState message={error} onRetry={() => load()} /> : null}

      {calendar ? (
        <div className="df-grid-2">
          <div className="cd">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <button
                type="button"
                className="ib"
                onClick={() => setMonthCursor(new Date(monthRange.y, monthRange.m - 1, 1))}
                aria-label="Previous month"
              >
                <DayformIcon name="left" />
              </button>
              <b className="d" style={{ fontSize: 17 }}>
                {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </b>
              <button
                type="button"
                className="ib"
                onClick={() => setMonthCursor(new Date(monthRange.y, monthRange.m + 1, 1))}
                aria-label="Next month"
              >
                <DayformIcon name="right" />
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
                    aria-pressed={dateStr === selectedDate}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="sec" style={{ marginTop: 0 }}>
              <h2>{formatDisplayDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
              <span className="eyebrow">
                {Math.round(selectedDayData?.habitCompletionPercent ?? 0)}% habits
              </span>
            </div>

            <div className="cd">
              {selectedDayData &&
              (selectedDayData.reminders.length > 0 ||
                selectedDayData.studySessions.length > 0 ||
                selectedDayData.memories.length > 0) ? (
                <>
                  {selectedDayData.reminders.map((r, idx) => (
                    <div key={`${r.reminderId}-${idx}`} className="li">
                      <span className="ic">
                        <DayformIcon name="bell" />
                      </span>
                      <div className="g">
                        <b>{r.title}</b>
                        <small>
                          {r.reminderTime ? r.reminderTime.slice(0, 5) : 'Any time'} · {r.repeatFrequency}
                          {r.isRecurringInstance ? ' (recurring)' : ''}
                        </small>
                      </div>
                    </div>
                  ))}

                  {selectedDayData.studySessions.length > 0 ? (
                    <div className="li">
                      <span className="ic">
                        <DayformIcon name="clock" />
                      </span>
                      <div className="g">
                        <b>{formatDurationMinutes(selectedDayData.studyMinutes)} studied</b>
                        <small>
                          {selectedDayData.studySessionCount} session
                          {selectedDayData.studySessionCount > 1 ? 's' : ''}
                        </small>
                      </div>
                    </div>
                  ) : null}

                  {selectedDayData.memories.map((m) => (
                    <div key={m.id} className="li">
                      <span className="ic">
                        <DayformIcon name={m.icon || 'star'} />
                      </span>
                      <div className="g">
                        <b>{m.title}</b>
                        <small>Memory · {m.category}</small>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="mut" style={{ margin: 0 }}>Nothing logged on this day.</p>
              )}
            </div>

            <div className="sec">
              <h2>Upcoming reminders</h2>
              <button
                type="button"
                className="lk"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <DayformIcon name="plus" size={14} /> Add
              </button>
            </div>

            <div className="cd">
              {upcomingReminders.length > 0 ? (
                upcomingReminders.map((r) => (
                  <div key={r.id} className="li">
                    <span className="ic d" style={{ fontWeight: 700 }}>
                      {new Date(`${r.reminderDate}T12:00:00`).getDate()}
                    </span>
                    <div className="g">
                      <b>{r.title}</b>
                      <small>
                        {formatDisplayDate(r.reminderDate)} · {r.reminderTime ? r.reminderTime.slice(0, 5) : 'Any time'} ·{' '}
                        {r.repeatFrequency}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="ib sm"
                      onClick={() => {
                        setEditing(r);
                        setFormOpen(true);
                      }}
                      aria-label={`Edit ${r.title}`}
                    >
                      <DayformIcon name="pen" size={14} />
                    </button>
                    <button
                      type="button"
                      className="ib sm"
                      onClick={() => setDeleting(r)}
                      aria-label={`Delete ${r.title}`}
                    >
                      <DayformIcon name="trash" size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="mut" style={{ margin: 0 }}>No upcoming reminders.</p>
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
        message={`Remove "${deleting?.title}"?`}
        isBusy={deleteBusy}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
};

