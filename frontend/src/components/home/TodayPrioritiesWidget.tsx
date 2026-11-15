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

  const load = useCallback(async () => {
    try {
      const data = await taskService.getAll();
      if (Array.isArray(data)) {
        setTasks(data.filter((t) => !t.isCompleted));
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
    try {
      await taskService.toggleCompletion(task.id);
      showToast('Priority task completed! ⚡');
      load();
      window.dispatchEvent(new CustomEvent('dayform:data-changed'));
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  if (loading) return null;

  // Filter top priorities: pinned tasks first, then High priority, then due soonest
  const sorted = [...tasks].sort((a, b) => {
    if (a.isPinnedToDashboard && !b.isPinnedToDashboard) return -1;
    if (!a.isPinnedToDashboard && b.isPinnedToDashboard) return 1;
    if (a.priority === 'High' && b.priority !== 'High') return -1;
    if (a.priority !== 'High' && b.priority === 'High') return 1;
    return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
  });

  const topPriorities = sorted.slice(0, 3);
  const remainingCount = Math.max(0, sorted.length - 3);

  return (
    <div className="cd" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <DayformIcon name="check" size={17} />
          <b className="d" style={{ fontSize: 16 }}>Today's Priorities</b>
        </div>
        <Link to="/planner" className="lk" style={{ fontSize: 13 }}>
          Manage <DayformIcon name="right" size={14} />
        </Link>
      </div>

      {topPriorities.length === 0 ? (
        <p className="mut" style={{ margin: 0, fontSize: 13 }}>
          No pending priority tasks. <Link to="/planner" className="lk">Add one</Link>
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {topPriorities.map((t, idx) => {
            const isOverdue = t.dueDate && t.dueDate < today;
            return (
              <div
                key={t.id}
                className="row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: 'var(--sf)'
                }}
              >
                <div className="row" style={{ gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleToggle(t)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: '1.5px solid var(--bd)',
                      background: 'transparent',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Mark Completed"
                    aria-label="Mark Completed"
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {idx + 1}. {t.title}
                    </div>
                    <div className="row" style={{ gap: 8, fontSize: 11 }}>
                      {t.dueDate && (
                        <span style={{ color: isOverdue ? '#dc2626' : 'var(--mut)' }}>
                          {isOverdue ? 'Overdue: ' : 'Due: '}
                          {formatDisplayDate(t.dueDate)}
                        </span>
                      )}
                      {t.isPinnedToDashboard && <span style={{ color: 'var(--ac)' }}>📌 Pinned</span>}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 6,
                    fontWeight: 600,
                    flexShrink: 0,
                    background:
                      t.priority === 'High'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : t.priority === 'Medium'
                        ? 'rgba(234, 179, 8, 0.15)'
                        : 'var(--sf)',
                    color:
                      t.priority === 'High'
                        ? '#dc2626'
                        : t.priority === 'Medium'
                        ? '#ca8a04'
                        : 'var(--ink)'
                  }}
                >
                  {t.priority}
                </span>
              </div>
            );
          })}

          {remainingCount > 0 && (
            <div style={{ textAlign: 'center', marginTop: 2 }}>
              <Link to="/planner" className="mut" style={{ fontSize: 12 }}>
                +{remainingCount} more tasks in Planner
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
