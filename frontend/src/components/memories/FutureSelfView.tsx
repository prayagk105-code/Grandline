import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { specialGrandlineService } from '../../services/specialGrandlineService';
import type { FutureLetterDto } from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

export const FutureSelfView: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [letters, setLetters] = useState<FutureLetterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return toIsoDate(d);
  });

  // Reading modal
  const [readingLetter, setReadingLetter] = useState<FutureLetterDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await specialGrandlineService.getFutureLetters();
      setLetters(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load letters.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (unlockDate <= today) {
      showToast('Unlock date must be in the future', 'error');
      return;
    }
    try {
      await specialGrandlineService.createFutureLetter({
        title: title.trim(),
        content: content.trim(),
        unlockDate
      });
      showToast('Letter sealed into the time capsule ✉️');
      setShowModal(false);
      setTitle('');
      setContent('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleOpenLetter = async (letter: FutureLetterDto) => {
    setReadingLetter(letter);
    if (!letter.isRead) {
      try {
        await specialGrandlineService.markLetterRead(letter.id);
      } catch {
        // ignore
      }
    }
  };

  if (loading) return <LoadingSkeleton lines={4} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const unlockedLetters = letters.filter((l) => l.isUnlocked || l.unlockDate <= today);
  const sealedLetters = letters.filter((l) => !l.isUnlocked && l.unlockDate > today);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Letters to Your Future Self</h2>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            Send messages across time. Unlocked automatically only when the target date arrives.
          </p>
        </div>
        <button
          type="button"
          className="btn pri"
          onClick={() => setShowModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <DayformIcon name="plus" size={14} />
          <span>Write Time Letter</span>
        </button>
      </div>

      <div className="df-grid-2">
        {/* Unlocked / Arrived Letters */}
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>
            Delivered & Ready to Read ({unlockedLetters.length})
          </h3>
          {unlockedLetters.length === 0 ? (
            <div className="cd" style={{ padding: '16px 18px', textAlign: 'center' }}>
              <p className="mut" style={{ fontSize: 13, margin: 0 }}>
                No letters have arrived yet. When your scheduled delivery dates arrive, your sealed letters will unlock here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {unlockedLetters.map((l) => (
                <div
                  key={l.id}
                  className="cd cd-memories"
                  style={{
                    padding: '14px 16px',
                    cursor: 'pointer',
                    marginBottom: 0
                  }}
                  onClick={() => handleOpenLetter(l)}
                >
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <span className="chip on" style={{ fontSize: 10, padding: '1px 6px' }}>
                      Unlocked ✉️
                    </span>
                    <span className="mut" style={{ fontSize: 11 }}>
                      Delivered {formatDisplayDate(l.unlockDate)}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{l.title}</h4>
                  <p className="mut" style={{ margin: 0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sealed Letters in Transit */}
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>
            Sealed in Time Capsule ({sealedLetters.length})
          </h3>
          {sealedLetters.length === 0 ? (
            <EmptyState
              title="No Sealed Letters"
              description="Write a letter describing your current struggles, dreams, and standards to be read in the future."
              action={
                <button type="button" className="btn pri" onClick={() => setShowModal(true)}>
                  Write Letter
                </button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sealedLetters.map((l) => {
                const delivery = new Date(`${l.unlockDate}T00:00:00`);
                const now = new Date(`${today}T00:00:00`);
                const daysRemaining = Math.max(1, Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

                return (
                  <div
                    key={l.id}
                    className="cd cd-memories"
                    style={{
                      padding: '14px 16px',
                      marginBottom: 0
                    }}
                  >
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>🔒</span>
                        <span style={{ fontSize: 11.5, fontWeight: 600 }}>Sealed</span>
                      </div>
                    </div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{l.title}</h4>
                    <div style={{ background: 'var(--ln)', height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '6px 0 10px' }}>
                      <span className="mut" style={{ fontSize: 11, fontStyle: 'italic' }}>
                        Contents encrypted until unlock date
                      </span>
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between', fontSize: 12 }}>
                      <span className="mut">Unlocks {formatDisplayDate(l.unlockDate)}</span>
                      <span style={{ fontWeight: 600, color: 'var(--ac)' }}>in {daysRemaining} days</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Write Modal */}
      {showModal && (
        <div className="sheet-backdrop" onClick={() => setShowModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Write to Your Future Self</h3>
              <button type="button" className="ib" onClick={() => setShowModal(false)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">Letter Title</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. Read this on my 30th birthday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Unlock Date</label>
                <input
                  type="date"
                  className="inp"
                  value={unlockDate}
                  min={today}
                  onChange={(e) => setUnlockDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Letter Message</label>
                <textarea
                  className="inp"
                  rows={8}
                  placeholder="Dear future me, right now I am working on..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri">
                  Seal Time Capsule ✉️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reading Modal */}
      {readingLetter && (
        <div className="sheet-backdrop" onClick={() => setReadingLetter(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span className="chip on" style={{ fontSize: 10, padding: '1px 6px', marginBottom: 6 }}>
                  Delivered on {formatDisplayDate(readingLetter.unlockDate)}
                </span>
                <h3 style={{ margin: 0, fontSize: 20 }}>{readingLetter.title}</h3>
              </div>
              <button type="button" className="ib" onClick={() => setReadingLetter(null)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <div
              style={{
                background: 'var(--sf)',
                padding: 20,
                borderRadius: 12,
                fontSize: 14,
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
                margin: '12px 0 20px',
                border: '1px solid var(--ln)'
              }}
            >
              {readingLetter.content}
            </div>

            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn pri" onClick={() => setReadingLetter(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
