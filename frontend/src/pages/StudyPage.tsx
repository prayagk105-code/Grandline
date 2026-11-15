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
        subtitle="Focused sessions, Pomodoro, and disciplined learning paths."
        action={
          activeTab === 'paths' ? (
            <button
              type="button"
              className="ib"
              onClick={() => {
                setEditingSession(null);
                setDefaultPathId(null);
                setSessionSheetOpen(true);
              }}
              aria-label="Log study time"
            >
              <DayformIcon name="plus" />
            </button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="chips" style={{ marginBottom: 20 }}>
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
              <div className="g3">
                <StatCard
                  icon="clock"
                  label="This week"
                  value={formatDurationMinutes(summary.minutesThisWeek)}
                  note="weekly study volume"
                />
                <StatCard
                  icon="study"
                  label="All-time"
                  value={formatDurationMinutes(summary.totalMinutesAllTime)}
                  note="total study logged"
                />
                <StatCard
                  icon="flame"
                  label="Sessions"
                  value={`${summary.totalSessionsAllTime}`}
                  note="sessions completed"
                />
              </div>

              <div className="df-grid-2">
                <div>
                  <div className="sec">
                    <h2>Learning paths</h2>
                    <button
                      type="button"
                      className="lk"
                      onClick={() => {
                        setEditingPath(null);
                        setPathSheetOpen(true);
                      }}
                    >
                      <DayformIcon name="plus" size={14} /> New
                    </button>
                  </div>

                  {paths.length > 0 ? (
                    paths.map((p) => (
                      <div key={p.id} className="cd">
                        <div className="row">
                          <span className="ic">
                            <DayformIcon name={p.icon || 'book'} />
                          </span>
                          <div className="g">
                            <b>{p.name}</b>
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
                          >
                            <DayformIcon name="pen" size={15} />
                          </button>
                        </div>

                        <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
                          <small className="mut">Progress</small>
                          <b>{p.progress}%</b>
                        </div>
                        <div className="bar">
                          <i style={{ width: `${p.progress}%` }} />
                        </div>

                        <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                          <small className="mut">
                            {formatDurationMinutes(p.totalMinutesLogged)} ·{' '}
                            {p.lastSessionDate ? `last ${formatDisplayDate(p.lastSessionDate)}` : 'no sessions'}
                          </small>
                          <button
                            type="button"
                            className="lk"
                            onClick={() => {
                              setEditingSession(null);
                              setDefaultPathId(p.id);
                              setSessionSheetOpen(true);
                            }}
                          >
                            <DayformIcon name="plus" size={14} /> Log
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No learning paths yet"
                      description="Organize your study subjects and track progress."
                      action={
                        <button
                          type="button"
                          className="btn pri"
                          onClick={() => {
                            setEditingPath(null);
                            setPathSheetOpen(true);
                          }}
                        >
                          Create path
                        </button>
                      }
                    />
                  )}
                </div>

                <div>
                  <div className="sec">
                    <h2>Focus timer</h2>
                  </div>
                  <FocusTimerCard learningPaths={paths} />

                  <div className="sec">
                    <h2>Recent sessions</h2>
                    <button
                      type="button"
                      className="lk"
                      onClick={() => {
                        setEditingSession(null);
                        setDefaultPathId(null);
                        setSessionSheetOpen(true);
                      }}
                    >
                      <DayformIcon name="plus" size={14} /> Log time
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

                  <div className="cd">
                    {sessions.length > 0 ? (
                      sessions.map((s) => (
                        <div key={s.id} className="li">
                          <span className="ic">
                            <DayformIcon name="clock" />
                          </span>
                          <div className="g">
                            <b>{s.topic}</b>
                            <small>
                              {s.learningPathName} · {formatDisplayDate(s.sessionDate)}
                            </small>
                          </div>
                          <b style={{ fontSize: 12 }}>{s.minutes}m</b>
                          <button
                            type="button"
                            className="ib sm"
                            onClick={() => {
                              setEditingSession(s);
                              setSessionSheetOpen(true);
                            }}
                            aria-label={`Edit ${s.topic}`}
                          >
                            <DayformIcon name="pen" size={14} />
                          </button>
                          <button
                            type="button"
                            className="ib sm"
                            onClick={() => setDeletingSession(s)}
                            aria-label={`Delete ${s.topic}`}
                          >
                            <DayformIcon name="trash" size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="mut" style={{ margin: 0 }}>No study sessions logged yet.</p>
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
