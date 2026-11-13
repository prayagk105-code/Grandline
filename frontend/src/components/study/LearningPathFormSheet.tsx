import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LearningPathDto } from '../../types/api';
import { DayformIcon, PICKER_ICONS } from '../common/DayformIcon';
import { SheetModal } from '../common/SheetModal';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(140),
  description: z.string().max(500).optional(),
  icon: z.string().min(1),
  progress: z.coerce.number().int().min(0, 'Min 0%').max(100, 'Max 100%'),
  targetMinutes: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().positive('Must be positive').optional()
  ),
  isArchived: z.boolean()
});

export type LearningPathFormValues = z.infer<typeof schema>;

interface LearningPathFormSheetProps {
  isOpen: boolean;
  editing?: LearningPathDto | null;
  onClose: () => void;
  onSubmit: (values: LearningPathFormValues) => Promise<void>;
  onDelete?: (path: LearningPathDto) => void;
}

export const LearningPathFormSheet: React.FC<LearningPathFormSheetProps> = ({
  isOpen,
  editing,
  onClose,
  onSubmit,
  onDelete
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LearningPathFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'book',
      progress: 0,
      targetMinutes: undefined,
      isArchived: false
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: editing?.name ?? '',
        description: editing?.description ?? '',
        icon: editing?.icon ?? 'book',
        progress: editing?.progress ?? 0,
        targetMinutes: editing?.targetMinutes ?? undefined,
        isArchived: editing?.isArchived ?? false
      });
    }
  }, [isOpen, editing, reset]);

  const selectedIcon = watch('icon');

  return (
    <SheetModal isOpen={isOpen} title={editing ? 'Edit learning path' : 'New learning path'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="f">
          <label htmlFor="lp-name">Name</label>
          <input id="lp-name" type="text" placeholder="e.g., System design" {...register('name')} />
          {errors.name ? <div className="field-err">{errors.name.message}</div> : null}
        </div>

        <div className="f">
          <label htmlFor="lp-desc">Description</label>
          <input id="lp-desc" type="text" placeholder="Subjects, chapters or goals" {...register('description')} />
          {errors.description ? <div className="field-err">{errors.description.message}</div> : null}
        </div>

        <div className="g2">
          <div className="f">
            <label htmlFor="lp-progress">Progress (%)</label>
            <input id="lp-progress" type="number" min={0} max={100} {...register('progress')} />
            {errors.progress ? <div className="field-err">{errors.progress.message}</div> : null}
          </div>
          <div className="f">
            <label htmlFor="lp-target">Target minutes (optional)</label>
            <input id="lp-target" type="number" min={1} placeholder="e.g., 1200" {...register('targetMinutes')} />
            {errors.targetMinutes ? <div className="field-err">{errors.targetMinutes.message}</div> : null}
          </div>
        </div>

        <div className="f">
          <label>Icon</label>
          <div className="icons-picker" role="radiogroup" aria-label="Learning path icon">
            {PICKER_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={selectedIcon === ic ? 'on' : ''}
                onClick={() => setValue('icon', ic)}
                aria-label={`Icon ${ic}`}
              >
                <DayformIcon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          {editing && onDelete ? (
            <button
              type="button"
              className="btn dg"
              onClick={() => onDelete(editing)}
              aria-label="Delete learning path"
            >
              <DayformIcon name="trash" size={16} />
            </button>
          ) : null}
          <button type="submit" className="btn pri" style={{ flex: 1 }} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Create path'}
          </button>
        </div>
      </form>
    </SheetModal>
  );
};

