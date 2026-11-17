import React, { useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { useFocusTimer } from '../../contexts/FocusTimerContext';
import { focusService } from '../../services/focusService';
import type { FocusSummaryDto } from '../../types/api';

export const HomeFocusWidget: React.FC = () => {
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

  return (
    <div className="v4-focus-card home-card-focus" style={{ marginBottom: 16 }}>
      {/* Header with Title and 25m/45m/60m presets matching Screenshot 1 */}
      <div className="v4-focus-header">
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <DayformIcon name="clock" size={17} />
          <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Deep Focus Session
          </span>
        </div>

        <div className="v4-focus-presets">
          {[25, 45, 60].map((mins) => (
            <button
              key={mins}
              type="button"
              className={`v4-focus-preset-btn ${presetMinutes === mins ? 'active' : ''}`}
              onClick={() => setPreset(mins)}
              title={`Set ${mins} minute session`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Large Digital Clock Countdown */}
      <div className="v4-focus-clock">{timeFormatted}</div>

      {/* Subtitle Status */}
      <div className="v4-focus-status-text">
        {status === 'running'
          ? 'NEURAL SYNCHRONIZATION ACTIVE'
          : status === 'paused'
          ? 'SESSION PAUSED — RESUME WHEN READY'
          : summary && summary.todayFocusMinutes > 0
          ? `NEURAL SYNCHRONIZATION READY • ${summary.todayFocusMinutes}M TODAY`
          : 'NEURAL SYNCHRONIZATION READY'}
      </div>

      {/* Primary Action Button */}
      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="v4-focus-action-btn"
          onClick={toggle}
        >
          {status === 'running' ? (
            <>
              <DayformIcon name="pause" size={16} />
              <span>Pause Session</span>
            </>
          ) : (
            <>
              <DayformIcon name="play" size={16} />
              <span>Start Session</span>
            </>
          )}
        </button>

        {status !== 'idle' && (
          <button
            type="button"
            className="ib sm"
            onClick={reset}
            title="Reset timer"
            aria-label="Reset timer"
            style={{
              width: 44,
              height: 44,
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF'
            }}
          >
            <DayformIcon name="reset" size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
