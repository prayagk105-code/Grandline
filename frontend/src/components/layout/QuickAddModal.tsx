import React, { useEffect, useState } from 'react';
import { habitService } from '../../services/habitService';
import { memoryService } from '../../services/memoryService';
import { reminderService } from '../../services/reminderService';
import { studyService } from '../../services/studyService';
import { parseApiError } from '../../services/api/apiError';
import type { LearningPathDto } from '../../types/api';
import { useToast } from '../../contexts/ToastContext';
import { DayformIcon } from '../common/DayformIcon';
import { SheetModal } from '../common/SheetModal';
import { HabitFormSheet, type HabitFormValues } from '../habits/HabitFormSheet';
import { MemoryFormSheet, type MemoryFormValues } from '../memories/MemoryFormSheet';
import { ReminderFormSheet, type ReminderFormValues } from '../planner/ReminderFormSheet';
import { LearningPathFormSheet, type LearningPathFormValues } from '../study/LearningPathFormSheet';
import { StudySessionFormSheet, type StudySessionFormValues } from '../study/StudySessionFormSheet';

type QuickAddMode = null | 'menu' | 'habit' | 'path' | 'session' | 'memory' | 'reminder';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function emitDataChanged(): void {
  window.dispatchEvent(new CustomEvent('dayform:data-changed'));
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<QuickAddMode>(null);
  const [paths, setPaths] = useState<LearningPathDto[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('menu');
    } else {
      setMode(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'session') {
      studyService.getLearningPaths().then(setPaths).catch(() => setPaths([]));
    }
  }, [mode]);

  const handleCloseAll = () => {
    setMode(null);
    setUploadProgress(null);
    onClose();
  };

  const handleCreateHabit = async (vals: HabitFormValues) => {
    try {
      await habitService.create({
        name: vals.name,
        category: vals.category,
        target: vals.target,
        icon: vals.icon
      });
      showToast('Habit added');
      emitDataChanged();
      handleCloseAll();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleCreatePath = async (vals: LearningPathFormValues) => {
    try {
      await studyService.createLearningPath({
        name: vals.name,
        description: vals.description,
        icon: vals.icon,
        progress: vals.progress,
        targetMinutes: vals.targetMinutes ?? null
      });
      showToast('Learning path created');
      emitDataChanged();
      handleCloseAll();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleCreateSession = async (vals: StudySessionFormValues) => {
    try {
      await studyService.createSession({
        learningPathId: vals.learningPathId || null,
        topic: vals.topic,
        minutes: vals.minutes,
        sessionDate: vals.sessionDate,
        notes: vals.notes
      });
      showToast('Study session logged');
      emitDataChanged();
      handleCloseAll();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleCreateMemory = async (vals: MemoryFormValues, file: File | null) => {
    try {
      const created = await memoryService.create({
        title: vals.title,
        memoryDate: vals.memoryDate,
        category: vals.category,
        icon: vals.icon,
        note: vals.note
      });
      if (file) {
        setUploadProgress(0);
        await memoryService.uploadImage(created.id, file, setUploadProgress);
      }
      showToast('Memory saved');
      emitDataChanged();
      handleCloseAll();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleCreateReminder = async (vals: ReminderFormValues) => {
    try {
      await reminderService.create({
        title: vals.title,
        reminderDate: vals.reminderDate,
        reminderTime: vals.reminderTime ? `${vals.reminderTime}:00` : null,
        repeatFrequency: vals.repeatFrequency
      });
      showToast('Reminder saved');
      emitDataChanged();
      handleCloseAll();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  return (
    <>
      <SheetModal isOpen={isOpen && mode === 'menu'} title="Quick add" onClose={handleCloseAll}>
        <div className="g2">
          <button
            type="button"
            className="btn sec"
            style={{ flexDirection: 'column', padding: '16px 12px', gap: 8, borderRadius: 'var(--radius-lg)' }}
            onClick={() => setMode('habit')}
          >
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--mod-habits-soft)', color: 'var(--mod-habits)', display: 'grid', placeItems: 'center' }}>
              <DayformIcon name="habit" size={18} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Habit</span>
          </button>
          <button
            type="button"
            className="btn sec"
            style={{ flexDirection: 'column', padding: '16px 12px', gap: 8, borderRadius: 'var(--radius-lg)' }}
            onClick={() => setMode('path')}
          >
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--mod-study-soft)', color: 'var(--mod-study)', display: 'grid', placeItems: 'center' }}>
              <DayformIcon name="book" size={18} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Study Path</span>
          </button>
          <button
            type="button"
            className="btn sec"
            style={{ flexDirection: 'column', padding: '16px 12px', gap: 8, borderRadius: 'var(--radius-lg)' }}
            onClick={() => setMode('session')}
          >
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--mod-focus-soft)', color: 'var(--mod-focus)', display: 'grid', placeItems: 'center' }}>
              <DayformIcon name="clock" size={18} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Study Time</span>
          </button>
          <button
            type="button"
            className="btn sec"
            style={{ flexDirection: 'column', padding: '16px 12px', gap: 8, borderRadius: 'var(--radius-lg)' }}
            onClick={() => setMode('memory')}
          >
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--mod-memories-soft)', color: 'var(--mod-memories)', display: 'grid', placeItems: 'center' }}>
              <DayformIcon name="img" size={18} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Memory</span>
          </button>
          <button
            type="button"
            className="btn sec"
            style={{ flexDirection: 'column', padding: '16px 12px', gap: 8, borderRadius: 'var(--radius-lg)', gridColumn: 'span 2' }}
            onClick={() => setMode('reminder')}
          >
            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--mod-planner-soft)', color: 'var(--mod-planner)', display: 'grid', placeItems: 'center' }}>
              <DayformIcon name="cal" size={18} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Reminder</span>
          </button>
        </div>
      </SheetModal>

      <HabitFormSheet isOpen={isOpen && mode === 'habit'} onClose={handleCloseAll} onSubmit={handleCreateHabit} />
      <LearningPathFormSheet isOpen={isOpen && mode === 'path'} onClose={handleCloseAll} onSubmit={handleCreatePath} />
      <StudySessionFormSheet isOpen={isOpen && mode === 'session'} learningPaths={paths} onClose={handleCloseAll} onSubmit={handleCreateSession} />
      <MemoryFormSheet isOpen={isOpen && mode === 'memory'} uploadProgress={uploadProgress} onClose={handleCloseAll} onSubmit={handleCreateMemory} />
      <ReminderFormSheet isOpen={isOpen && mode === 'reminder'} onClose={handleCloseAll} onSubmit={handleCreateReminder} />
    </>
  );
};

