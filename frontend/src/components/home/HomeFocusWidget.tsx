import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';
import { useFocusTimer } from '../../contexts/FocusTimerContext';
import { focusService } from '../../services/focusService';
import type { FocusSummaryDto } from '../../types/api';
import { formatDurationMinutes } from '../../utils/date';

export const HomeFocusWidget: React.FC = () => {
  const navigate = useNavigate();
  const {
    status,
    remainingSeconds,
    toggle,
    reset,
    setPreset,
    presetMinutes
  } = useFocusTimer();

  const [summary, setSummary] = useState<FocusSummaryDto | null>(null);

  useEffect(() => {
    focusService
      .getSummary()
      .then(setSummary)
      .catch(() => {});
  }, [status]);

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');
  const timeFormatted = `${mm}:${ss}`;

  const todayMinutes = summary?.todayFocusMinutes ?? 0;
  const targetMinutes = summary?.dailyTargetMinutes ?? 120;
  const progressPct = Math.min(100, Math.round((todayMinutes / Math.max(1, targetMinutes)) * 100));

  const statusLabel =
    status === 'running'
      ? 'Focus in Progress'
      : status === 'paused'
      ? 'Session Paused'
      : status === 'completed'
      ? 'Target Achieved'
      : 'Ready to Focus';

  return (
    <div className="cd home-card-focus">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className="mod-icon mod-icon-focus">
            <DayformIcon name="clock" size={16} />
          </span>
          <div>
            <b className="d" style={{ fontSize: 15 }}>Focus Session</b>
            <div className="mut" style={{ fontSize: 11 }}>Deep work & Pomodoro</div>
          </div>
        </div>
        <span
          className={`badge ${
            status === 'running'
              ? 'badge-focus'
              : status === 'paused'
              ? 'badge-pending'
              : 'badge-info'
          } badge-sm`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Target Progress Bar */}
      <div style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span className="mut">
            Today: <b style={{ color: 'var(--ink)' }}>{formatDurationMinutes(todayMinutes)}</b> / {formatDurationMinutes(targetMinutes)} target
          </span>
          <span style={{ fontWeight: 600, color: 'var(--mod-focus)' }}>{progressPct}%</span>
        </div>
        <div style={{ height: 6, width: '100%', borderRadius: 999, background: 'var(--sf)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'var(--mod-focus)',
              borderRadius: 999,
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Main Timer Display & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'var(--cd-sec)',
          border: '1px solid var(--ln)',
          borderRadius: 'var(--radius-lg)',
          gap: 12
        }}
      >
        <div>
          <div style={{ font: '700 24px var(--font-display)', color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {timeFormatted}
          </div>
          <div className="mut" style={{ fontSize: 11 }}>
            {presetMinutes}m Pomodoro Mode
          </div>
        </div>

        <div className="row" style={{ gap: 6 }}>
          <button
            type="button"
            className="btn pri sm"
            onClick={toggle}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <DayformIcon name={status === 'running' ? 'pause' : 'play'} size={13} />
            <span>{status === 'running' ? 'Pause' : 'Start Focus'}</span>
          </button>

          {status !== 'idle' && (
            <button
              type="button"
              className="ib sm"
              onClick={reset}
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <DayformIcon name="reset" size={14} />
            </button>
          )}

          <button
            type="button"
            className="ib sm"
            onClick={() => navigate('/study?tab=focus')}
            title="Open Full Focus Hub"
            aria-label="Open Full Focus Hub"
          >
            <DayformIcon name="right" size={14} />
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div className="row" style={{ gap: 6 }}>
          {[25, 50].map((mins) => (
            <button
              key={mins}
              type="button"
              className={`chip ${presetMinutes === mins ? 'on' : ''}`}
              style={{
                fontSize: 11,
                padding: '2px 8px',
                minHeight: 24,
                borderColor: presetMinutes === mins ? 'var(--mod-focus)' : undefined,
                background: presetMinutes === mins ? 'var(--mod-focus)' : undefined
              }}
              onClick={() => setPreset(mins)}
              disabled={status === 'running'}
            >
              {mins}m
            </button>
          ))}
        </div>

        <Link to="/study?tab=history" className="lk" style={{ fontSize: 11 }}>
          History ({summary?.totalSessionsCount ?? 0} sessions)
        </Link>
      </div>
    </div>
  );
};

