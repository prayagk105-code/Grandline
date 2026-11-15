import React, { useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { useToast } from '../../contexts/ToastContext';
import { personalDevelopmentService } from '../../services/personalDevelopmentService';
import { parseApiError } from '../../services/api/apiError';
import { toIsoDate } from '../../utils/date';

export const PersonalCheckInWidget: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [mood, setMood] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);
  const [stress, setStress] = useState<number>(2);
  const [gratitude, setGratitude] = useState('');
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    personalDevelopmentService
      .getTodayMoodLog(today)
      .then((data) => {
        if (data) {
          setMood(data.moodScore);
          setEnergy(data.energyScore);
          setStress(data.stressScore);
          if (data.gratitude) setGratitude(data.gratitude);
          setHasLoggedToday(true);
        }
      })
      .catch(() => {});
  }, [today]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await personalDevelopmentService.upsertMoodLog({
        logDate: today,
        moodScore: mood,
        energyScore: energy,
        stressScore: stress,
        gratitude: gratitude.trim() || undefined
      });
      setHasLoggedToday(true);
      showToast('Daily check-in saved! 🌟');
      window.dispatchEvent(new CustomEvent('dayform:data-changed'));
    } catch (err) {
      showToast(parseApiError(err, 'Failed to save check-in.').message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const moodEmojis = ['😞', '😕', '😐', '🙂', '✨'];

  return (
    <div className="cd home-card-checkin">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className="mod-icon mod-icon-personal">
            <DayformIcon name="heart" size={16} />
          </span>
          <div>
            <b className="d" style={{ fontSize: 15 }}>Personal Check-in</b>
            <div className="mut" style={{ fontSize: 11 }}>Vibe, state & gratitude</div>
          </div>
        </div>

        {hasLoggedToday ? (
          <span className="badge badge-completed badge-sm">Logged ✓</span>
        ) : (
          <span className="badge badge-pending badge-sm">Pending</span>
        )}
      </div>

      {/* Mood Selector */}
      <div style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500 }}>Mood</span>
          <span className="mut" style={{ fontSize: 11 }}>
            {mood === 1 && 'Low'}
            {mood === 2 && 'Subdued'}
            {mood === 3 && 'Balanced'}
            {mood === 4 && 'Good'}
            {mood === 5 && 'Radiant'}
          </span>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              type="button"
              className={`chip ${mood === val ? 'on' : ''}`}
              onClick={() => {
                setMood(val);
                setExpanded(true);
              }}
              style={{
                flex: 1,
                fontSize: 16,
                padding: '6px 0',
                minHeight: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-pill)',
                border: mood === val ? '1.5px solid var(--ac)' : '1px solid var(--ln)',
                background: mood === val ? 'var(--ac2)' : 'var(--cd-sec)'
              }}
              title={`Mood level ${val}`}
              aria-label={`Mood level ${val}`}
            >
              {moodEmojis[val - 1]}
            </button>
          ))}
        </div>
      </div>

      {/* Energy & Stress */}
      <div className="row" style={{ gap: 14, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Energy</span>
            <span className="mut" style={{ fontSize: 11 }}>{energy}/5</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={energy}
            onChange={(e) => {
              setEnergy(parseInt(e.target.value));
              setExpanded(true);
            }}
            style={{ width: '100%', accentColor: 'var(--ac)' }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Stress</span>
            <span className="mut" style={{ fontSize: 11 }}>{stress}/5</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={stress}
            onChange={(e) => {
              setStress(parseInt(e.target.value));
              setExpanded(true);
            }}
            style={{ width: '100%', accentColor: 'var(--hot)' }}
          />
        </div>
      </div>

      {/* Gratitude input (expandable or default visible if already logged) */}
      {(expanded || gratitude) && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11.5, display: 'block', marginBottom: 4 }} className="mut">
            One thing you are grateful for today
          </label>
          <input
            type="text"
            className="inp"
            style={{
              width: '100%',
              fontSize: 12.5,
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--ln)',
              background: 'var(--cd)'
            }}
            placeholder="e.g., Morning sunlight and quiet focus"
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
          />
        </div>
      )}

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        {!expanded && !hasLoggedToday ? (
          <button
            type="button"
            className="lk"
            style={{ fontSize: 11.5 }}
            onClick={() => setExpanded(true)}
          >
            + Add gratitude note
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          className="btn pri sm"
          style={{ padding: '6px 14px', fontSize: 12 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : hasLoggedToday ? 'Update Check-in' : 'Save Check-in'}
        </button>
      </div>
    </div>
  );
};
