import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { taskService } from '../../services/taskService';
import type { TaskDto } from '../../types/api';
import { formatDisplayDate } from '../../utils/date';

export const PinnedTasksWidget: React.FC = () => {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await taskService.getAll({ isPinned: true });
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
  }, [load]);

  if (loading || !Array.isArray(tasks) || tasks.length === 0) return null;

  const handleToggle = async (task: TaskDto) => {
    try {
      await taskService.toggleCompletion(task.id);
      showToast('Task completed! Keep the momentum.');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  return (
    <div className="cd" style={{ padding: 20 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 16 }}>📌</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Pinned Critical Actions</h3>
        </div>
        <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>{tasks.length} active</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((t) => (
          <div
            key={t.id}
            className="row"
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--sf)',
              borderRadius: 8
            }}
          >
            <div className="row" style={{ gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleToggle(t)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: '1.5px solid var(--bd)',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
                title="Mark Completed"
                aria-label="Mark Completed"
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                {t.dueDate && (
                  <span className="mut" style={{ fontSize: 11 }}>Due {formatDisplayDate(t.dueDate)}</span>
                )}
              </div>
            </div>

            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 600,
                background: t.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'var(--sf)',
                color: t.priority === 'High' ? '#dc2626' : 'var(--ink)'
              }}
            >
              {t.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
