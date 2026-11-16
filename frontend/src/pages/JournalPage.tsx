import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { SheetModal } from '../components/common/SheetModal';
import { ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { journalService } from '../services/journalService';
import { personalDevelopmentService } from '../../src/services/personalDevelopmentService';
import type { JournalEntryDto } from '../types/api';
import { formatDisplayDate, toIsoDate } from '../utils/date';

export const JournalPage: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [activeDate, setActiveDate] = useState(today);
  const [accomplishments, setAccomplishments] = useState('');
  const [distractions, setDistractions] = useState('');
  const [improvements, setImprovements] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [moodScore, setMoodScore] = useState(4);
  const [energyScore, setEnergyScore] = useState(4);

  const [pastEntries, setPastEntries] = useState<JournalEntryDto[]>([]);
  const [viewingEntry, setViewingEntry] = useState<JournalEntryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [current, list, moodLog] = await Promise.all([
        journalService.getByDate(activeDate),
        journalService.getAll(1, 10),
        personalDevelopmentService.getTodayMoodLog(activeDate).catch(() => null)
      ]);
      setAccomplishments(current?.accomplishments ?? '');
      setDistractions(current?.distractions ?? '');
      setImprovements(current?.improvements ?? '');
      setPastEntries(list.items);

      if (moodLog) {
        setGratitude(moodLog.gratitude ?? '');
        setLessonsLearned(moodLog.lessonsLearned ?? '');
        setMoodScore(moodLog.moodScore);
        setEnergyScore(moodLog.energyScore);
      } else {
        setGratitude('');
        setLessonsLearned('');
      }
    } catch (err) {
      setError(parseApiError(err, 'Could not load journal entries.').message);
    } finally {
      setLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await journalService.upsert(activeDate, {
        accomplishments,
        distractions,
        improvements
      });
      if (gratitude.trim() || lessonsLearned.trim()) {
        await personalDevelopmentService
          .upsertMoodLog({
            logDate: activeDate,
            moodScore,
            energyScore,
            stressScore: 2,
            gratitude: gratitude.trim() || undefined,
            lessonsLearned: lessonsLearned.trim() || undefined
          })
          .catch(() => {});
      }
      showToast('Reflection saved');
      const list = await journalService.getAll(1, 10);
      setPastEntries(list.items);
      window.dispatchEvent(new CustomEvent('dayform:data-changed'));
    } catch (err) {
      showToast(parseApiError(err, 'Could not save reflection.').message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="A moment with yourself"
        title="Journal & Reflection"
        subtitle={formatDisplayDate(activeDate, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
        action={
          <div style={{ width: 148 }}>
            <label htmlFor="journal-date" className="sr-only">
              Journal date
            </label>
            <input
              id="journal-date"
              type="date"
              max={today}
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value || today)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--ln)',
                background: 'var(--cd)',
                fontSize: 12.5
              }}
            />
          </div>
        }
      />

      {loading ? <LoadingSkeleton lines={5} /> : null}
      {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <div className="df-grid-2">
          <form className="cd cd-personal" onSubmit={handleSave} style={{ padding: '16px 18px' }}>
            <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <span className="mod-icon mod-icon-personal">
                <DayformIcon name="pen" size={16} />
              </span>
              <b className="d" style={{ fontSize: 16 }}>Evening Reflection</b>
            </div>

            {/* Daily Mood & Energy State */}
            <div className="df-grid-2" style={{ marginBottom: 12 }}>
              <div style={{ background: 'var(--card-personal-inner-bg)', border: '1px solid var(--card-personal-inner-border)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mut)' }}>Mood</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--card-personal-accent)' }}>
                    {['😞 Low', '😕 Flat', '😐 Steady', '🙂 Good', '😄 Peak'][moodScore - 1] || `${moodScore}/5`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`chip ${moodScore === num ? 'on' : ''}`}
                      onClick={() => setMoodScore(num)}
                      style={{ flex: 1, padding: '3px 0', fontSize: 11.5, textAlign: 'center', justifyContent: 'center' }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--card-personal-inner-bg)', border: '1px solid var(--card-personal-inner-border)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mut)' }}>Energy</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--card-personal-accent)' }}>⚡ {energyScore}/5</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`chip ${energyScore === num ? 'on' : ''}`}
                      onClick={() => setEnergyScore(num)}
                      style={{ flex: 1, padding: '3px 0', fontSize: 11.5, textAlign: 'center', justifyContent: 'center' }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Split Accomplishments & Distractions */}
            <div className="df-grid-2">
              <div className="f" style={{ marginBottom: 0 }}>
                <label htmlFor="j-acc" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  What did I accomplish today?
                </label>
                <textarea
                  id="j-acc"
                  rows={2}
                  placeholder="Something you did well today…"
                  value={accomplishments}
                  onChange={(e) => setAccomplishments(e.target.value)}
                />
              </div>

              <div className="f" style={{ marginBottom: 0 }}>
                <label htmlFor="j-dis" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  What distracted me today?
                </label>
                <textarea
                  id="j-dis"
                  rows={2}
                  placeholder="Notice it without judgement…"
                  value={distractions}
                  onChange={(e) => setDistractions(e.target.value)}
                />
              </div>
            </div>

            <div className="f" style={{ marginTop: 10 }}>
              <label htmlFor="j-imp" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                What can I improve tomorrow?
              </label>
              <textarea
                id="j-imp"
                rows={2}
                placeholder="One small adjustment or non-negotiable…"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
              />
            </div>

            {/* Split Gratitude & Lessons */}
            <div className="df-grid-2">
              <div className="f" style={{ marginBottom: 0 }}>
                <label htmlFor="j-grat" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  Daily Gratitude
                </label>
                <textarea
                  id="j-grat"
                  rows={2}
                  placeholder="Small moments, people, or opportunities…"
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                />
              </div>

              <div className="f" style={{ marginBottom: 0 }}>
                <label htmlFor="j-les" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  Key Lessons Learned
                </label>
                <textarea
                  id="j-les"
                  rows={2}
                  placeholder="Insights, principles, or realizations…"
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn pri f" style={{ marginTop: 12 }} disabled={saving}>
              {saving ? 'Saving…' : 'Save reflection'}
            </button>
          </form>

          <div>
            <div className="sec" style={{ marginTop: 0 }}>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span className="mod-icon mod-icon-personal">
                  <DayformIcon name="book" size={15} />
                </span>
                <h2>Past Reflections</h2>
              </div>
            </div>
            <div className="cd cd-personal">
              {pastEntries.filter((e) => e.entryDate !== activeDate).length > 0 ? (
                pastEntries
                  .filter((e) => e.entryDate !== activeDate)
                  .map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="li"
                      style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                      onClick={() => setViewingEntry(entry)}
                    >
                      <span className="mod-icon mod-icon-personal" style={{ width: 32, height: 32 }}>
                        <DayformIcon name="pen" size={14} />
                      </span>
                      <div className="g" style={{ minWidth: 0 }}>
                        <b style={{ fontSize: 13 }}>
                          {formatDisplayDate(entry.entryDate, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </b>
                        <small>{entry.accomplishments || 'Reflection recorded'}</small>
                      </div>
                      <DayformIcon name="right" size={14} />
                    </button>
                  ))
              ) : (
                <p className="mut" style={{ margin: 0, padding: '12px 0', fontSize: 13, textAlign: 'center' }}>
                  Past reflections appear here.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <SheetModal
        isOpen={Boolean(viewingEntry)}
        title={
          viewingEntry
            ? formatDisplayDate(viewingEntry.entryDate, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            : ''
        }
        onClose={() => setViewingEntry(null)}
      >
        {viewingEntry ? (
          <>
            <div className="f">
              <label>Accomplished</label>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{viewingEntry.accomplishments || '—'}</p>
            </div>
            <div className="f">
              <label>Distracted by</label>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{viewingEntry.distractions || '—'}</p>
            </div>
            <div className="f">
              <label>Improve tomorrow</label>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{viewingEntry.improvements || '—'}</p>
            </div>
            <button
              type="button"
              className="btn pri f"
              onClick={() => {
                setActiveDate(viewingEntry.entryDate);
                setViewingEntry(null);
              }}
            >
              Edit this entry
            </button>
          </>
        ) : null}
      </SheetModal>
    </>
  );
};
