import React, { useEffect, useRef, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { ProgressRing } from '../common/ProgressRing';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { focusService } from '../../services/focusService';
import type { LearningPathDto } from '../../types/api';
import { toIsoDate } from '../../utils/date';

interface FocusProductivityCardProps {
  learningPaths?: LearningPathDto[];
  onSessionLogged?: () => void;
}

type Mode = 'pomodoro' | 'deepwork' | 'custom' | 'stopwatch';

export const FocusProductivityCard: React.FC<FocusProductivityCardProps> = ({
  learningPaths = [],
  onSessionLogged
}) => {
  const { showToast } = useToast();
  const today = toIsoDate();
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [pomodoroLength, setPomodoroLength] = useState<25 | 50>(25);
  const [customMinutes, setCustomMinutes] = useState(45);

  // Timer states
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);

  // Stopwatch states
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);

  // Session metadata
  const [selectedPathId, setSelectedPathId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [distractionCount, setDistractionCount] = useState(0);
  const [breakBanner, setBreakBanner] = useState<string | null>(null);

  // Daily target tracking
  const [dailyCompletedMinutes, setDailyCompletedMinutes] = useState(0);
  const dailyTargetMinutes = 120; // 2 hours default target

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopwatchRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load summary for today's focus target
  useEffect(() => {
    focusService.getSummary().then((sum) => {
      setDailyCompletedMinutes(sum.todayFocusMinutes);
    }).catch(() => {});
  }, []);

  // Update timer total when mode or presets change while idle
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'pomodoro') {
        const secs = pomodoroLength * 60;
        setSecondsLeft(secs);
        setTotalSeconds(secs);
      } else if (mode === 'deepwork') {
        const secs = 90 * 60;
        setSecondsLeft(secs);
        setTotalSeconds(secs);
      } else if (mode === 'custom') {
        const secs = customMinutes * 60;
        setSecondsLeft(secs);
        setTotalSeconds(secs);
      }
    }
  }, [mode, pomodoroLength, customMinutes, isRunning]);

  // Main countdown tick
  useEffect(() => {
    if (isRunning && mode !== 'stopwatch') {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  // Stopwatch tick
  useEffect(() => {
    if (isRunning && mode === 'stopwatch') {
      stopwatchRef.current = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isRunning, mode]);

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
    setBreakBanner(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'stopwatch') {
      setStopwatchSeconds(0);
      setLaps([]);
    } else {
      setSecondsLeft(totalSeconds);
    }
    setDistractionCount(0);
  };

  const handleDistraction = () => {
    setDistractionCount((prev) => prev + 1);
    showToast('Distraction noted. Refocus your gaze and breathe.');
  };

  const handleLap = () => {
    setLaps((prev) => [stopwatchSeconds, ...prev]);
  };

  const handleCompleteSession = async () => {
    setIsRunning(false);
    const durationMinutes = Math.round(totalSeconds / 60);

    try {
      await focusService.createSession({
        sessionDate: today,
        sessionType: mode === 'deepwork' ? 'DeepWork' : mode === 'pomodoro' ? 'Pomodoro' : 'Custom',
        durationMinutes,
        distractionCount,
        notes: topic.trim() || undefined
      });

      setDailyCompletedMinutes((prev) => prev + durationMinutes);
      showToast(`Focus block complete! Logged ${durationMinutes} minutes.`);

      const breakTime = mode === 'pomodoro' ? (pomodoroLength === 25 ? '5' : '10') : '15';
      setBreakBanner(`Great work! Take a ${breakTime}-minute physical break: stretch, hydrate, rest your eyes.`);

      if (onSessionLogged) onSessionLogged();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleSaveStopwatch = async () => {
    if (stopwatchSeconds < 60) {
      showToast('Stopwatch session must be at least 1 minute to save');
      return;
    }
    const mins = Math.round(stopwatchSeconds / 60);
    try {
      await focusService.createSession({
        sessionDate: today,
        sessionType: 'Stopwatch',
        durationMinutes: mins,
        distractionCount,
        notes: topic.trim() || undefined
      });
      showToast(`Stopwatch session saved: ${mins} minutes`);
      setDailyCompletedMinutes((prev) => prev + mins);
      handleReset();
      if (onSessionLogged) onSessionLogged();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  // Time formatters
  const displaySeconds = mode === 'stopwatch' ? stopwatchSeconds : secondsLeft;
  const mm = String(Math.floor(displaySeconds / 60)).padStart(2, '0');
  const ss = String(displaySeconds % 60).padStart(2, '0');
  const timeDisplay = `${mm}:${ss}`;

  const ringPercent =
    mode === 'stopwatch'
      ? Math.min(100, (stopwatchSeconds / 3600) * 100)
      : totalSeconds > 0
        ? (secondsLeft / totalSeconds) * 100
        : 0;

  const targetProgressPercent = Math.min(100, (dailyCompletedMinutes / dailyTargetMinutes) * 100);

  return (
    <div className="cd" style={{ padding: '16px 18px' }}>
      {/* Mode Selection Tabs */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div className="chips" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`chip ${mode === 'pomodoro' ? 'on' : ''}`}
            onClick={() => {
              if (!isRunning) setMode('pomodoro');
            }}
          >
            Pomodoro
          </button>
          <button
            type="button"
            className={`chip ${mode === 'deepwork' ? 'on' : ''}`}
            onClick={() => {
              if (!isRunning) setMode('deepwork');
            }}
          >
            Deep Work (90m)
          </button>
          <button
            type="button"
            className={`chip ${mode === 'custom' ? 'on' : ''}`}
            onClick={() => {
              if (!isRunning) setMode('custom');
            }}
          >
            Custom Timer
          </button>
          <button
            type="button"
            className={`chip ${mode === 'stopwatch' ? 'on' : ''}`}
            onClick={() => {
              if (!isRunning) setMode('stopwatch');
            }}
          >
            Stopwatch
          </button>
        </div>

        {/* Daily Target Indicator */}
        <div style={{ textAlign: 'right', minWidth: 150 }}>
          <div className="mut" style={{ fontSize: 11 }}>
            Daily Focus Target: {dailyCompletedMinutes}/{dailyTargetMinutes}m ({Math.round(targetProgressPercent)}%)
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--ln)', borderRadius: 2, marginTop: 4 }}>
            <div
              style={{
                width: `${targetProgressPercent}%`,
                height: '100%',
                background: 'var(--ac)',
                borderRadius: 2
              }}
            />
          </div>
        </div>
      </div>

      {/* Preset sub-toggles */}
      {mode === 'pomodoro' && !isRunning && (
        <div className="row" style={{ gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={`chip ${pomodoroLength === 25 ? 'on' : ''}`}
            onClick={() => setPomodoroLength(25)}
            style={{ fontSize: 12 }}
          >
            Standard (25 min)
          </button>
          <button
            type="button"
            className={`chip ${pomodoroLength === 50 ? 'on' : ''}`}
            onClick={() => setPomodoroLength(50)}
            style={{ fontSize: 12 }}
          >
            Extended (50 min)
          </button>
        </div>
      )}

      {mode === 'custom' && !isRunning && (
        <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <label style={{ fontSize: 13 }} className="mut">Set duration:</label>
          <input
            type="number"
            min={1}
            max={300}
            className="inp"
            style={{ width: 80, padding: '4px 8px' }}
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <span style={{ fontSize: 13 }}>minutes</span>
        </div>
      )}

      {/* Break reminder notification banner */}
      {breakBanner && (
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--ac)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--ac)', fontWeight: 500 }}>☕ {breakBanner}</span>
          <button
            type="button"
            className="ib"
            onClick={() => setBreakBanner(null)}
            style={{ height: 24, width: 24 }}
          >
            <DayformIcon name="close" size={12} />
          </button>
        </div>
      )}

      {/* Timer Circle & Core Controls */}
      <div className="df-grid-2" style={{ alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ProgressRing percent={ringPercent} size={180} strokeWidth={12} label={timeDisplay} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Metadata selectors */}
          <div className="row" style={{ gap: 10 }}>
            <select
              className="inp"
              style={{ flex: 1, fontSize: 13 }}
              value={selectedPathId}
              onChange={(e) => setSelectedPathId(e.target.value)}
              disabled={isRunning}
            >
              <option value="">General Focus / No Path</option>
              {learningPaths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            className="inp"
            placeholder="Focus block intention or task..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isRunning}
            style={{ fontSize: 13 }}
          />

          {/* Buttons */}
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="btn pri"
              onClick={handleStartPause}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <DayformIcon name={isRunning ? 'pause' : 'play'} size={16} />
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              type="button"
              className="btn sec"
              onClick={handleReset}
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <DayformIcon name="reset" size={16} />
            </button>

            {mode === 'stopwatch' && isRunning && (
              <button type="button" className="btn sec" onClick={handleLap} style={{ fontSize: 12 }}>
                Lap
              </button>
            )}

            {mode === 'stopwatch' && !isRunning && stopwatchSeconds > 0 && (
              <button type="button" className="btn pri" onClick={handleSaveStopwatch} style={{ fontSize: 12 }}>
                Save Session
              </button>
            )}
          </div>

          {/* Distraction Tracker Button */}
          {isRunning && (
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', background: 'var(--sf)', padding: '8px 12px', borderRadius: 8 }}>
              <span style={{ fontSize: 12 }} className="mut">
                Distractions: <b>{distractionCount}</b>
              </span>
              <button
                type="button"
                className="btn sec"
                onClick={handleDistraction}
                style={{ fontSize: 12, padding: '4px 10px' }}
              >
                + Log Distraction
              </button>
            </div>
          )}

          {/* Laps display for stopwatch */}
          {mode === 'stopwatch' && laps.length > 0 && (
            <div style={{ maxHeight: 90, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {laps.map((l, i) => (
                <div key={i} className="row mut" style={{ justifyContent: 'space-between', fontSize: 11 }}>
                  <span>Lap {laps.length - i}</span>
                  <span>{String(Math.floor(l / 60)).padStart(2, '0')}:{String(l % 60).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
