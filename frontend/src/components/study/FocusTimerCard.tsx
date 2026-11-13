import React from 'react';
import { useFocusTimer } from '../../contexts/FocusTimerContext';
import type { LearningPathDto } from '../../types/api';
import { DayformIcon } from '../common/DayformIcon';
import { ProgressRing } from '../common/ProgressRing';

interface FocusTimerCardProps {
  compact?: boolean;
  learningPaths?: LearningPathDto[];
}

export const FocusTimerCard: React.FC<FocusTimerCardProps> = ({ compact = false, learningPaths = [] }) => {
  const {
    presetMinutes,
    status,
    remainingSeconds,
    totalSeconds,
    learningPathId,
    topic,
    isSaving,
    setPreset,
    setLearningPathId,
    setTopic,
    toggle,
    reset,
    saveElapsed
  } = useFocusTimer();

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');
  const timeText = `${mm}:${ss}`;
  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  const statusText =
    status === 'running'
      ? 'Focus in progress'
      : status === 'completed'
        ? 'Session complete'
        : status === 'paused'
          ? 'Paused — resume when ready'
          : 'Ready when you are';

  if (compact) {
    return (
      <div className="cd rg">
        <ProgressRing percent={pct} size={92} strokeWidth={9} label={timeText} />
        <div className="g">
          <p className="mut" style={{ margin: '0 0 10px' }}>{statusText}</p>
          <div className="row">
            <button type="button" className="btn pri" onClick={toggle}>
              <DayformIcon name={status === 'running' ? 'pause' : 'play'} size={15} />
              <span>{status === 'running' ? 'Pause' : 'Start'}</span>
            </button>
            <button type="button" className="btn" onClick={reset} aria-label="Reset timer">
              <DayformIcon name="reset" size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cd" style={{ textAlign: 'center' }}>
      <div className="chips" style={{ justifyContent: 'center' }}>
        {[25, 50, 60].map((m) => (
          <button
            key={m}
            type="button"
            className={`chip ${presetMinutes === m ? 'on' : ''}`}
            onClick={() => setPreset(m)}
            disabled={status === 'running'}
          >
            {m} min
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
        <ProgressRing percent={pct} size={170} strokeWidth={10} label={timeText} />
      </div>

      <p className="mut" style={{ margin: '10px 0 14px' }}>{statusText}</p>

      {learningPaths.length > 0 ? (
        <div className="g2" style={{ textAlign: 'left', marginBottom: 14 }}>
          <div className="f" style={{ marginBottom: 0 }}>
            <label htmlFor="timer-path">Learning path</label>
            <select
              id="timer-path"
              value={learningPathId ?? ''}
              onChange={(e) => setLearningPathId(e.target.value || null)}
            >
              <option value="">General study</option>
              {learningPaths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="f" style={{ marginBottom: 0 }}>
            <label htmlFor="timer-topic">Topic (optional)</label>
            <input
              id="timer-topic"
              type="text"
              placeholder="Focus session"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      <div className="row c">
        <button type="button" className="btn pri" onClick={toggle}>
          <DayformIcon name={status === 'running' ? 'pause' : 'play'} size={15} />
          <span>{status === 'running' ? 'Pause' : 'Start'}</span>
        </button>
        <button type="button" className="btn" onClick={reset} aria-label="Reset timer">
          <DayformIcon name="reset" size={16} />
        </button>
        <button type="button" className="btn" onClick={saveElapsed} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};

