import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { specialGrandlineService } from '../../services/specialGrandlineService';
import type { LifeTimelineEventDto } from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

const CATEGORIES = ['All', 'Milestone', 'Achievement', 'Career', 'Personal', 'Travel'];

export const LifeTimelineView: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [events, setEvents] = useState<LifeTimelineEventDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(today);
  const [category, setCategory] = useState('Milestone');
  const [significanceLevel, setSignificanceLevel] = useState(3);
  const [imageUrl, setImageUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await specialGrandlineService.getTimeline();
      // Sort chronologically descending
      const sorted = [...data].sort((a, b) => (b.eventDate > a.eventDate ? 1 : -1));
      setEvents(sorted);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load timeline.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await specialGrandlineService.createTimelineEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        eventDate,
        category,
        significanceLevel,
        imageUrl: imageUrl.trim() || undefined
      });
      showToast('Life milestone etched onto your timeline');
      setModalOpen(false);
      resetForm();
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this timeline event?')) return;
    try {
      await specialGrandlineService.removeTimelineEvent(id);
      showToast('Event removed');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventDate(today);
    setCategory('Milestone');
    setSignificanceLevel(3);
    setImageUrl('');
  };

  const filtered = events.filter(
    (e) => selectedCategory === 'All' || e.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  if (loading) return <LoadingSkeleton lines={5} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Life Timeline & Grand Milestones</h2>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            Chronological chronicle of your defining triumphs, pivots, and chapters.
          </p>
        </div>
        <button
          type="button"
          className="btn pri"
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <DayformIcon name="plus" size={14} />
          <span>Add Life Event</span>
        </button>
      </div>

      <div className="chips" style={{ marginBottom: 0 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`chip ${selectedCategory === cat ? 'on' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="Timeline is Empty"
          description="Record graduating, landing a job, running a marathon, buying a home, or major inner breakthroughs."
          action={
            <button
              type="button"
              className="btn pri"
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
            >
              Add First Milestone
            </button>
          }
        />
      ) : (
        <div style={{ position: 'relative', paddingLeft: 22, borderLeft: '2px solid var(--ln)', display: 'flex', flexDirection: 'column', gap: 14, marginLeft: 12 }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ position: 'relative' }}>
              {/* Dot marker */}
              <div
                style={{
                  position: 'absolute',
                  left: -29,
                  top: 6,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--ac)',
                  border: '2px solid var(--bg)'
                }}
              />

              <div className="cd cd-memories" style={{ padding: '14px 16px', marginBottom: 0 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                  <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                    <span className="chip on" style={{ fontSize: 10, padding: '1px 6px' }}>{item.category}</span>
                    <span className="mut" style={{ fontSize: 12, fontWeight: 500 }}>
                      {formatDisplayDate(item.eventDate)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ac)' }}>
                      {'★'.repeat(item.significanceLevel)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="ib"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete"
                  >
                    <DayformIcon name="trash" size={13} />
                  </button>
                </div>

                <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{item.title}</h3>
                {item.description && (
                  <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--ink)', lineHeight: 1.6 }}>
                    {item.description}
                  </p>
                )}

                {item.imageUrl && (
                  <div style={{ marginTop: 10, maxWidth: 360, borderRadius: 8, overflow: 'hidden' }}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="sheet-backdrop" onClick={() => setModalOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Record Life Milestone</h3>
              <button type="button" className="ib" onClick={() => setModalOpen(false)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">Event Title</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. Launched first software product"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="df-grid-2">
                <div>
                  <label className="lbl">Event Date</label>
                  <input
                    type="date"
                    className="inp"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="lbl">Category</label>
                  <select
                    className="inp"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Milestone">Milestone</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Career">Career</option>
                    <option value="Personal">Personal</option>
                    <option value="Travel">Travel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="lbl">Significance Level (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  className="inp"
                  value={significanceLevel}
                  onChange={(e) => setSignificanceLevel(parseInt(e.target.value) || 3)}
                />
                <span className="mut" style={{ fontSize: 11 }}>Level: {'★'.repeat(significanceLevel)}</span>
              </div>

              <div>
                <label className="lbl">Description / Story</label>
                <textarea
                  className="inp"
                  rows={4}
                  placeholder="What happened? What did this breakthrough teach you?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="lbl">Image URL (Optional)</label>
                <input
                  type="url"
                  className="inp"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri">
                  Etch Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
