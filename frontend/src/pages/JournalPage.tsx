import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { SheetModal } from '../components/common/SheetModal';
import { ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { journalService } from '../services/journalService';
import { personalDevelopmentService } from '../services/personalDevelopmentService';
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
        title="Journal"
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
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid var(--ln)',
                background: 'var(--cd)',
                fontSize: 13
              }}
            />
          </div>
        }
      />

      {loading ? <LoadingSkeleton lines={5} /> : null}
      {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <div className="df-grid-2">
          <form className="cd" onSubmit={handleSave}>
            <div className="f">
              <label htmlFor="j-acc" className="d" style={{ fontSize: 15, color: 'var(--ink)' }}>
                What did I accomplish today?
              </label>
              <textarea
                id="j-acc"
                placeholder="Something you did well, however small…"
                value={accomplishments}
                onChange={(e) => setAccomplishments(e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="j-dis" className="d" style={{ fontSize: 15, color: 'var(--ink)' }}>
                What distracted me today?
              </label>
              <textarea
                id="j-dis"
                placeholder="Notice it without judgement…"
                value={distractions}
                onChange={(e) => setDistractions(e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="j-imp" className="d" style={{ fontSize: 15, color: 'var(--ink)' }}>
                What can I improve tomorrow?
              </label>
              <textarea
                id="j-imp"
                placeholder="One small change…"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="j-grat" className="d" style={{ fontSize: 15, color: 'var(--ink)' }}>
                Daily Gratitude
              </label>
              <textarea
                id="j-grat"
                rows={2}
                placeholder="People, opportunities, or small moments you are thankful for…"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="j-les" className="d" style={{ fontSize: 15, color: 'var(--ink)' }}>
                Key Lessons Learned & Wisdom
              </label>
              <textarea
                id="j-les"
                rows={2}
                placeholder="Insights, principles, or hard-won realizations…"
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
              />
            </div>

            <button type="submit" className="btn pri f" disabled={saving}>
              {saving ? 'Saving…' : 'Save reflection'}
            </button>
          </form>

          <div>
            <div className="sec" style={{ marginTop: 0 }}>
              <h2>Past entries</h2>
            </div>
            <div className="cd">
              {pastEntries.filter((e) => e.entryDate !== activeDate).length > 0 ? (
                pastEntries
                  .filter((e) => e.entryDate !== activeDate)
                  .map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="li"
                      style={{ width: '100%', textAlign: 'left' }}
                      onClick={() => setViewingEntry(entry)}
                    >
                      <span className="ic">
                        <DayformIcon name="pen" />
                      </span>
                      <div className="g">
                        <b>
                          {formatDisplayDate(entry.entryDate, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </b>
                        <small>{entry.accomplishments || 'Reflection saved'}</small>
                      </div>
                      <DayformIcon name="right" size={16} />
                    </button>
                  ))
              ) : (
                <p className="mut" style={{ margin: 0 }}>Past reflections appear here.</p>
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
              className="btn f"
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

