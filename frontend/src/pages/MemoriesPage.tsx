import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { FutureSelfView } from '../components/memories/FutureSelfView';
import { KnowledgeHub } from '../components/memories/KnowledgeHub';
import { LifeTimelineView } from '../components/memories/LifeTimelineView';
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

type MemoriesTab = 'memories' | 'knowledge' | 'futureself' | 'timeline';

export const MemoriesPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();

  const tabParam = (params.get('tab') as MemoriesTab) || 'memories';
  const [activeTab, setActiveTab] = useState<MemoriesTab>(tabParam);

  const setTab = (t: MemoriesTab) => {
    setActiveTab(t);
    setParams((p) => {
      p.set('tab', t);
      return p;
    });
  };

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
      const list = map.get(key) || [];
      list.push(m);
      map.set(key, list);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [memories]);

  const handleSave = async (vals: MemoryFormValues, file: File | null) => {
    setUploadProgress(10);
    try {
      let saved: MemoryDto;
      if (editing) {
        saved = await memoryService.update(editing.id, {
          title: vals.title,
          category: vals.category,
          memoryDate: vals.memoryDate,
          icon: vals.icon,
          note: vals.note
        });
        showToast('Memory updated');
      } else {
        saved = await memoryService.create({
          title: vals.title,
          category: vals.category,
          memoryDate: vals.memoryDate,
          icon: vals.icon,
          note: vals.note
        });
        showToast('Memory saved');
      }

      if (file) {
        await memoryService.uploadImage(saved.id, file, (pct) => setUploadProgress(pct));
      }

      setFormOpen(false);
      setEditing(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRemoveImage = async (memoryId: string) => {
    try {
      await memoryService.deleteImage(memoryId);
      showToast('Image removed');
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
        eyebrow="Your lifelong archive"
        title="Memories & Knowledge"
        subtitle={
          activeTab === 'memories'
            ? `${totalCount} moments captured across your journey.`
            : 'Photos, notes, future letters, and life timeline.'
        }
        action={
          activeTab === 'memories' ? (
            <button
              type="button"
              className="btn pri sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              style={{ gap: 6 }}
            >
              <DayformIcon name="plus" size={14} />
              <span>Add memory</span>
            </button>
          ) : undefined
        }
      />

      {/* Main Tabs */}
      <div className="chips" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={`chip ${activeTab === 'memories' ? 'on' : ''}`}
          onClick={() => setTab('memories')}
        >
          Memories & Photos
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'knowledge' ? 'on' : ''}`}
          onClick={() => setTab('knowledge')}
        >
          Knowledge Hub
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'futureself' ? 'on' : ''}`}
          onClick={() => setTab('futureself')}
        >
          Future Self Letters
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'timeline' ? 'on' : ''}`}
          onClick={() => setTab('timeline')}
        >
          Life Timeline
        </button>
      </div>

      {activeTab === 'knowledge' && <KnowledgeHub />}
      {activeTab === 'futureself' && <FutureSelfView />}
      {activeTab === 'timeline' && <LifeTimelineView />}

      {activeTab === 'memories' && (
        <>
          <div className="chips" style={{ marginBottom: 14 }}>
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
              title="No memories recorded yet"
              description="Save a snapshot, milestone, or quiet moment worth keeping."
              action={
                <button
                  type="button"
                  className="btn pri"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  Capture first memory
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
              <section key={monthKey} style={{ marginBottom: 24 }}>
                <div className="sec">
                  <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                    <span className="mod-icon mod-icon-memories">
                      <DayformIcon name="img" size={15} />
                    </span>
                    <h2>{label}</h2>
                  </div>
                  <span className="badge badge-memories badge-sm">{list.length} moments</span>
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
      )}
    </>
  );
};
