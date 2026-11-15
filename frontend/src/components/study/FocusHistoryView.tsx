import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { StatCard } from '../common/StatCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { focusService } from '../../services/focusService';
import type { FocusSessionDto, FocusSummaryDto, ScreenTimeLogDto } from '../../types/api';
import { formatDisplayDate, formatDurationMinutes, toIsoDate } from '../../utils/date';

export const FocusHistoryView: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [sessions, setSessions] = useState<FocusSessionDto[]>([]);
  const [screenTimes, setScreenTimes] = useState<ScreenTimeLogDto[]>([]);
  const [summary, setSummary] = useState<FocusSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Screen time log modal
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [stCategory, setStCategory] = useState('Social');
  const [stMinutes, setStMinutes] = useState(30);
  const [stDate, setStDate] = useState(today);
  const [stNotes, setStNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessData, sumData, stData] = await Promise.all([
        focusService.getSessions(undefined, 30),
        focusService.getSummary(),
        focusService.getScreenTime(today)
      ]);
      setSessions(sessData);
      setSummary(sumData);
      setScreenTimes(stData);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load focus history.').message);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateScreenTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stMinutes <= 0) return;
    try {
      await focusService.createScreenTime({
        category: stCategory,
        durationMinutes: stMinutes,
        logDate: stDate,
        notes: stNotes.trim() || undefined
      });
      showToast('Screen time logged');
      setShowScreenModal(false);
      setStNotes('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  if (loading && !summary) return <LoadingSkeleton lines={5} />;
  if (error && !summary) return <ErrorState message={error} onRetry={load} />;

  const totalScreenMinutes = screenTimes.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats Overview */}
      {summary && (
        <div className="g3">
          <StatCard
            icon="clock"
            label="Today's Focus"
            value={formatDurationMinutes(summary.todayFocusMinutes)}
            note={`${Math.round((summary.todayFocusMinutes / (summary.dailyTargetMinutes || 120)) * 100)}% of target`}
          />
          <StatCard
            icon="study"
            label="Total Sessions"
            value={String(summary.totalSessionsCount)}
            note="completed blocks"
          />
          <StatCard
            icon="flame"
            label="Deep Work"
            value={formatDurationMinutes(summary.deepWorkMinutes)}
            note={`${summary.totalDistractions} total distractions`}
          />
        </div>
      )}

      {/* Screen Time Section */}
      <div className="cd" style={{ padding: 20 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: '0 0 2px', fontSize: 16 }}>Manual Screen-Time Log</h3>
            <p className="mut" style={{ margin: 0, fontSize: 12 }}>
              Track non-productive device consumption alongside deep work sessions.
            </p>
          </div>
          <button
            type="button"
            className="btn sec"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setShowScreenModal(true)}
          >
            + Log Screen Time
          </button>
        </div>

        {screenTimes.length === 0 ? (
          <p className="mut" style={{ fontSize: 13, margin: '8px 0' }}>
            No screen time logged for today.
          </p>
        ) : (
          <div>
            <div style={{ fontSize: 13, marginBottom: 10, fontWeight: 500 }}>
              Logged Consumption Today: <span style={{ color: 'var(--ac)' }}>{formatDurationMinutes(totalScreenMinutes)}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {screenTimes.map((st) => (
                <div
                  key={st.id}
                  className="row"
                  style={{
                    gap: 8,
                    background: 'var(--sf)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    alignItems: 'center'
                  }}
                >
                  <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>{st.category}</span>
                  <b>{st.durationMinutes}m</b>
                  {st.notes && <span className="mut">({st.notes})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Focus Sessions History */}
      <div>
        <h3 style={{ fontSize: 18, marginBottom: 14 }}>Focus Sessions History</h3>
        {sessions.length === 0 ? (
          <EmptyState
            title="No Focus Sessions Yet"
            description="Completed Pomodoro, Deep Work, and Custom focus sessions will appear here."
          />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                className="cd"
                style={{
                  padding: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10
                }}
              >
                <div>
                  <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span className="chip on" style={{ fontSize: 10, padding: '1px 6px' }}>
                      {s.sessionType}
                    </span>
                    <span className="mut" style={{ fontSize: 11 }}>{formatDisplayDate(s.sessionDate)}</span>
                  </div>
                  <div style={{ fontSize: 14 }}>
                    {s.notes || 'Unlabeled focus block'}
                  </div>
                </div>

                <div className="row" style={{ gap: 16, alignItems: 'center' }}>
                  {s.distractionCount > 0 && (
                    <span className="mut" style={{ fontSize: 12 }}>
                      {s.distractionCount} distraction{s.distractionCount > 1 ? 's' : ''}
                    </span>
                  )}
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ac)' }}>
                    {s.durationMinutes} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen Time Modal */}
      {showScreenModal && (
        <div className="sheet-backdrop" onClick={() => setShowScreenModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Log Screen Time</h3>
              <button type="button" className="ib" onClick={() => setShowScreenModal(false)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateScreenTime} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">Category</label>
                <select
                  className="inp"
                  value={stCategory}
                  onChange={(e) => setStCategory(e.target.value)}
                >
                  <option value="Social">Social Media</option>
                  <option value="Entertainment">Entertainment / Videos</option>
                  <option value="Browsing">Mindless Browsing</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="lbl">Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  className="inp"
                  value={stMinutes}
                  onChange={(e) => setStMinutes(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Date</label>
                <input
                  type="date"
                  className="inp"
                  value={stDate}
                  onChange={(e) => setStDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Notes / App used</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. YouTube shorts before bed"
                  value={stNotes}
                  onChange={(e) => setStNotes(e.target.value)}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setShowScreenModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri">
                  Log Screen Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
