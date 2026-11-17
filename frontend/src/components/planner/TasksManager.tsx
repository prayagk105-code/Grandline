import React, { useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SheetModal } from '../common/SheetModal';
import { useToast } from '../../contexts/ToastContext';
import { taskService, type CreateTaskPayload } from '../../services/taskService';
import type { TaskDto } from '../../types/api';
import { toIsoDate, formatDisplayDate } from '../../utils/date';
import { parseApiError } from '../../services/api/apiError';

interface TasksManagerProps {
  onViewCalendar?: () => void;
}

export const TasksManager: React.FC<TasksManagerProps> = ({ onViewCalendar }) => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const filterPriority = 'All';
  const [filterView, setFilterView] = useState<'today' | 'upcoming' | 'all' | 'archived'>('today');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState('High');

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
      showToast('Task added to Planner');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to add task.').message);
    }
  };

  const handleToggle = async (task: TaskDto) => {
    try {
      const updated = await taskService.toggleCompletion(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      showToast(updated.isCompleted ? 'Task completed! ✨' : 'Task reopened');
      window.dispatchEvent(new CustomEvent('dayform:data-changed'));
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
      window.dispatchEvent(new CustomEvent('dayform:data-changed'));
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
      window.dispatchEvent(new CustomEvent('dayform:data-changed'));
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

  const todayTasks = tasks.filter((t) => !t.isCompleted && (!t.dueDate || t.dueDate <= today));
  const upcomingTasks = tasks.filter((t) => !t.isCompleted && t.dueDate && t.dueDate > today);
  const allActiveTasks = tasks.filter((t) => !t.isCompleted);
  const archivedTasks = tasks.filter((t) => t.isCompleted);

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;

    if (filterView === 'archived') return t.isCompleted;
    if (filterView === 'today') {
      return !t.isCompleted && (!t.dueDate || t.dueDate <= today);
    }
    if (filterView === 'upcoming') {
      return !t.isCompleted && t.dueDate && t.dueDate > today;
    }
    return !t.isCompleted;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Quick Dispatch (AI ASSISTED) matching Screenshot 3 */}
      <div className="v4-quick-dispatch-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#3B28CC' }}>
              <DayformIcon name="zap" size={16} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>Quick Dispatch</span>
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#6366F1', letterSpacing: '0.06em' }}>
            AI ASSISTED
          </span>
        </div>

        <form onSubmit={handleQuickAdd} className="v4-dispatch-input-row">
          <input
            type="text"
            placeholder="What needs supreme execution today..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="v4-dispatch-input"
          />
          <button type="submit" className="v4-dispatch-send-btn" title="Dispatch Task">
            ↑
          </button>
        </form>

        <div className="row" style={{ gap: 8, alignItems: 'center', marginTop: 4 }}>
          {[
            { label: 'Urgent', color: '#EF4444', bg: '#FEE2E2' },
            { label: 'High', color: '#B45309', bg: '#FEF3C7' },
            { label: 'Medium', color: '#0D9488', bg: '#CCFBF1' }
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setQuickPriority(p.label)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: quickPriority === p.label ? p.bg : '#F9FAFB',
                color: quickPriority === p.label ? p.color : '#6B7280',
                border: quickPriority === p.label ? `1px solid ${p.color}` : '1px solid #E5E7EB',
                borderRadius: 9999,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
              {p.label}
            </button>
          ))}

          <button
            type="button"
            onClick={openCreateModal}
            className="lk"
            style={{ fontSize: 11.5, marginLeft: 'auto', color: '#3B28CC' }}
          >
            + Full Task Form
          </button>
        </div>
      </div>

      {/* Filter Tabs matching Screenshot 3: Today (N), Upcoming, Active, Archive */}
      <div className="chips" style={{ gap: 6, margin: '2px 0 8px' }}>
        <button
          type="button"
          onClick={() => setFilterView('today')}
          className={`chip ${filterView === 'today' ? 'on' : ''}`}
          style={filterView === 'today' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Today ({todayTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterView('upcoming')}
          className={`chip ${filterView === 'upcoming' ? 'on' : ''}`}
          style={filterView === 'upcoming' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Upcoming ({upcomingTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterView('all')}
          className={`chip ${filterView === 'all' ? 'on' : ''}`}
          style={filterView === 'all' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Active ({allActiveTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterView('archived')}
          className={`chip ${filterView === 'archived' ? 'on' : ''}`}
          style={filterView === 'archived' ? { background: '#3B28CC', color: '#FFFFFF', fontWeight: 700 } : undefined}
        >
          Archive ({archivedTasks.length})
        </button>
      </div>

      {/* Task List matching Screenshot 3 */}
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#6B7280' }}>Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="v4-card" style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>
          <div style={{ margin: '0 auto 8px', opacity: 0.5 }}>
            <DayformIcon name="cal" size={28} />
          </div>
          <p style={{ margin: 0, fontSize: 13.5 }}>
            {filterView === 'archived' ? 'No completed tasks in archive.' : 'No missions match this view. Add one above!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredTasks.map((t) => {
            const isCompleted = t.isCompleted;
            const priorityBadge =
              t.priority === 'High'
                ? { bg: '#FEE2E2', color: '#DC2626', label: 'URGENT' }
                : t.priority === 'Medium'
                ? { bg: '#EDE9FE', color: '#6D28D9', label: 'HIGH' }
                : { bg: '#E0F2FE', color: '#0369A1', label: 'LOW' };

            return (
              <div key={t.id} className="v4-task-card">
                {/* Top Row: Checkbox + Priority Badge + Due Time / Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggle(t)}
                      aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: isCompleted ? 'none' : '1.5px solid #CBD5E1',
                        background: isCompleted ? '#0D9488' : '#FFFFFF',
                        color: '#FFFFFF',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {isCompleted && '✓'}
                    </button>

                    <span
                      style={{
                        background: priorityBadge.bg,
                        color: priorityBadge.color,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 6,
                        letterSpacing: '0.04em'
                      }}
                    >
                      {priorityBadge.label}
                    </span>
                  </div>

                  <span style={{ fontSize: 11.5, color: '#6B7280', fontWeight: 600 }}>
                    {isCompleted ? 'Completed' : t.dueTime || (t.dueDate ? formatDisplayDate(t.dueDate) : '09:30 AM')}
                  </span>
                </div>

                {/* Title */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isCompleted ? '#9CA3AF' : '#1E1B4B',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    margin: '2px 0'
                  }}
                >
                  {t.title}
                </div>

                {/* Bottom Row: Category & Streak Badges + Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                    <span
                      style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 6
                      }}
                    >
                      Engineering
                    </span>

                    <span
                      style={{
                        background: '#CCFBF1',
                        color: '#0F766E',
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6
                      }}
                    >
                      🔥 Day 5 Streak
                    </span>
                  </div>

                  <div className="row" style={{ gap: 4 }}>
                    <button
                      type="button"
                      className="ib sm"
                      onClick={() => openEditModal(t)}
                      aria-label="Edit task"
                      style={{ width: 26, height: 26, border: 'none', background: '#F3F4F6' }}
                    >
                      <DayformIcon name="pen" size={13} />
                    </button>
                    <button
                      type="button"
                      className="ib sm"
                      onClick={() => setDeletingTask(t)}
                      aria-label="Delete task"
                      style={{ width: 26, height: 26, border: 'none', background: '#FEE2E2', color: '#DC2626' }}
                    >
                      <DayformIcon name="trash" size={13} />
                    </button>
                  </div>
                </div>

                {/* Subtasks checklist if any */}
                {t.subtasks && t.subtasks.length > 0 && (
                  <div style={{ paddingTop: 6, borderTop: '1px solid #EEF2F6', marginTop: 4 }}>
                    {t.subtasks.map((st) => (
                      <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', margin: '3px 0' }}>
                        <input
                          type="checkbox"
                          checked={st.isCompleted}
                          onChange={() => handleToggleSubtask(t.id, st.id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ textDecoration: st.isCompleted ? 'line-through' : 'none', color: st.isCompleted ? '#9CA3AF' : '#1E1B4B' }}>
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

      {/* Timeline Overview matching Screenshot 3 */}
      <div className="v4-card" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#0D9488' }}>
              <DayformIcon name="cal" size={16} />
            </span>
            <div>
              <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>
                Timeline Overview
              </h3>
              <p style={{ fontSize: 11.5, color: '#6B7280', margin: '2px 0 0' }}>
                Today's active sync blocks
              </p>
            </div>
          </div>

          <button
            type="button"
            className="lk"
            style={{ fontSize: 12, fontWeight: 700, color: '#3B28CC' }}
            onClick={onViewCalendar}
          >
            View All
          </button>
        </div>

        {/* Sync Block 1 */}
        <div className="v4-timeline-block">
          <div style={{ width: 3, background: '#3B28CC', borderRadius: 999 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#3B28CC' }}>
                09:00 AM – 10:30 AM
              </span>
              <span style={{ background: '#EEECFA', color: '#3B28CC', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                Live Sync
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>
              Sprint Kickoff & Core Architecture Alignment
            </div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>
              Conference Room Alpha • 12 Attendees
            </div>
          </div>
        </div>

        {/* Sync Block 2 */}
        <div className="v4-timeline-block">
          <div style={{ width: 3, background: '#0D9488', borderRadius: 999 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0D9488' }}>
                11:30 AM – 12:15 PM
              </span>
              <span style={{ background: '#CCFBF1', color: '#0F766E', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                Review
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B' }}>
              Design System Token Review & Accessibility Audit
            </div>
            <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>
              Virtual Workspace • Design Lead
            </div>
          </div>
        </div>
      </div>

      {/* Edit / Create Task Sheet */}
      <SheetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create Task'}
      >
        <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="lbl">Task title</label>
            <input
              type="text"
              className="inp"
              placeholder="What needs to be done?"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="lbl">Description (optional)</label>
            <textarea
              className="inp"
              rows={2}
              placeholder="Notes, links, or context..."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
          </div>

          <div className="g2">
            <div>
              <label className="lbl">Priority</label>
              <select className="inp" value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label className="lbl">Recurrence</label>
              <select className="inp" value={formRecurrence} onChange={(e) => setFormRecurrence(e.target.value)}>
                <option value="None">None</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="g2">
            <div>
              <label className="lbl">Due date</label>
              <input type="date" className="inp" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
            </div>
            <div>
              <label className="lbl">Due time (optional)</label>
              <input type="time" className="inp" value={formDueTime} onChange={(e) => setFormDueTime(e.target.value)} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formPinned}
              onChange={(e) => setFormPinned(e.target.checked)}
            />
            <span>Pin to Home Dashboard</span>
          </label>

          {/* Subtasks Draft */}
          <div>
            <label className="lbl">Subtasks Checklist</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                className="inp"
                placeholder="Add subtask..."
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
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
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                {formSubtasks.map((st, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {st}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn sec" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn pri">
              Save Task
            </button>
          </div>
        </form>
      </SheetModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingTask)}
        title="Delete task"
        message={`Delete "${deletingTask?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
};
