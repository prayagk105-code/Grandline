import React, { useState } from 'react';
import { DayformIcon } from './DayformIcon';
import { SheetModal } from './SheetModal';
import { useToast } from '../../contexts/ToastContext';
import { taskService } from '../../services/taskService';
import { knowledgeService } from '../../services/knowledgeService';
import { goalService } from '../../services/goalService';
import { reminderService } from '../../services/reminderService';
import { financeService } from '../../services/financeService';
import { parseApiError } from '../../services/api/apiError';
import { toIsoDate } from '../../utils/date';

export type QuickCaptureType = 'task' | 'idea' | 'note' | 'goal' | 'reminder' | 'expense' | 'thought';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [captureType, setCaptureType] = useState<QuickCaptureType>('task');
  const [content, setContent] = useState('');
  const [secondary, setSecondary] = useState('');
  const [numberVal, setNumberVal] = useState<number>(0);
  const [category, setCategory] = useState('General');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setContent('');
    setSecondary('');
    setNumberVal(0);
    setCategory('General');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    try {
      if (captureType === 'task') {
        await taskService.create({
          title: content.trim(),
          priority: secondary || 'Medium',
          dueDate: today
        });
        showToast('Task captured! ⚡');
      } else if (captureType === 'idea') {
        await knowledgeService.createIdea({
          title: content.trim(),
          description: secondary.trim() || undefined,
          category: category || 'General',
          status: 'Raw'
        });
        showToast('Idea captured to your incubator! 💡');
      } else if (captureType === 'note' || captureType === 'thought') {
        await knowledgeService.createNote({
          title: content.trim().slice(0, 60),
          content: secondary ? `${content.trim()}\n\n${secondary.trim()}` : content.trim(),
          category: captureType === 'thought' ? 'Thoughts' : (category || 'General'),
          tags: captureType === 'thought' ? 'inbox,thought' : 'quick-capture',
          isFavorite: false
        });
        showToast(captureType === 'thought' ? 'Thought saved to Inbox! 💭' : 'Note recorded! 📝');
      } else if (captureType === 'goal') {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        await goalService.create({
          title: content.trim(),
          description: secondary.trim() || undefined,
          category: category || 'Personal',
          timeframe: 'Yearly',
          startDate: today,
          targetDate: toIsoDate(nextYear)
        });
        showToast('Goal milestone captured! 🎯');
      } else if (captureType === 'reminder') {
        await reminderService.create({
          title: content.trim(),
          reminderDate: secondary || today,
          repeatFrequency: 'Never'
        });
        showToast('Reminder scheduled! 🔔');
      } else if (captureType === 'expense') {
        await financeService.createTransaction({
          type: 'Expense',
          amount: numberVal > 0 ? numberVal : 10,
          category: category || 'General',
          description: content.trim(),
          transactionDate: today
        });
        showToast('Expense logged! 💳');
      }

      window.dispatchEvent(new CustomEvent('dayform:data-changed'));
      handleClose();
    } catch (err) {
      showToast(parseApiError(err, 'Failed to capture item.').message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const types: { key: QuickCaptureType; label: string; icon: string }[] = [
    { key: 'task', label: 'Task', icon: 'check' },
    { key: 'thought', label: 'Thought', icon: 'zap' },
    { key: 'idea', label: 'Idea', icon: 'sun' },
    { key: 'note', label: 'Note', icon: 'book' },
    { key: 'goal', label: 'Goal', icon: 'star' },
    { key: 'reminder', label: 'Reminder', icon: 'bell' },
    { key: 'expense', label: 'Expense', icon: 'wallet' }
  ];

  return (
    <SheetModal isOpen={isOpen} title="Quick Capture" onClose={handleClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p className="mut" style={{ margin: 0, fontSize: 13 }}>
          Dump ideas, tasks, expenses, and thoughts rapidly. Organize or execute later.
        </p>

        {/* Capture Type Selector */}
        <div
          className="chips"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 0
          }}
        >
          {types.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`chip ${captureType === t.key ? 'on' : ''}`}
              onClick={() => {
                setCaptureType(t.key);
                if (t.key === 'expense' && numberVal === 0) setNumberVal(15);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <DayformIcon name={t.icon} size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Main Title / Description Input */}
          <div className="f">
            <label htmlFor="qc-content">
              {captureType === 'task' && 'What needs to be done?'}
              {captureType === 'thought' && 'What is on your mind?'}
              {captureType === 'idea' && 'What is the idea?'}
              {captureType === 'note' && 'Note Title'}
              {captureType === 'goal' && 'What goal do you aspire to achieve?'}
              {captureType === 'reminder' && 'Reminder description'}
              {captureType === 'expense' && 'Expense item / description'}
            </label>
            <input
              id="qc-content"
              type="text"
              autoFocus
              required
              className="inp"
              placeholder={
                captureType === 'task'
                  ? 'e.g., Review project contract'
                  : captureType === 'thought'
                  ? 'e.g., Clarity follows action, not contemplation'
                  : captureType === 'idea'
                  ? 'e.g., Automated habit streak alerts'
                  : captureType === 'expense'
                  ? 'e.g., Coffee with client'
                  : 'Type your thought...'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Secondary Details according to type */}
          {captureType === 'expense' && (
            <div className="row" style={{ gap: 10 }}>
              <div className="f" style={{ flex: 1 }}>
                <label>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="inp"
                  value={numberVal || ''}
                  onChange={(e) => setNumberVal(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="f" style={{ flex: 1 }}>
                <label>Category</label>
                <select className="inp" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Utilities">Utilities</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>
          )}

          {captureType === 'task' && (
            <div className="row" style={{ gap: 10 }}>
              <div className="f" style={{ flex: 1 }}>
                <label>Priority</label>
                <select className="inp" value={secondary || 'Medium'} onChange={(e) => setSecondary(e.target.value)}>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>
          )}

          {(captureType === 'note' || captureType === 'thought' || captureType === 'idea') && (
            <div className="f">
              <label>Additional Context / Details (optional)</label>
              <textarea
                className="inp"
                rows={3}
                placeholder="Elaborate details, lessons, or next steps..."
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
              />
            </div>
          )}

          {captureType === 'reminder' && (
            <div className="f">
              <label>Reminder Date</label>
              <input
                type="date"
                className="inp"
                value={secondary || today}
                onChange={(e) => setSecondary(e.target.value)}
              />
            </div>
          )}

          <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" className="btn sec" onClick={handleClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn pri" disabled={saving || !content.trim()}>
              {saving ? 'Saving...' : 'Capture'}
            </button>
          </div>
        </form>
      </div>
    </SheetModal>
  );
};
