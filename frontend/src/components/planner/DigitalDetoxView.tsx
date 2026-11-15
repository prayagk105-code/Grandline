import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { specialGrandlineService } from '../../services/specialGrandlineService';
import type { DigitalDetoxDto } from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

const POPULAR_APPS = [
  'Instagram',
  'TikTok',
  'YouTube Shorts',
  'Twitter / X',
  'Reddit',
  'Mobile Gaming',
  'Online Shopping',
  'Mindless Browsing'
];

export const DigitalDetoxView: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [detoxes, setDetoxes] = useState<DigitalDetoxDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [customApp, setCustomApp] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toIsoDate(d);
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await specialGrandlineService.getDetoxes();
      setDetoxes(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load detoxes.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleApp = (app: string) => {
    setSelectedApps((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
    );
  };

  const addCustomApp = () => {
    if (customApp.trim() && !selectedApps.includes(customApp.trim())) {
      setSelectedApps((prev) => [...prev, customApp.trim()]);
      setCustomApp('');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedApps.length === 0) {
      showToast('Please provide a title and select at least one distracting app', 'error');
      return;
    }
    try {
      await specialGrandlineService.createDetox({
        title: title.trim(),
        distractingApps: selectedApps.join(', '),
        startDate,
        endDate
      });
      showToast('Digital Detox protocol activated!');
      setShowModal(false);
      setTitle('');
      setSelectedApps([]);
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleLogDay = async (id: string) => {
    try {
      await specialGrandlineService.logCleanDay(id);
      showToast('Great work! Clean day logged 🔥');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const activeDetox = detoxes.find((d) => d.isActive);
  const pastDetoxes = detoxes.filter((d) => d.id !== activeDetox?.id);

  if (loading) return <LoadingSkeleton lines={5} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Digital Detox Sanctuary</h2>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            Reclaim attention, quiet mental noise, and detox from dopaminergic digital loops.
          </p>
        </div>
        <button
          type="button"
          className="btn pri"
          onClick={() => setShowModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <DayformIcon name="plus" size={14} />
          <span>New Detox Protocol</span>
        </button>
      </div>

      {!activeDetox ? (
        <EmptyState
          title="No Active Digital Detox"
          description="Set boundaries with social media and apps to restore focus and presence."
          action={
            <button type="button" className="btn pri" onClick={() => setShowModal(true)}>
              Activate Detox
            </button>
          }
        />
      ) : (
        <div className="cd" style={{ padding: 24 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span className="chip on" style={{ fontSize: 11, padding: '2px 8px' }}>
                  Detox Active
                </span>
                <span className="mut" style={{ fontSize: 12 }}>
                  {formatDisplayDate(activeDetox.startDate)} → {formatDisplayDate(activeDetox.endDate)}
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 22 }}>{activeDetox.title}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {activeDetox.distractingApps.split(',').map((app, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'var(--sf)',
                      border: '1px solid var(--ln)',
                      padding: '4px 10px',
                      borderRadius: 16,
                      fontSize: 12
                    }}
                  >
                    🚫 {app.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--ac)' }}>
                {activeDetox.cleanDaysCount}
              </div>
              <div className="mut" style={{ fontSize: 12 }}>
                Clean Days Counter 🔥
              </div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ln)', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Did you remain clean and adhere to your detox protocol today?
            </span>
            <div className="row" style={{ gap: 10 }}>
              <button
                type="button"
                className="btn pri"
                onClick={() => handleLogDay(activeDetox.id)}
                style={{ fontSize: 13 }}
              >
                Log Clean Day ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detox History */}
      {pastDetoxes.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Past Detox History</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {pastDetoxes.map((d) => (
              <div key={d.id} className="cd" style={{ padding: 16 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{d.title}</h4>
                    <p className="mut" style={{ margin: 0, fontSize: 12 }}>
                      {formatDisplayDate(d.startDate)} → {formatDisplayDate(d.endDate)} · {d.cleanDaysCount} clean days · {d.distractingApps}
                    </p>
                  </div>
                  <span className="chip" style={{ fontSize: 11 }}>Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="sheet-backdrop" onClick={() => setShowModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Activate Digital Detox Protocol</h3>
              <button type="button" className="ib" onClick={() => setShowModal(false)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">Protocol Title</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. 7-Day Social Media Blackout"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Distracting Apps / Activities to Cut</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {POPULAR_APPS.map((app) => {
                    const active = selectedApps.includes(app);
                    return (
                      <button
                        key={app}
                        type="button"
                        onClick={() => toggleApp(app)}
                        className={`chip ${active ? 'on' : ''}`}
                        style={{ fontSize: 12 }}
                      >
                        {app}
                      </button>
                    );
                  })}
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <input
                    type="text"
                    className="inp"
                    placeholder="Other app or site..."
                    value={customApp}
                    onChange={(e) => setCustomApp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomApp();
                      }
                    }}
                  />
                  <button type="button" className="btn sec" onClick={addCustomApp}>
                    Add
                  </button>
                </div>
              </div>

              <div className="df-grid-2">
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
                  <label className="lbl">End Date</label>
                  <input
                    type="date"
                    className="inp"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri">
                  Start Detox
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
