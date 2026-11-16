import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';
import { studyService } from '../../services/studyService';
import type { LearningPathDto, StudySummaryDto } from '../../types/api';
import { formatDurationMinutes, toIsoDate } from '../../utils/date';

export const HomeStudyWidget: React.FC = () => {
  const [summary, setSummary] = useState<StudySummaryDto | null>(null);
  const [paths, setPaths] = useState<LearningPathDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [sum, lp] = await Promise.all([
        studyService.getSummary(toIsoDate()).catch(() => null),
        studyService.getLearningPaths(false).catch(() => [])
      ]);
      setSummary(sum);
      setPaths(lp);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handleChanged = () => load();
    window.addEventListener('dayform:data-changed', handleChanged);
    return () => window.removeEventListener('dayform:data-changed', handleChanged);
  }, [load]);

  if (loading && !summary && paths.length === 0) return null;

  const activePath = paths.length > 0 ? paths[0] : null;
  const minutesThisWeek = summary?.minutesThisWeek ?? 0;
  const totalSessions = summary?.totalSessionsAllTime ?? 0;

  return (
    <div className="cd cd-study home-card-study">
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center', minWidth: 0, flex: 1 }}>
          <span className="mod-icon mod-icon-study" style={{ flexShrink: 0 }}>
            <DayformIcon name="book" size={16} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="row" style={{ alignItems: 'center', gap: 6 }}>
              <b className="d" style={{ fontSize: 15 }}>Study & Mastery</b>
              <span className="badge badge-study badge-sm" style={{ fontWeight: 600 }}>
                {formatDurationMinutes(minutesThisWeek)} this week
              </span>
            </div>
            <div className="mut" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {paths.length} active {paths.length === 1 ? 'path' : 'paths'} · {totalSessions} total sessions
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 6, flexShrink: 0 }}>
          <Link to="/study?tab=paths" className="btn sm" style={{ padding: '3px 8px', fontSize: 11 }}>
            + Log
          </Link>
          <Link to="/study" className="lk" style={{ fontSize: 12 }} title="Go to Study page">
            Study <DayformIcon name="right" size={13} />
          </Link>
        </div>
      </div>

      {/* Active Learning Path Spotlight */}
      {activePath ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--cd-sec)',
            border: '1px solid var(--ln)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="row" style={{ gap: 6, alignItems: 'center', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: 13 }}>📚</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'var(--ink)'
                }}
              >
                {activePath.name}
              </span>
            </div>
            <span className="badge badge-study badge-sm" style={{ flexShrink: 0 }}>
              {activePath.progress}% Complete
            </span>
          </div>

          <div style={{ height: 5, width: '100%', borderRadius: 999, background: 'var(--cd)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, activePath.progress))}%`,
                background: 'var(--mod-study)',
                borderRadius: 999,
                transition: 'width 0.3s ease'
              }}
            />
          </div>

          <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, color: 'var(--mut)' }}>
            <span>Logged: {formatDurationMinutes(activePath.totalMinutesLogged)}</span>
            <span>{activePath.sessionCount} sessions</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <p className="mut" style={{ margin: 0, fontSize: 12.5 }}>
            No active learning path tracked yet.
          </p>
          <Link to="/study" className="lk" style={{ fontSize: 12, marginTop: 4 }}>
            Create a learning path
          </Link>
        </div>
      )}
    </div>
  );
};
