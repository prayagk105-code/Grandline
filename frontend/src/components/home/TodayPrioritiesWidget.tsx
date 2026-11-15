import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { taskService } from '../../services/taskService';
import type { TaskDto } from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

export const TodayPrioritiesWidget: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await taskService.getAll();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handleChanged = () => load();
    window.addEventListener('dayform:data-changed', handleChanged);
    return () => window.removeEventListener('dayform:data-changed', handleChanged);
  }, [load]);

  const handleToggle = async (task: TaskDto) => {
    setTogglingId(task.id);
    try {
      await taskService.toggleCompletion(task.id);
      showToast(task.isCompleted ? 'Task marked pending' : 'Priority task completed! ⚡');
      await load();
      window.dispatchEvent(new CustomEvent('dayform:data-changed'));
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return null;

  // Filter: Incomplete tasks first, sorted by:
  // 1. Overdue tasks
  // 2. Pinned tasks
  // 3. High priority
  // 4. Due date soonest
  const incomplete = tasks.filter((t) => !t.isCompleted);
  const sorted = [...incomplete].sort((a, b) => {
    const aOverdue = Boolean(a.dueDate && a.dueDate < today);
    const bOverdue = Boolean(b.dueDate && b.dueDate < today);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    if (a.isPinnedToDashboard && !b.isPinnedToDashboard) return -1;
    if (!a.isPinnedToDashboard && b.isPinnedToDashboard) return 1;

    if (a.priority === 'High' && b.priority !== 'High') return -1;
    if (a.priority !== 'High' && b.priority === 'High') return 1;

    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  });

  const topPriorities = sorted.slice(0, 4);
  const remainingCount = Math.max(0, sorted.length - 4);

  return (
    <div className="cd home-card-priorities" style={{ borderLeft: '3px solid var(--hot)' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className="mod-icon" style={{ background: 'var(--hot-soft)', color: 'var(--hot)' }}>
            <DayformIcon name="check" size={16} />
          </span>
          <div>
            <b className="d" style={{ fontSize: 16 }}>Today's Priorities</b>
            <div className="mut" style={{ fontSize: 11 }}>Urgent & critical actions</div>
          </div>
        </div>

        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <Link to="/planner?tab=tasks" className="btn sm" style={{ padding: '3px 8px', fontSize: 11 }}>
            + Add
          </Link>
          <Link to="/planner?tab=tasks" className="lk" style={{ fontSize: 12 }}>
            View All <DayformIcon name="right" size={13} />
          </Link>
        </div>
      </div>

      {topPriorities.length === 0 ? (
        <div style={{ padding: '14px 0', textAlign: 'center' }}>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            All clear! No urgent or overdue priorities remaining today.
          </p>
          <Link to="/planner?tab=tasks" className="lk" style={{ fontSize: 12, marginTop: 4 }}>
            Create a task
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {topPriorities.map((t) => {
            const isOverdue = Boolean(t.dueDate && t.dueDate < today);
            const isToday = Boolean(t.dueDate && t.dueDate === today);
            const isToggling = togglingId === t.id;

            return (
              <div
                key={t.id}
                className="row home-priority-row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isOverdue ? 'var(--badge-overdue-bg)' : 'var(--sf)',
                  border: isOverdue
                    ? '1px solid var(--badge-overdue-border)'
                    : '1px solid var(--ln-subtle)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div className="row" style={{ gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleToggle(t)}
                    disabled={isToggling}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: isOverdue
                        ? '1.5px solid var(--badge-overdue-text)'
                        : '1.5px solid var(--ac)',
                      background: 'transparent',
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'grid',
                      placeItems: 'center',
                      padding: 0
                    }}
                    title="Mark Completed"
                    aria-label={`Mark task ${t.title} as completed`}
                  >
                    {isToggling ? (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ac)' }} />
                    ) : null}
                  </button>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--ink)'
                      }}
                    >
                      {t.title}
                    </div>
                    <div className="row" style={{ gap: 8, fontSize: 11, marginTop: 2 }}>
                      {t.dueDate && (
                        <span
                          style={{
                            fontWeight: isOverdue ? 600 : 400,
                            color: isOverdue
                              ? 'var(--badge-overdue-text)'
                              : isToday
                              ? 'var(--badge-completed-text)'
                              : 'var(--mut)'
                          }}
                        >
                          {isOverdue ? '⚠️ Overdue: ' : isToday ? 'Due Today' : 'Due: '}
                          {!isToday && formatDisplayDate(t.dueDate)}
                        </span>
                      )}
                      {t.isPinnedToDashboard && (
                        <span style={{ color: 'var(--ac)', fontWeight: 500 }}>📌 Pinned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                  <span
                    className={`badge ${
                      isOverdue
                        ? 'badge-overdue'
                        : t.priority === 'High'
                        ? 'badge-high'
                        : t.priority === 'Medium'
                        ? 'badge-med'
                        : 'badge-low'
                    } badge-sm`}
                  >
                    {isOverdue ? 'Overdue' : t.priority}
                  </span>
                </div>
              </div>
            );
          })}

          {remainingCount > 0 && (
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <Link to="/planner?tab=tasks" className="mut" style={{ fontSize: 12 }}>
                +{remainingCount} more tasks in Planner
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
