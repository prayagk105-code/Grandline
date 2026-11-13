import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { MemoryCard } from '../components/memories/MemoryCard';
import { MemoryDetailSheet } from '../components/memories/MemoryDetailSheet';
import { MemoryFormSheet, type MemoryFormValues } from '../components/memories/MemoryFormSheet';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { memoryService } from '../services/memoryService';
import type { MemoryCategory, MemoryDto } from '../types/api';

const FILTERS: { value: 'All' | MemoryCategory; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Everyday', label: 'Everyday' },
  { value: 'Milestone', label: 'Milestones' }
];

export const MemoriesPage: React.FC = () => {
  const { showToast } = useToast();
  const [memories, setMemories] = useState<MemoryDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'All' | MemoryCategory>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<MemoryDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MemoryDto | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<MemoryDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await memoryService.getAll(filter === 'All' ? undefined : filter, 1, 100);
      setMemories(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(parseApiError(err, 'Could not load memories.').message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
    const handleChanged = () => load(true);
    window.addEventListener('dayform:data-changed', handleChanged);
    return () => window.removeEventListener('dayform:data-changed', handleChanged);
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, MemoryDto[]>();
    memories.forEach((m) => {
      const key = m.memoryDate.slice(0, 7);
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [memories]);

  const handleSave = async (vals: MemoryFormValues, file: File | null) => {
    try {
      let saved: MemoryDto;
      if (editing) {
        saved = await memoryService.update(editing.id, {
          title: vals.title,
          memoryDate: vals.memoryDate,
          category: vals.category,
          icon: vals.icon,
          note: vals.note
        });
      } else {
        saved = await memoryService.create({
          title: vals.title,
          memoryDate: vals.memoryDate,
          category: vals.category,
          icon: vals.icon,
          note: vals.note
        });
      }

      if (file) {
        setUploadProgress(0);
        await memoryService.uploadImage(saved.id, file, setUploadProgress);
      }

      showToast(editing ? 'Memory updated' : 'Memory saved');
      setFormOpen(false);
      setEditing(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err, 'Could not save memory.').message, 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRemoveImage = async (memoryId: string) => {
    try {
      const updated = await memoryService.deleteImage(memoryId);
      setEditing(updated);
      showToast('Photo removed');
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await memoryService.remove(deleting.id);
      showToast('Memory deleted');
      setDeleting(null);
      setSelected(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Your archive"
        title="Memories"
        subtitle={`${totalCount} moment${totalCount === 1 ? '' : 's'} kept`}
        action={
          <button
            type="button"
            className="ib"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            aria-label="Add memory"
          >
            <DayformIcon name="plus" />
          </button>
        }
      />

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`chip ${filter === f.value ? 'on' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && memories.length === 0 ? <LoadingSkeleton lines={5} /> : null}
      {error && memories.length === 0 ? <ErrorState message={error} onRetry={() => load()} /> : null}

      {!loading && !error && memories.length === 0 ? (
        <EmptyState
          title="No memories here yet"
          description="Save a note, milestone, or photo worth remembering."
          action={
            <button
              type="button"
              className="btn pri"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add memory
            </button>
          }
        />
      ) : null}

      {grouped.map(([monthKey, list]) => {
        const label = new Date(`${monthKey}-15T12:00:00`).toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric'
        });
        return (
          <section key={monthKey}>
            <div className="sec">
              <h2>{label}</h2>
              <span className="eyebrow">{list.length}</span>
            </div>
            <div className="mg">
              {list.map((m) => (
                <MemoryCard key={m.id} memory={m} onSelect={setSelected} />
              ))}
            </div>
          </section>
        );
      })}

      <MemoryDetailSheet
        memory={selected}
        onClose={() => setSelected(null)}
        onEdit={(m) => {
          setSelected(null);
          setEditing(m);
          setFormOpen(true);
        }}
        onDelete={setDeleting}
      />

      <MemoryFormSheet
        isOpen={formOpen}
        editing={editing}
        uploadProgress={uploadProgress}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
        onRemoveExistingImage={handleRemoveImage}
      />

      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Delete memory"
        message={`Delete "${deleting?.title}"? Any attached photo will also be removed from storage.`}
        isBusy={deleteBusy}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
};

