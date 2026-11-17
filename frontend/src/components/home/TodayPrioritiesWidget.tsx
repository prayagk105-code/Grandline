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

  const incomplete = tasks.filter((t) => !t.isCompleted);
  const completed = tasks.filter((t) => t.isCompleted);

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

  const displayIncomplete = sorted.slice(0, 3);
  const displayCompleted = completed.slice(0, 1);
  const activeCount = incomplete.length;

  return (
    <div className="v4-card cd-priorities home-card-priorities" style={{ marginBottom: 16 }}>
      {/* Header matching Screenshot 1 */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <b style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Today's Priorities</b>
        </div>

        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
            {activeCount} Active
          </span>
          <Link to="/planner?tab=tasks" className="lk" style={{ fontSize: 12, color: '#3B28CC' }}>
            <DayformIcon name="right" size={13} />
          </Link>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            No priorities scheduled. Stay ahead by planning your top mission.
          </p>
          <Link to="/planner?tab=tasks" className="btn sm" style={{ marginTop: 8 }}>
            + Add Task
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Active Priorities */}
          {displayIncomplete.map((t) => {
            const isOverdue = Boolean(t.dueDate && t.dueDate < today);
            const isToday = Boolean(t.dueDate && t.dueDate === today);
            const isToggling = togglingId === t.id;

            return (
              <div key={t.id} className="v4-priority-item home-priority-row">
                <div className="row" style={{ gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: '#EEECFA',
                      color: '#3B28CC',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    <DayformIcon name="check" size={16} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--ink)'
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontSize: 11.5, marginTop: 2, color: isOverdue ? '#DC2626' : '#EF4444', fontWeight: 600 }}>
                      {isOverdue ? 'Overdue' : isToday ? 'Due today' : `Due: ${formatDisplayDate(t.dueDate || today)}`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="v4-claim-btn"
                  onClick={() => handleToggle(t)}
                  disabled={isToggling}
                  title="Claim & Complete Task"
                >
                  {isToggling ? '…' : 'Claim'}
                </button>
              </div>
            );
          })}

          {/* Completed Priorities item preview matching Screenshot 1 */}
          {displayCompleted.map((t) => (
            <div
              key={t.id}
              className="v4-priority-item"
              style={{ background: '#F0FDF4', borderColor: '#DCFCE7' }}
            >
              <div className="row" style={{ gap: 10, alignItems: 'center', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: '#D1FAE5',
                    color: '#065F46',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <DayformIcon name="check" size={16} />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#1E1B4B'
                    }}
                  >
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11.5, marginTop: 2, color: '#059669', fontWeight: 600 }}>
                    Completed today
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(t)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#D1FAE5',
                  color: '#059669',
                  border: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer'
                }}
                title="Mark Incomplete"
              >
                ✓
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
