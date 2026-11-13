import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MemoryCategory, MemoryDto } from '../../types/api';
import { toIsoDate } from '../../utils/date';
import { DayformIcon, PICKER_ICONS } from '../common/DayformIcon';
import { SheetModal } from '../common/SheetModal';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  memoryDate: z.string().min(1, 'Date is required'),
  category: z.enum(['Everyday', 'Travel', 'Milestone']),
  icon: z.string().min(1),
  note: z.string().max(2000).optional()
});

export type MemoryFormValues = z.infer<typeof schema>;

interface MemoryFormSheetProps {
  isOpen: boolean;
  editing?: MemoryDto | null;
  uploadProgress?: number | null;
  onClose: () => void;
  onSubmit: (values: MemoryFormValues, file: File | null) => Promise<void>;
  onRemoveExistingImage?: (memoryId: string) => Promise<void>;
}

export const MemoryFormSheet: React.FC<MemoryFormSheetProps> = ({
  isOpen,
  editing,
  uploadProgress,
  onClose,
  onSubmit,
  onRemoveExistingImage
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<MemoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      memoryDate: toIsoDate(),
      category: 'Everyday',
      icon: 'sun',
      note: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        title: editing?.title ?? '',
        memoryDate: editing?.memoryDate ?? toIsoDate(),
        category: (editing?.category as MemoryCategory) ?? 'Everyday',
        icon: editing?.icon ?? 'sun',
        note: editing?.note ?? ''
      });
      setSelectedFile(null);
      setFileError(null);
      setPreviewUrl(editing?.image?.secureUrl ?? null);
    }
  }, [isOpen, editing, reset]);

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(editing?.image?.secureUrl ?? null);
      return;
    }

    if (!ALLOWED_MIME.has(file.type)) {
      setFileError('Please select a JPEG, PNG, WebP, or GIF image.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFileError('Photo exceeds the 5 MB maximum size.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const selectedIcon = watch('icon');

  return (
    <SheetModal isOpen={isOpen} title={editing ? 'Edit memory' : 'New memory'} onClose={onClose}>
      <form
        onSubmit={handleSubmit(async (vals) => {
          if (fileError) return;
          await onSubmit(vals, selectedFile);
        })}
        noValidate
      >
        <div className="f">
          <label htmlFor="mem-title">Title</label>
          <input id="mem-title" type="text" placeholder="e.g., Golden hour walk" {...register('title')} />
          {errors.title ? <div className="field-err">{errors.title.message}</div> : null}
        </div>

        <div className="g2">
          <div className="f">
            <label htmlFor="mem-date">Date</label>
            <input id="mem-date" type="date" max={toIsoDate()} {...register('memoryDate')} />
            {errors.memoryDate ? <div className="field-err">{errors.memoryDate.message}</div> : null}
          </div>
          <div className="f">
            <label htmlFor="mem-cat">Category</label>
            <select id="mem-cat" {...register('category')}>
              <option value="Everyday">Everyday</option>
              <option value="Travel">Travel</option>
              <option value="Milestone">Milestone</option>
            </select>
          </div>
        </div>

        <div className="f">
          <label>Icon (used when no photo)</label>
          <div className="icons-picker" role="radiogroup" aria-label="Memory icon">
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

        <div className="f">
          <label htmlFor="mem-photo">Photo (optional, max 5 MB)</label>
          <input id="mem-photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} />
          {fileError ? <div className="field-err">{fileError}</div> : null}
          {previewUrl ? (
            <div style={{ marginTop: 10 }}>
              <img
                src={previewUrl}
                alt="Memory preview"
                style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 12 }}
              />
              {editing?.image && !selectedFile && onRemoveExistingImage ? (
                <button
                  type="button"
                  className="btn dg"
                  style={{ marginTop: 8 }}
                  onClick={() => onRemoveExistingImage(editing.id)}
                >
                  Remove uploaded photo
                </button>
              ) : null}
            </div>
          ) : null}
          {typeof uploadProgress === 'number' && uploadProgress > 0 && uploadProgress < 100 ? (
            <div style={{ marginTop: 8 }}>
              <small className="mut">Uploading image… {uploadProgress}%</small>
              <div className="bar">
                <i style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="f">
          <label htmlFor="mem-note">Note</label>
          <textarea id="mem-note" placeholder="What made this moment worth keeping…" {...register('note')} />
        </div>

        <button type="submit" className="btn pri f" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Save memory'}
        </button>
      </form>
    </SheetModal>
  );
};

