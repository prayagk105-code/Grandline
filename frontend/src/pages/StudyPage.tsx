import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
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
          pageSize: 8
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

  return (
    <>
      <PageHeader
        eyebrow="Feed your mind"
        title="Study & Deep Work"
        subtitle="Focused learning paths, deep work blocks, and deliberate practice."
        action={
          activeTab === 'paths' ? (
            <button
              type="button"
              className="btn pri sm"
              onClick={() => {
                setEditingSession(null);
                setDefaultPathId(null);
                setSessionSheetOpen(true);
              }}
              style={{ gap: 6 }}
            >
              <DayformIcon name="plus" size={14} />
              <span>Log Session</span>
            </button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="chips" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={`chip ${activeTab === 'paths' ? 'on' : ''}`}
          onClick={() => setTab('paths')}
        >
          Learning Paths
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'reading' ? 'on' : ''}`}
          onClick={() => setTab('reading')}
        >
          Reading Tracker
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
          className={`chip ${activeTab === 'focus' ? 'on' : ''}`}
          onClick={() => setTab('focus')}
        >
          Focus & Deep Work
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'history' ? 'on' : ''}`}
          onClick={() => setTab('history')}
        >
          Focus History & Screen Time
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
              <div className="g3" style={{ marginBottom: 18 }}>
                <StatCard
                  icon="clock"
                  label="This Week"
                  value={formatDurationMinutes(summary.minutesThisWeek)}
                  note="study volume"
                  accent="blue"
                />
                <StatCard
                  icon="book"
                  label="All-Time Study"
                  value={formatDurationMinutes(summary.totalMinutesAllTime)}
                  note="total time logged"
                  accent="indigo"
                />
                <StatCard
                  icon="flame"
                  label="Completed Sessions"
                  value={`${summary.totalSessionsAllTime}`}
                  note="sessions logged"
                  accent="forest"
                />
              </div>

              <div className="df-grid-2">
                <div>
                  <div className="sec" style={{ marginTop: 0 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span className="mod-icon mod-icon-study">
                        <DayformIcon name="book" size={16} />
                      </span>
                      <h2>Learning Paths</h2>
                    </div>
                    <button
                      type="button"
                      className="lk"
                      onClick={() => {
                        setEditingPath(null);
                        setPathSheetOpen(true);
                      }}
                    >
                      <DayformIcon name="plus" size={14} /> New Path
                    </button>
                  </div>

                  {paths.length > 0 ? (
                    paths.map((p) => (
                      <div key={p.id} className="cd cd-study">
                        <div className="row">
                          <span className="mod-icon mod-icon-study" style={{ width: 36, height: 36 }}>
                            <DayformIcon name={p.icon || 'book'} size={18} />
                          </span>
                          <div className="g" style={{ minWidth: 0 }}>
                            <b style={{ fontSize: 14 }}>{p.name}</b>
                            <small>{p.description || 'Personal study track'}</small>
                          </div>
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
                            <DayformIcon name="pen" size={14} />
                          </button>
                        </div>

                        <div className="row" style={{ justifyContent: 'space-between', marginTop: 12, fontSize: 12 }}>
                          <span className="mut">Progress</span>
                          <b style={{ color: 'var(--mod-study)' }}>{p.progress}%</b>
                        </div>
                        <div className="bar" style={{ marginTop: 4 }}>
                          <i style={{ width: `${p.progress}%`, background: 'var(--mod-study)' }} />
                        </div>

                        <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                          <small className="mut" style={{ fontSize: 11.5 }}>
                            {formatDurationMinutes(p.totalMinutesLogged)} ·{' '}
                            {p.lastSessionDate ? `last ${formatDisplayDate(p.lastSessionDate)}` : 'no sessions yet'}
                          </small>
                          <button
                            type="button"
                            className="lk"
                            style={{ fontSize: 12 }}
                            onClick={() => {
                              setEditingSession(null);
                              setDefaultPathId(p.id);
                              setSessionSheetOpen(true);
                            }}
                          >
                            <DayformIcon name="plus" size={13} /> Log Session
                          </button>
                        </div>
                      </div>
                    ))
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

                <div>
                  <div className="sec" style={{ marginTop: 0 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span className="mod-icon mod-icon-focus">
                        <DayformIcon name="clock" size={16} />
                      </span>
                      <h2>Quick Focus Timer</h2>
                    </div>
                  </div>
                  <FocusTimerCard learningPaths={paths} />

                  <div className="sec" style={{ marginTop: 20 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span className="mod-icon mod-icon-study">
                        <DayformIcon name="check" size={16} />
                      </span>
                      <h2>Recent Study Sessions</h2>
                    </div>
                    <button
                      type="button"
                      className="lk"
                      onClick={() => {
                        setEditingSession(null);
                        setDefaultPathId(null);
                        setSessionSheetOpen(true);
                      }}
                    >
                      <DayformIcon name="plus" size={14} /> Log Time
                    </button>
                  </div>

                  {paths.length > 0 ? (
                    <div className="f" style={{ marginBottom: 8 }}>
                      <label htmlFor="session-filter" className="sr-only">
                        Filter sessions by learning path
                      </label>
                      <select
                        id="session-filter"
                        value={filterPathId}
                        onChange={(e) => setFilterPathId(e.target.value)}
                        style={{ fontSize: 13, borderRadius: 'var(--radius-sm)' }}
                      >
                        <option value="">All learning paths</option>
                        {paths.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="cd cd-study">
                    {sessions.length > 0 ? (
                      sessions.map((s) => (
                        <div key={s.id} className="li" style={{ padding: '9px 0' }}>
                          <span className="mod-icon mod-icon-study" style={{ width: 32, height: 32 }}>
                            <DayformIcon name="clock" size={14} />
                          </span>
                          <div className="g" style={{ minWidth: 0 }}>
                            <b style={{ fontSize: 13 }}>{s.topic}</b>
                            <small>
                              {s.learningPathName} · {formatDisplayDate(s.sessionDate)}
                            </small>
                          </div>
                          <b style={{ fontSize: 12, color: 'var(--mod-study)' }}>{s.minutes}m</b>
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
                            <DayformIcon name="pen" size={13} />
                          </button>
                          <button
                            type="button"
                            className="ib sm"
                            onClick={() => setDeletingSession(s)}
                            aria-label={`Delete ${s.topic}`}
                            title="Delete Session"
                          >
                            <DayformIcon name="trash" size={13} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="mut" style={{ margin: 0, padding: '8px 0', fontSize: 13 }}>
                        No study sessions logged yet.
                      </p>
                    )}
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
    </>
  );
};
