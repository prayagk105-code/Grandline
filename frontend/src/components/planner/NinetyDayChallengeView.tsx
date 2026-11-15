import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { specialGrandlineService } from '../../services/specialGrandlineService';
import type { NinetyDayChallengeDto } from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

export const NinetyDayChallengeView: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [challenges, setChallenges] = useState<NinetyDayChallengeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dailyAction, setDailyAction] = useState('');
  const [startDate, setStartDate] = useState(today);

  // Check-in modal
  const [checkinChallengeId, setCheckinChallengeId] = useState<string | null>(null);
  const [checkinDayNumber, setCheckinDayNumber] = useState<number>(1);
  const [checkinNotes, setCheckinNotes] = useState('');
  const [submittingCheckin, setSubmittingCheckin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await specialGrandlineService.getChallenges();
      setChallenges(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load challenges.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dailyAction.trim()) {
      showToast('Please provide a title and daily target action', 'error');
      return;
    }
    try {
      await specialGrandlineService.createChallenge({
        title: title.trim(),
        description: description.trim() || undefined,
        dailyAction: dailyAction.trim(),
        startDate
      });
      showToast('90-Day Challenge started! Stay relentless.');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setDailyAction('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleLogDay = async () => {
    if (!checkinChallengeId) return;
    setSubmittingCheckin(true);
    try {
      await specialGrandlineService.logChallengeDay(checkinChallengeId, {
        dayNumber: checkinDayNumber,
        logDate: today,
        isCompleted: true,
        notes: checkinNotes.trim() || undefined
      });
      showToast(`Day ${checkinDayNumber} completed!`);
      setCheckinChallengeId(null);
      setCheckinNotes('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const activeChallenge = challenges.find((c) => c.status === 'Active') || challenges[0];
  const pastChallenges = challenges.filter((c) => c.id !== activeChallenge?.id);

  if (loading) return <LoadingSkeleton lines={6} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>90-Day Personal Transformation</h2>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            90 consecutive days of focused action to rewire identity and reach true mastery.
          </p>
        </div>
        <button
          type="button"
          className="btn pri"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <DayformIcon name="plus" size={14} />
          <span>New 90-Day Challenge</span>
        </button>
      </div>

      {!activeChallenge ? (
        <EmptyState
          title="No Active 90-Day Challenge"
          description="Choose one definitive habit or focus area and commit to 90 consecutive days."
          action={
            <button type="button" className="btn pri" onClick={() => setShowCreateModal(true)}>
              Start Challenge
            </button>
          }
        />
      ) : (
        <div className="cd" style={{ padding: 24 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span className="chip on" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {activeChallenge.status === 'Active' ? 'Active Quest' : 'Completed'}
                </span>
                <span className="mut" style={{ fontSize: 12 }}>
                  {formatDisplayDate(activeChallenge.startDate)} → {formatDisplayDate(activeChallenge.endDate)}
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 22 }}>{activeChallenge.title}</h3>
              {activeChallenge.description && (
                <p className="mut" style={{ margin: '0 0 10px', fontSize: 14 }}>{activeChallenge.description}</p>
              )}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--sf)', padding: '6px 12px', borderRadius: 8 }}>
                <DayformIcon name="flame" size={16} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>Daily Quest: {activeChallenge.dailyAction}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--ac)' }}>
                {Math.round(activeChallenge.progressPercent)}%
              </div>
              <div className="mut" style={{ fontSize: 12 }}>
                {activeChallenge.daysCompleted} of 90 days done
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: 8, background: 'var(--ln)', borderRadius: 4, margin: '20px 0', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, activeChallenge.progressPercent)}%`,
                height: '100%',
                background: 'var(--ac)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          {/* 90-Day Interactive Matrix */}
          <div>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>90-Day Journey Matrix</h4>
              <span className="mut" style={{ fontSize: 12 }}>Click a day to log your action</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
                gap: 6
              }}
            >
              {Array.from({ length: 90 }).map((_, idx) => {
                const dayNum = idx + 1;
                const log = activeChallenge.dayLogs?.find((l) => l.dayNumber === dayNum && l.isCompleted);
                const isCompleted = !!log;
                const isCurrentNext = dayNum === (activeChallenge.daysCompleted + 1);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => {
                      setCheckinChallengeId(activeChallenge.id);
                      setCheckinDayNumber(dayNum);
                      setCheckinNotes(log?.notes || '');
                    }}
                    title={`Day ${dayNum}: ${isCompleted ? 'Completed' : 'Pending'}${log?.notes ? ` - ${log.notes}` : ''}`}
                    style={{
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isCurrentNext ? '2px solid var(--ac)' : '1px solid var(--ln)',
                      background: isCompleted ? 'var(--badge-completed-text)' : 'var(--sf)',
                      color: isCompleted ? '#ffffff' : 'var(--ink)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Past Challenges */}
      {pastChallenges.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Past Transformation Challenges</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {pastChallenges.map((pc) => (
              <div key={pc.id} className="cd" style={{ padding: 16 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{pc.title}</h4>
                    <p className="mut" style={{ margin: 0, fontSize: 12 }}>
                      {formatDisplayDate(pc.startDate)} → {formatDisplayDate(pc.endDate)} · {pc.daysCompleted}/90 days ({Math.round(pc.progressPercent)}%)
                    </p>
                  </div>
                  <span className="chip" style={{ fontSize: 11 }}>Archived</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="sheet-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Launch 90-Day Challenge</h3>
              <button type="button" className="ib" onClick={() => setShowCreateModal(false)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">Challenge Title</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. 90 Days of Deep Coding Mastery"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="lbl">Daily Non-Negotiable Action</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. 2 hours of focused algorithm practice"
                  value={dailyAction}
                  onChange={(e) => setDailyAction(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="lbl">Start Date</label>
                <input
                  type="date"
                  className="inp"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="lbl">Why this matters (Description / Commitment)</label>
                <textarea
                  className="inp"
                  rows={3}
                  placeholder="Explain why you will complete all 90 days..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri">
                  Begin Journey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {checkinChallengeId && (
        <div className="sheet-backdrop" onClick={() => setCheckinChallengeId(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Log Day {checkinDayNumber}</h3>
              <button type="button" className="ib" onClick={() => setCheckinChallengeId(null)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>
            <p className="mut" style={{ margin: '0 0 16px', fontSize: 13 }}>
              Did you complete your daily target: <b>{activeChallenge?.dailyAction}</b>?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">Session Reflection / Notes (Optional)</label>
                <textarea
                  className="inp"
                  rows={3}
                  placeholder="What went well today? Any key takeaways?"
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn sec" onClick={() => setCheckinChallengeId(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn pri"
                  disabled={submittingCheckin}
                  onClick={handleLogDay}
                >
                  {submittingCheckin ? 'Saving...' : 'Mark Day Completed ✓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
