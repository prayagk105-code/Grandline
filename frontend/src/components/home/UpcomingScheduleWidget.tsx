import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';
import { reminderService } from '../../services/reminderService';
import { taskService } from '../../services/taskService';
import type { ReminderDto, TaskDto } from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

interface ScheduleItem {
  id: string;
  title: string;
  type: 'task' | 'reminder';
  date: string;
  time?: string | null;
  priority?: string;
  isOverdue?: boolean;
}

export const UpcomingScheduleWidget: React.FC = () => {
  const today = toIsoDate();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rems, tasks] = await Promise.all([
        reminderService.getAll(true).catch(() => [] as ReminderDto[]),
        taskService.getAll().catch(() => [] as TaskDto[])
      ]);

      const schedule: ScheduleItem[] = [];

      // Add active reminders
      rems.forEach((r) => {
        schedule.push({
          id: `rem-${r.id}`,
          title: r.title,
          type: 'reminder',
          date: r.reminderDate,
          time: r.reminderTime,
          isOverdue: r.reminderDate < today
        });
      });

      // Add incomplete tasks with due dates
      tasks
        .filter((t) => !t.isCompleted && t.dueDate)
        .forEach((t) => {
          schedule.push({
            id: `task-${t.id}`,
            title: t.title,
            type: 'task',
            date: t.dueDate!,
            priority: t.priority,
            isOverdue: t.dueDate! < today
          });
        });

      // Sort chronologically: overdue first, then by date and time
      schedule.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        const cmpDate = a.date.localeCompare(b.date);
        if (cmpDate !== 0) return cmpDate;
        return (a.time || '23:59').localeCompare(b.time || '23:59');
      });

      setItems(schedule);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
    const handleChanged = () => load();
    window.addEventListener('dayform:data-changed', handleChanged);
    return () => window.removeEventListener('dayform:data-changed', handleChanged);
  }, [load]);

  if (loading) return null;

  const initialLimit = 2;
  const visibleItems = expanded ? items : items.slice(0, initialLimit);
  const hasMore = items.length > initialLimit;

  return (
    <div className="cd home-card-schedule">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className="mod-icon mod-icon-planner">
            <DayformIcon name="cal" size={16} />
          </span>
          <div>
            <b className="d" style={{ fontSize: 15 }}>Upcoming Schedule</b>
            <div className="mut" style={{ fontSize: 11 }}>Next agenda & deadlines</div>
          </div>
        </div>
        <Link to="/planner?tab=calendar" className="lk" style={{ fontSize: 12 }}>
          Calendar <DayformIcon name="right" size={13} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <p className="mut" style={{ margin: 0, fontSize: 12 }}>
            No upcoming events or deadlines scheduled.
          </p>
          <Link to="/planner?tab=calendar" className="lk" style={{ fontSize: 12, marginTop: 4 }}>
            + Schedule an event
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visibleItems.map((item) => {
            const isToday = item.date === today;
            const dateLabel = isToday
              ? 'Today'
              : item.isOverdue
              ? 'Overdue'
              : formatDisplayDate(item.date, { month: 'short', day: 'numeric' });

            return (
              <div
                key={item.id}
                className="row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 11px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--cd-sec)',
                  border: item.isOverdue ? '1px solid var(--badge-overdue-border)' : '1px solid var(--ln)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div className="row" style={{ gap: 8, alignItems: 'center', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: item.isOverdue
                        ? 'var(--badge-overdue-text)'
                        : item.type === 'task'
                        ? 'var(--mod-planner)'
                        : 'var(--ac)',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--ink)'
                      }}
                    >
                      {item.title}
                    </div>
                    <div className="mut" style={{ fontSize: 11 }}>
                      {item.type === 'task' ? 'Task deadline' : 'Reminder'}
                      {item.time ? ` · ${item.time.slice(0, 5)}` : ''}
                    </div>
                  </div>
                </div>

                <span
                  className={`badge ${
                    item.isOverdue
                      ? 'badge-overdue'
                      : isToday
                      ? 'badge-completed'
                      : 'badge-low'
                  } badge-sm`}
                  style={{ flexShrink: 0 }}
                >
                  {dateLabel}
                </span>
              </div>
            );
          })}

          {hasMore && (
            <button
              type="button"
              className="home-view-toggle-btn"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  <span>View Less</span>
                  <DayformIcon name="up" size={12} />
                </>
              ) : (
                <>
                  <span>View More ({items.length - initialLimit} remaining)</span>
                  <DayformIcon name="down" size={12} />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
