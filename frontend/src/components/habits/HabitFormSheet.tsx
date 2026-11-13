import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { HabitDto } from '../../types/api';
import { DayformIcon, PICKER_ICONS } from '../common/DayformIcon';
import { SheetModal } from '../common/SheetModal';

const schema = z.object({
  name: z.string().trim().min(1, 'Habit name is required').max(120, 'Maximum 120 characters'),
  category: z.string().trim().min(1, 'Category is required').max(50),
  target: z.string().max(160).optional(),
  icon: z.string().min(1),
  isActive: z.boolean()
});

export type HabitFormValues = z.infer<typeof schema>;

interface HabitFormSheetProps {
  isOpen: boolean;
  editing?: HabitDto | null;
  onClose: () => void;
  onSubmit: (values: HabitFormValues) => Promise<void>;
}

const DEFAULT_CATEGORIES = ['Health', 'Learning', 'Mind', 'Lifestyle'];

export const HabitFormSheet: React.FC<HabitFormSheetProps> = ({ isOpen, editing, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<HabitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: 'Health',
      target: '',
      icon: 'sun',
      isActive: true
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: editing?.name ?? '',
        category: editing?.category ?? 'Health',
        target: editing?.target ?? '',
        icon: editing?.icon ?? 'sun',
        isActive: editing?.isActive ?? true
      });
    }
  }, [isOpen, editing, reset]);

  const selectedIcon = watch('icon');

  return (
    <SheetModal isOpen={isOpen} title={editing ? 'Edit habit' : 'New habit'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="f">
          <label htmlFor="habit-name">Habit name</label>
          <input id="habit-name" type="text" placeholder="e.g., Morning walk" {...register('name')} />
          {errors.name ? <div className="field-err">{errors.name.message}</div> : null}
        </div>

        <div className="f">
          <label htmlFor="habit-category">Category</label>
          <input id="habit-category" list="habit-category-list" {...register('category')} />
          <datalist id="habit-category-list">
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {errors.category ? <div className="field-err">{errors.category.message}</div> : null}
        </div>

        <div className="f">
          <label htmlFor="habit-target">Target</label>
          <input id="habit-target" type="text" placeholder="e.g., 20–30 minutes" {...register('target')} />
          {errors.target ? <div className="field-err">{errors.target.message}</div> : null}
        </div>

        <div className="f">
          <label>Icon</label>
          <div className="icons-picker" role="radiogroup" aria-label="Habit icon">
            {PICKER_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={selectedIcon === ic ? 'on' : ''}
                onClick={() => setValue('icon', ic)}
                aria-label={`Icon ${ic}`}
                aria-pressed={selectedIcon === ic}
              >
                <DayformIcon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>

        {editing ? (
          <div className="f">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--ink)' }}>
              <input type="checkbox" {...register('isActive')} />
              <span>Active habit (uncheck to archive)</span>
            </label>
          </div>
        ) : null}

        <button type="submit" className="btn pri f" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Add habit'}
        </button>
      </form>
    </SheetModal>
  );
};

