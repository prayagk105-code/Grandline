import React, { useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SheetModal } from '../common/SheetModal';
import { useToast } from '../../contexts/ToastContext';
import { taskService, type CreateTaskPayload } from '../../services/taskService';
import type { TaskDto } from '../../types/api';
import { toIsoDate, formatDisplayDate } from '../../utils/date';
import { parseApiError } from '../../services/api/apiError';

export const TasksManager: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterView, setFilterView] = useState<'today' | 'upcoming' | 'all' | 'archived'>('today');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('Medium');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskDto | null>(null);

  // Modal form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('Medium');
  const [formDueDate, setFormDueDate] = useState(today);
  const [formDueTime, setFormDueTime] = useState('');
  const [formRecurrence, setFormRecurrence] = useState('None');
  const [formPinned, setFormPinned] = useState(false);
  const [formSubtasks, setFormSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getAll();
      setTasks(data);
    } catch (err) {
      showToast(parseApiError(err, 'Could not load tasks.').message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      const payload: CreateTaskPayload = {
        title: quickTitle.trim(),
        priority: quickPriority,
        dueDate: today,
        recurrence: 'None',
        isPinnedToDashboard: false
      };
      const created = await taskService.create(payload);
      setTasks((prev) => [created, ...prev]);
      setQuickTitle('');
      showToast('Task added');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to add task.').message);
    }
  };

  const handleToggle = async (task: TaskDto) => {
    try {
      const updated = await taskService.toggleCompletion(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      showToast(updated.isCompleted ? 'Task completed! ✨' : 'Task reopened');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to update task.').message);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    try {
      const updatedSub = await taskService.toggleSubtask(taskId, subtaskId);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((st) => (st.id === subtaskId ? updatedSub : st))
          };
        })
      );
    } catch (err) {
      showToast(parseApiError(err, 'Failed to update subtask.').message);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormPriority('Medium');
    setFormDueDate(today);
    setFormDueTime('');
    setFormRecurrence('None');
    setFormPinned(false);
    setFormSubtasks([]);
    setModalOpen(true);
  };

  const openEditModal = (task: TaskDto) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate || today);
    setFormDueTime(task.dueTime || '');
    setFormRecurrence(task.recurrence || 'None');
    setFormPinned(task.isPinnedToDashboard);
    setFormSubtasks(task.subtasks.map((st) => st.title));
    setModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      if (editingTask) {
        const updated = await taskService.update(editingTask.id, {
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          priority: formPriority,
          dueDate: formDueDate || undefined,
          dueTime: formDueTime || undefined,
          isCompleted: editingTask.isCompleted,
          isPinnedToDashboard: formPinned,
          recurrence: formRecurrence
        });
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
        showToast('Task updated');
      } else {
        const created = await taskService.create({
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          priority: formPriority,
          dueDate: formDueDate || undefined,
          dueTime: formDueTime || undefined,
          isPinnedToDashboard: formPinned,
          recurrence: formRecurrence,
          subtasks: formSubtasks.filter(Boolean)
        });
        setTasks((prev) => [created, ...prev]);
        showToast('Task created');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(parseApiError(err, 'Failed to save task.').message);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      await taskService.remove(deletingTask.id);
      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      showToast('Task deleted');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to delete task.').message);
    } finally {
      setDeletingTask(null);
    }
  };

  const handleAddSubtaskDraft = () => {
    if (!newSubtaskInput.trim()) return;
    setFormSubtasks([...formSubtasks, newSubtaskInput.trim()]);
    setNewSubtaskInput('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;

    if (filterView === 'archived') return t.isCompleted;
    if (filterView === 'today') {
      return !t.isCompleted && (!t.dueDate || t.dueDate <= today);
    }
    if (filterView === 'upcoming') {
      return !t.isCompleted && t.dueDate && t.dueDate > today;
    }
    // all active
    return !t.isCompleted;
  });

  const overdueCount = tasks.filter((t) => !t.isCompleted && t.dueDate && t.dueDate < today).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="cd task-quick-add-form" style={{ padding: '10px 14px', marginBottom: 0 }}>
        <input
          type="text"
          placeholder="Quick add a new task for today..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          className="task-quick-add-input"
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14 }}
        />
        <div className="task-quick-add-controls">
          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value)}
            style={{ border: '1px solid var(--ln)', background: 'var(--sf)', padding: '5px 8px', borderRadius: 8, fontSize: 12 }}
          >
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
          <button type="submit" className="btn pri" style={{ padding: '6px 14px', fontSize: 13 }}>
            Add
          </button>
          <button type="button" className="btn sec" onClick={openCreateModal} style={{ padding: '6px 12px', fontSize: 13 }}>
            Details
          </button>
        </div>
      </form>

      {/* Filter Tabs & Overdue Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div className="chips" style={{ marginBottom: 0 }}>
          {(['today', 'upcoming', 'all', 'archived'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilterView(v)}
              className={`chip ${filterView === v ? 'on' : ''}`}
            >
              {v === 'today' ? "Today's Tasks" : v === 'upcoming' ? 'Upcoming' : v === 'all' ? 'All Active' : 'Completed Archive'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {overdueCount > 0 && filterView !== 'archived' && (
            <span className="badge badge-overdue">
              ⚠️ {overdueCount} Overdue
            </span>
          )}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ border: '1px solid var(--ln)', background: 'var(--cd)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12.5 }}
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--mut)' }}>Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="cd" style={{ padding: 32, textAlign: 'center', color: 'var(--mut)' }}>
          <div style={{ margin: '0 auto 8px', opacity: 0.5 }}>
            <DayformIcon name="cal" size={28} />
          </div>
          <p style={{ margin: 0 }}>
            {filterView === 'archived' ? 'No completed tasks archived yet.' : 'No tasks match this filter. Add one above!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredTasks.map((t) => {
            const isOverdue = !t.isCompleted && t.dueDate && t.dueDate < today;
            const priorityClass =
              t.priority === 'High' ? 'badge-high' : t.priority === 'Medium' ? 'badge-med' : 'badge-low';
            return (
              <div
                key={t.id}
                className="cd"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: '14px 16px',
                  marginBottom: 8,
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: `3px solid ${
                    t.isCompleted
                      ? 'var(--mut)'
                      : t.priority === 'High'
                      ? 'var(--hot)'
                      : t.priority === 'Medium'
                      ? 'var(--badge-med-text)'
                      : 'var(--ac)'
                  }`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleToggle(t)}
                    aria-label={t.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 'var(--radius-xs)',
                      border: t.isCompleted ? '1.5px solid #287447' : '1.5px solid var(--ln)',
                      background: t.isCompleted ? '#287447' : 'var(--cd)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t.isCompleted && <span style={{ fontSize: 13, lineHeight: 1 }}>✓</span>}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          textDecoration: t.isCompleted ? 'line-through' : 'none',
                          color: t.isCompleted ? 'var(--mut)' : 'var(--ink)'
                        }}
                      >
                        {t.title}
                      </span>
                      {t.isPinnedToDashboard && (
                        <span title="Pinned to dashboard" style={{ fontSize: 12 }}>📌</span>
                      )}
                      {t.recurrence && t.recurrence !== 'None' && (
                        <span style={{ fontSize: 11, color: 'var(--mut)', background: 'var(--sf)', padding: '2px 6px', borderRadius: 4 }}>
                          🔄 {t.recurrence}
                        </span>
                      )}
                      <span className={`badge ${priorityClass} badge-sm`}>
                        {t.priority}
                      </span>
                      {isOverdue && (
                        <span className="badge badge-overdue badge-sm">
                          Overdue
                        </span>
                      )}
                      {t.isCompleted && (
                        <span className="badge badge-completed badge-sm">
                          Done
                        </span>
                      )}
                    </div>

                    {t.description && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--mut)' }}>{t.description}</p>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--mut)', flexWrap: 'wrap' }}>
                      {t.dueDate && (
                        <span style={{ color: isOverdue ? 'var(--hot)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                          📅 {formatDisplayDate(t.dueDate)} {t.dueTime ? `@ ${t.dueTime}` : ''}
                        </span>
                      )}
                      {t.subtasks.length > 0 && (
                        <span>
                          Checklist: {t.subtasks.filter((s) => s.isCompleted).length}/{t.subtasks.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="ib" onClick={() => openEditModal(t)} aria-label="Edit task">
                      <DayformIcon name="pen" size={14} />
                    </button>
                    <button type="button" className="ib" onClick={() => setDeletingTask(t)} aria-label="Delete task">
                      <DayformIcon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                {/* Subtasks checklist */}
                {t.subtasks.length > 0 && (
                  <div style={{ marginLeft: 34, paddingTop: 6, borderTop: '1px dashed var(--ln)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {t.subtasks.map((st) => (
                      <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={st.isCompleted}
                          onChange={() => handleToggleSubtask(t.id, st.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ textDecoration: st.isCompleted ? 'line-through' : 'none', color: st.isCompleted ? 'var(--mut)' : 'var(--ink)' }}>
                          {st.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Edit/Create Sheet */}
      <SheetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTask ? 'Edit Task' : 'New Task'}>
        <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="f">
            <label>Task Title *</label>
            <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Prepare system architectural review" />
          </div>

          <div className="f">
            <label>Description / Notes</label>
            <textarea rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Add context or notes..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="f">
              <label>Priority</label>
              <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="f">
              <label>Recurrence</label>
              <select value={formRecurrence} onChange={(e) => setFormRecurrence(e.target.value)}>
                <option value="None">None</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="f">
              <label>Due Date</label>
              <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
            </div>
            <div className="f">
              <label>Due Time (Optional)</label>
              <input type="time" value={formDueTime} onChange={(e) => setFormDueTime(e.target.value)} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={formPinned} onChange={(e) => setFormPinned(e.target.checked)} />
            <span>Pin this important task to dashboard</span>
          </label>

          {/* Subtasks addition if creating */}
          {!editingTask && (
            <div className="f">
              <label>Subtasks</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  placeholder="Add actionable subtask..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtaskDraft();
                    }
                  }}
                />
                <button type="button" className="btn sec" onClick={handleAddSubtaskDraft}>
                  Add
                </button>
              </div>
              {formSubtasks.length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 13 }}>
                  {formSubtasks.map((st, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      {st}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn sec" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn pri">
              Save Task
            </button>
          </div>
        </form>
      </SheetModal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={Boolean(deletingTask)}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
};
