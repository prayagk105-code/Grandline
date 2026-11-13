import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LearningPathDto, StudySessionDto } from '../../types/api';
import { toIsoDate } from '../../utils/date';
import { SheetModal } from '../common/SheetModal';

const schema = z.object({
  learningPathId: z.string().optional(),
  topic: z.string().trim().min(1, 'Topic is required').max(160),
  minutes: z.coerce.number().int().min(1, 'At least 1 minute').max(1440, 'Max 1440 minutes'),
  sessionDate: z.string().min(1, 'Date is required'),
  notes: z.string().max(1000).optional()
});

export type StudySessionFormValues = z.infer<typeof schema>;

interface StudySessionFormSheetProps {
  isOpen: boolean;
  learningPaths: LearningPathDto[];
  defaultPathId?: string | null;
  editing?: StudySessionDto | null;
  onClose: () => void;
  onSubmit: (values: StudySessionFormValues) => Promise<void>;
}

export const StudySessionFormSheet: React.FC<StudySessionFormSheetProps> = ({
  isOpen,
  learningPaths,
  defaultPathId,
  editing,
  onClose,
  onSubmit
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<StudySessionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      learningPathId: '',
      topic: '',
      minutes: 30,
      sessionDate: toIsoDate(),
      notes: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        learningPathId: editing?.learningPathId ?? defaultPathId ?? '',
        topic: editing?.topic ?? '',
        minutes: editing?.minutes ?? 30,
        sessionDate: editing?.sessionDate ?? toIsoDate(),
        notes: editing?.notes ?? ''
      });
    }
  }, [isOpen, editing, defaultPathId, reset]);

  return (
    <SheetModal isOpen={isOpen} title={editing ? 'Edit study session' : 'Log study time'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="f">
          <label htmlFor="ss-path">Learning path</label>
          <select id="ss-path" {...register('learningPathId')}>
            <option value="">General study</option>
            {learningPaths.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="f">
          <label htmlFor="ss-topic">Topic</label>
          <input id="ss-topic" type="text" placeholder="e.g., Practice exercises" {...register('topic')} />
          {errors.topic ? <div className="field-err">{errors.topic.message}</div> : null}
        </div>

        <div className="g2">
          <div className="f">
            <label htmlFor="ss-mins">Minutes</label>
            <input id="ss-mins" type="number" min={1} max={1440} {...register('minutes')} />
            {errors.minutes ? <div className="field-err">{errors.minutes.message}</div> : null}
          </div>
          <div className="f">
            <label htmlFor="ss-date">Date</label>
            <input id="ss-date" type="date" max={toIsoDate()} {...register('sessionDate')} />
            {errors.sessionDate ? <div className="field-err">{errors.sessionDate.message}</div> : null}
          </div>
        </div>

        <div className="f">
          <label htmlFor="ss-notes">Notes (optional)</label>
          <textarea id="ss-notes" placeholder="Key takeaways…" {...register('notes')} />
        </div>

        <button type="submit" className="btn pri f" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Save session'}
        </button>
      </form>
    </SheetModal>
  );
};

