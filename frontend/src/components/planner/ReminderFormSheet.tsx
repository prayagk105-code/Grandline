import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReminderDto } from '../../types/api';
import { toIsoDate } from '../../utils/date';
import { SheetModal } from '../common/SheetModal';

const schema = z.object({
  title: z.string().trim().min(1, 'Reminder title is required').max(200),
  reminderDate: z.string().min(1, 'Date is required'),
  reminderTime: z.string().optional(),
  repeatFrequency: z.enum(['Never', 'Daily', 'Weekly', 'Monthly', 'Yearly'])
});

export type ReminderFormValues = z.infer<typeof schema>;

interface ReminderFormSheetProps {
  isOpen: boolean;
  defaultDate?: string;
  editing?: ReminderDto | null;
  onClose: () => void;
  onSubmit: (values: ReminderFormValues) => Promise<void>;
}

export const ReminderFormSheet: React.FC<ReminderFormSheetProps> = ({
  isOpen,
  defaultDate,
  editing,
  onClose,
  onSubmit
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ReminderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      reminderDate: defaultDate ?? toIsoDate(),
      reminderTime: '',
      repeatFrequency: 'Never'
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        title: editing?.title ?? '',
        reminderDate: editing?.reminderDate ?? defaultDate ?? toIsoDate(),
        reminderTime: editing?.reminderTime ? editing.reminderTime.slice(0, 5) : '',
        repeatFrequency: editing?.repeatFrequency ?? 'Never'
      });
    }
  }, [isOpen, editing, defaultDate, reset]);

  return (
    <SheetModal isOpen={isOpen} title={editing ? 'Edit reminder' : 'New reminder'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="f">
          <label htmlFor="rem-title">What to remember</label>
          <input id="rem-title" type="text" placeholder="e.g., Weekly reset & planning" {...register('title')} />
          {errors.title ? <div className="field-err">{errors.title.message}</div> : null}
        </div>

        <div className="g2">
          <div className="f">
            <label htmlFor="rem-date">Date</label>
            <input id="rem-date" type="date" {...register('reminderDate')} />
            {errors.reminderDate ? <div className="field-err">{errors.reminderDate.message}</div> : null}
          </div>
          <div className="f">
            <label htmlFor="rem-time">Time (optional)</label>
            <input id="rem-time" type="time" {...register('reminderTime')} />
          </div>
        </div>

        <div className="f">
          <label htmlFor="rem-repeat">Repeat</label>
          <select id="rem-repeat" {...register('repeatFrequency')}>
            <option value="Never">Never</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>

        <p className="mut" style={{ marginTop: 0 }}>
          Reminders appear in your Planner calendar and Upcoming list.
        </p>

        <button type="submit" className="btn pri f" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Save reminder'}
        </button>
      </form>
    </SheetModal>
  );
};

