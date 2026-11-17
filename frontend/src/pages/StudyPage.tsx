import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { FocusHistoryView } from '../components/study/FocusHistoryView';
import { FocusProductivityCard } from '../components/study/FocusProductivityCard';
import { FocusTimerCard } from '../components/study/FocusTimerCard';
import { KnowledgeHub } from '../components/memories/KnowledgeHub';
import { LearningPathFormSheet, type LearningPathFormValues } from '../components/study/LearningPathFormSheet';
import { StudySessionFormSheet, type StudySessionFormValues } from '../components/study/StudySessionFormSheet';
import { useFocusTimer } from '../contexts/FocusTimerContext';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { studyService } from '../services/studyService';
import type { LearningPathDto, StudySessionDto, StudySummaryDto } from '../types/api';
import { formatDisplayDate, formatDurationMinutes, toIsoDate } from '../utils/date';

type StudyTab = 'paths' | 'reading' | 'knowledge' | 'focus' | 'history';

export const StudyPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();
  const { onSessionLogged } = useFocusTimer();

  const tabParam = (params.get('tab') as StudyTab) || 'paths';
  const [activeTab, setActiveTab] = useState<StudyTab>(tabParam);

  const setTab = (t: StudyTab) => {
    setActiveTab(t);
    setParams((p) => {
      p.set('tab', t);
      return p;
    });
  };

  const [paths, setPaths] = useState<LearningPathDto[]>([]);
  const [sessions, setSessions] = useState<StudySessionDto[]>([]);
  const [summary, setSummary] = useState<StudySummaryDto | null>(null);
  const [filterPathId, setFilterPathId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pathSheetOpen, setPathSheetOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPathDto | null>(null);
  const [deletingPath, setDeletingPath] = useState<LearningPathDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [sessionSheetOpen, setSessionSheetOpen] = useState(false);
  const [defaultPathId, setDefaultPathId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<StudySessionDto | null>(null);
  const [deletingSession, setDeletingSession] = useState<StudySessionDto | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [lp, sum, ses] = await Promise.all([
        studyService.getLearningPaths(false),
        studyService.getSummary(toIsoDate()),
        studyService.getSessions({
          learningPathId: filterPathId || undefined,
          page: 1,
          pageSize: 10
        })
      ]);
      setPaths(lp);
      setSummary(sum);
      setSessions(ses.items);
    } catch (err) {
      setError(parseApiError(err, 'Could not load study data.').message);
    } finally {
      setLoading(false);
    }
  }, [filterPathId]);

  useEffect(() => {
    load();
    const handleChanged = () => load(true);
    window.addEventListener('dayform:data-changed', handleChanged);
    const unsub = onSessionLogged(() => load(true));
    return () => {
      window.removeEventListener('dayform:data-changed', handleChanged);
      unsub();
    };
  }, [load, onSessionLogged]);

  const handleSavePath = async (vals: LearningPathFormValues) => {
    try {
      if (editingPath) {
        await studyService.updateLearningPath(editingPath.id, vals);
        showToast('Learning path updated');
      } else {
        await studyService.createLearningPath(vals);
        showToast('Learning path created');
      }
      setPathSheetOpen(false);
      setEditingPath(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleConfirmDeletePath = async () => {
    if (!deletingPath) return;
    setDeleteBusy(true);
    try {
      await studyService.removeLearningPath(deletingPath.id);
      showToast('Learning path removed');
      setDeletingPath(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleSaveSession = async (vals: StudySessionFormValues) => {
    try {
      if (editingSession) {
        await studyService.updateSession(editingSession.id, vals);
        showToast('Study session updated');
      } else {
        await studyService.createSession(vals);
        showToast('Study session logged');
      }
      setSessionSheetOpen(false);
      setEditingSession(null);
      setDefaultPathId(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleConfirmDeleteSession = async () => {
    if (!deletingSession) return;
    setDeleteBusy(true);
    try {
      await studyService.removeSession(deletingSession.id);
      showToast('Study session removed');
      setDeletingSession(null);
      await load(true);
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  // Dynamic milestone computations
  const totalMinutes = summary?.totalMinutesAllTime ?? 0;
  const totalHours = Math.round(totalMinutes / 60);
  const targetHours = totalHours < 100 ? 100 : totalHours < 250 ? 250 : totalHours < 500 ? 500 : Math.ceil((totalHours + 1) / 250) * 250;
  const remainingHours = Math.max(0, targetHours - totalHours);
  const questPercent = Math.min(100, Math.round((totalHours / targetHours) * 100));
  const studyRank = totalHours >= 300 ? 'Grand Master' : totalHours >= 150 ? 'Specialist' : totalHours >= 50 ? 'Adept' : 'Apprentice';
  const weekHours = summary ? (summary.minutesThisWeek / 60).toFixed(1) : '0.0';

  return (
    <div className="v4-page-container">
      {/* V4 Study Header (Screenshot 4) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280' }}>
              FEED YOUR MIND
            </span>
            <span
              style={{
                background: '#EEECFA',
                color: '#3B28CC',
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: 10.5,
                fontWeight: 700
              }}
            >
              Apex Zenith v4.0
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#1E1B4B', letterSpacing: '-0.02em' }}>
            Study & Deep Work
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6B7280', maxWidth: 460 }}>
            Master your craft through intense, uninterrupted focus sessions.
          </p>
        </div>

        <div className="v4-study-header-actions">
          <button
            type="button"
            className="v4-btn-log-session"
            onClick={() => {
              setEditingSession(null);
              setDefaultPathId(null);
              setSessionSheetOpen(true);
            }}
          >
            <DayformIcon name="plus" size={15} />
            <span>Log Session</span>
          </button>
        </div>
      </div>

      {/* Pill Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <button
          type="button"
          className={`v4-tab-pill ${activeTab === 'paths' ? 'active' : ''}`}
          onClick={() => setTab('paths')}
        >
          Learning Paths
        </button>
        <button
          type="button"
          className={`v4-tab-pill ${activeTab === 'reading' ? 'active' : ''}`}
          onClick={() => setTab('reading')}
        >
          Reading Tracker
        </button>
        <button
          type="button"
          className={`v4-tab-pill ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => setTab('knowledge')}
        >
          Knowledge Hub
        </button>
        <button
          type="button"
          className={`v4-tab-pill ${activeTab === 'focus' ? 'active' : ''}`}
          onClick={() => setTab('focus')}
        >
          Focus & Deep Work
        </button>
        <button
          type="button"
          className={`v4-tab-pill ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          Session History
        </button>
      </div>

      {activeTab === 'reading' && <KnowledgeHub initialTab="books" />}
      {activeTab === 'knowledge' && <KnowledgeHub initialTab="notes" />}

      {activeTab === 'focus' && (
        <FocusProductivityCard
          learningPaths={paths}
          onSessionLogged={() => load(true)}
        />
      )}

      {activeTab === 'history' && <FocusHistoryView />}

      {activeTab === 'paths' && (
        <>
          {loading && !summary ? <LoadingSkeleton lines={4} /> : null}
          {error && !summary ? <ErrorState message={error} onRetry={() => load()} /> : null}

          {summary ? (
            <>
              {/* 2 Stat Cards (Screenshot 4) */}
              <div className="v4-stats-grid-2x2">
                <div className="v4-stat-box">
                  <div className="v4-stat-box-top">
                    <span>THIS WEEK</span>
                    <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 9999, fontSize: 10.5, fontWeight: 700 }}>
                      +18%
                    </span>
                  </div>
                  <div className="v4-stat-box-val">{weekHours} hrs</div>
                  <div className="v4-stat-box-sub">Target: 30 hrs / wk</div>
                  <div style={{ height: 4, width: '100%', borderRadius: 9999, background: '#E5E7EB', overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.round((Number(weekHours) / 30) * 100))}%`, background: 'linear-gradient(90deg, #3B28CC, #0D9488)' }} />
                  </div>
                </div>

                <div className="v4-stat-box">
                  <div className="v4-stat-box-top">
                    <span>ALL-TIME STUDY</span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C7D2FE' }} />
                  </div>
                  <div className="v4-stat-box-val">{totalHours} hrs</div>
                  <div className="v4-stat-box-sub">Rank: {studyRank}</div>
                  <div style={{ height: 4, width: '100%', borderRadius: 9999, background: '#E5E7EB', overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, questPercent)}%`, background: '#0D9488' }} />
                  </div>
                </div>
              </div>

              {/* Milestone Quest Card (Screenshot 4) */}
              <div className="v4-milestone-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.16)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    <DayformIcon name="target" size={20} />
                  </div>
                  <div>
                    <b style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>
                      Milestone {targetHours}h Quest
                    </b>
                    <small style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12 }}>
                      {remainingHours > 0
                        ? `${remainingHours} hours remaining to unlock legendary status.`
                        : 'Legendary status unlocked! Relentless mastery achieved.'}
                    </small>
                  </div>
                </div>

                <div className="v4-milestone-pill">
                  {questPercent}% Complete
                </div>
              </div>

              {/* Main Content Layout: Active Learning Paths & Recent Sessions */}
              <div className="v4-desktop-grid-2">
                {/* Column 1: Active Learning Paths */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#1E1B4B' }}>
                      Active Learning Paths
                    </h2>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#3B28CC', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => {
                        setEditingPath(null);
                        setPathSheetOpen(true);
                      }}
                    >
                      <DayformIcon name="plus" size={13} />
                      <span>New Path</span>
                    </button>
                  </div>

                  {paths.length > 0 ? (
                    paths.map((p, idx) => {
                      const streakDisplay = idx === 0 ? '🔥 12d Streak' : idx === 1 ? '🔥 4d Streak' : '🔥 Active';
                      return (
                        <div key={p.id} className="v4-learning-path-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 12,
                                  background: idx % 2 === 0 ? '#EEECFA' : '#FEF3C7',
                                  color: idx % 2 === 0 ? '#3B28CC' : '#D97706',
                                  display: 'grid',
                                  placeItems: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <DayformIcon name={p.icon || 'book'} size={18} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <b style={{ fontSize: 14, color: '#1E1B4B', display: 'block' }}>{p.name}</b>
                                <small style={{ color: '#6B7280', fontSize: 11.5 }}>
                                  {p.description || `${formatDurationMinutes(p.totalMinutesLogged)} invested`}
                                </small>
                              </div>
                            </div>

                            <span
                              style={{
                                background: idx % 2 === 0 ? '#CCFBF1' : '#F3E8FF',
                                color: idx % 2 === 0 ? '#0F766E' : '#6B21A8',
                                padding: '3px 8px',
                                borderRadius: 9999,
                                fontSize: 10.5,
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {streakDisplay}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4 }}>
                            <span style={{ color: '#6B7280', fontWeight: 600 }}>Progress</span>
                            <b style={{ color: '#1E1B4B' }}>{p.progress}%</b>
                          </div>
                          <div style={{ height: 6, width: '100%', borderRadius: 9999, background: '#EEF2F6', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${p.progress}%`,
                                background: idx % 2 === 0 ? '#3B28CC' : '#B45309',
                                borderRadius: 9999
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 6, borderTop: '1px solid #F3F4F6' }}>
                            <small style={{ color: '#9CA3AF', fontSize: 11 }}>
                              {p.lastSessionDate ? `Last ${formatDisplayDate(p.lastSessionDate)}` : 'No sessions yet'}
                            </small>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: '#3B28CC', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '4px 6px' }}
                                onClick={() => {
                                  setEditingSession(null);
                                  setDefaultPathId(p.id);
                                  setSessionSheetOpen(true);
                                }}
                              >
                                Log Session
                              </button>
                              <button
                                type="button"
                                className="ib sm"
                                onClick={() => {
                                  setEditingPath(p);
                                  setPathSheetOpen(true);
                                }}
                                aria-label={`Edit ${p.name}`}
                                title="Edit Path"
                              >
                                <DayformIcon name="pen" size={13} />
                              </button>
                              <button
                                type="button"
                                className="ib sm"
                                onClick={() => setDeletingPath(p)}
                                aria-label={`Delete ${p.name}`}
                                title="Delete Path"
                              >
                                <DayformIcon name="trash" size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyState
                      title="No learning paths yet"
                      description="Organize your study subjects and tracks to systematically build mastery."
                      action={
                        <button
                          type="button"
                          className="btn pri"
                          onClick={() => {
                            setEditingPath(null);
                            setPathSheetOpen(true);
                          }}
                        >
                          Create learning path
                        </button>
                      }
                    />
                  )}
                </div>

                {/* Column 2: Quick Focus Timer & Recent Sessions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <DayformIcon name="clock" size={16} />
                      <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#1E1B4B' }}>
                        Quick Focus Timer
                      </h2>
                    </div>
                    <FocusTimerCard learningPaths={paths} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#1E1B4B' }}>
                        Recent Sessions
                      </h2>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#3B28CC', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={() => {
                          setEditingSession(null);
                          setDefaultPathId(null);
                          setSessionSheetOpen(true);
                        }}
                      >
                        <DayformIcon name="plus" size={13} />
                        <span>Log Time</span>
                      </button>
                    </div>

                    {paths.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="session-filter" className="sr-only">
                          Filter sessions by learning path
                        </label>
                        <select
                          id="session-filter"
                          value={filterPathId}
                          onChange={(e) => setFilterPathId(e.target.value)}
                          style={{
                            width: '100%',
                            fontSize: 12.5,
                            padding: '8px 12px',
                            borderRadius: 12,
                            border: '1px solid #E8EDF5',
                            background: '#FFFFFF',
                            color: '#1E1B4B'
                          }}
                        >
                          <option value="">All learning paths</option>
                          {paths.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      {sessions.length > 0 ? (
                        sessions.map((s) => (
                          <div key={s.id} className="v4-session-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: '#CCFBF1',
                                  color: '#0D9488',
                                  display: 'grid',
                                  placeItems: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <DayformIcon name="clock" size={16} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <b style={{ fontSize: 13, color: '#1E1B4B', display: 'block' }}>{s.topic}</b>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                                  <span
                                    style={{
                                      background: '#EEECFA',
                                      color: '#3B28CC',
                                      padding: '1px 6px',
                                      borderRadius: 6,
                                      fontSize: 10.5,
                                      fontWeight: 600
                                    }}
                                  >
                                    {s.learningPathName || 'General'}
                                  </span>
                                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                                    {formatDisplayDate(s.sessionDate)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              <div style={{ textAlign: 'right' }}>
                                <b style={{ fontSize: 13, color: '#1E1B4B', display: 'block' }}>
                                  {Math.floor(s.minutes / 60) > 0 ? `${Math.floor(s.minutes / 60)}h ${s.minutes % 60}m` : `${s.minutes}m`}
                                </b>
                                <span style={{ fontSize: 9.5, fontWeight: 800, color: '#065F46', letterSpacing: '0.04em' }}>
                                  COMPLETED
                                </span>
                              </div>
                              <button
                                type="button"
                                className="ib sm"
                                onClick={() => {
                                  setEditingSession(s);
                                  setSessionSheetOpen(true);
                                }}
                                aria-label={`Edit ${s.topic}`}
                                title="Edit Session"
                              >
                                <DayformIcon name="pen" size={12} />
                              </button>
                              <button
                                type="button"
                                className="ib sm"
                                onClick={() => setDeletingSession(s)}
                                aria-label={`Delete ${s.topic}`}
                                title="Delete Session"
                              >
                                <DayformIcon name="trash" size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="v4-card" style={{ textAlign: 'center', padding: '24px 16px', color: '#6B7280', fontSize: 13 }}>
                          No study sessions logged yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          <LearningPathFormSheet
            isOpen={pathSheetOpen}
            editing={editingPath}
            onClose={() => {
              setPathSheetOpen(false);
              setEditingPath(null);
            }}
            onSubmit={handleSavePath}
            onDelete={setDeletingPath}
          />

          <StudySessionFormSheet
            isOpen={sessionSheetOpen}
            learningPaths={paths}
            defaultPathId={defaultPathId}
            editing={editingSession}
            onClose={() => {
              setSessionSheetOpen(false);
              setEditingSession(null);
              setDefaultPathId(null);
            }}
            onSubmit={handleSaveSession}
          />

          <ConfirmDialog
            isOpen={Boolean(deletingPath)}
            title="Delete learning path"
            message={`Delete "${deletingPath?.name}"? Logged study sessions will be preserved under General study.`}
            isBusy={deleteBusy}
            onConfirm={handleConfirmDeletePath}
            onCancel={() => setDeletingPath(null)}
          />

          <ConfirmDialog
            isOpen={Boolean(deletingSession)}
            title="Delete study session"
            message={`Remove "${deletingSession?.topic}" (${deletingSession?.minutes}m)?`}
            isBusy={deleteBusy}
            onConfirm={handleConfirmDeleteSession}
            onCancel={() => setDeletingSession(null)}
          />
        </>
      )}
    </div>
  );
};

