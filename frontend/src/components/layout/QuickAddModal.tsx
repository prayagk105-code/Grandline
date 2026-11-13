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
          <button type="button" className="btn" style={{ flexDirection: 'column', padding: '18px 10px' }} onClick={() => setMode('habit')}>
            <DayformIcon name="habit" />
            <span>Habit</span>
          </button>
          <button type="button" className="btn" style={{ flexDirection: 'column', padding: '18px 10px' }} onClick={() => setMode('path')}>
            <DayformIcon name="book" />
            <span>Study path</span>
          </button>
          <button type="button" className="btn" style={{ flexDirection: 'column', padding: '18px 10px' }} onClick={() => setMode('session')}>
            <DayformIcon name="clock" />
            <span>Study time</span>
          </button>
          <button type="button" className="btn" style={{ flexDirection: 'column', padding: '18px 10px' }} onClick={() => setMode('memory')}>
            <DayformIcon name="img" />
            <span>Memory</span>
          </button>
          <button type="button" className="btn" style={{ flexDirection: 'column', padding: '18px 10px', gridColumn: 'span 2' }} onClick={() => setMode('reminder')}>
            <DayformIcon name="cal" />
            <span>Reminder</span>
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

