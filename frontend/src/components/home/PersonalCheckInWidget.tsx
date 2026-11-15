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
    <div className="cd" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <DayformIcon name="heart" size={17} />
          <b className="d" style={{ fontSize: 16 }}>Personal Check-in</b>
        </div>
        {hasLoggedToday ? (
          <span className="chip on" style={{ fontSize: 11, padding: '2px 8px' }}>
            Logged today ✓
          </span>
        ) : (
          <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
            Pending
          </span>
        )}
      </div>

      {/* Mood Selector */}
      <div>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Mood</span>
          <span className="mut" style={{ fontSize: 12 }}>
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
                fontSize: 18,
                padding: '8px 0',
                textAlign: 'center',
                minHeight: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                border: mood === val ? '1.5px solid var(--ac)' : '1px solid var(--bd)',
                background: mood === val ? 'var(--ac2)' : 'var(--sf)',
                transition: 'all 0.15s ease'
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
      <div className="row" style={{ gap: 16 }}>
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
            style={{ width: '100%', accentColor: 'var(--ac)' }}
          />
        </div>
      </div>

      {/* Gratitude input (expandable) */}
      {(expanded || gratitude) && (
        <div className="f" style={{ marginTop: 2 }}>
          <label style={{ fontSize: 12 }}>One thing you are grateful for today</label>
          <input
            type="text"
            className="inp"
            style={{ fontSize: 13 }}
            placeholder="e.g., Morning sunlight and quiet focus"
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
          />
        </div>
      )}

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        {!expanded && !hasLoggedToday ? (
          <button
            type="button"
            className="lk"
            style={{ fontSize: 12 }}
            onClick={() => setExpanded(true)}
          >
            + Add gratitude note
          </button>
        ) : <div />}

        <button
          type="button"
          className="btn pri"
          style={{ padding: '6px 14px', fontSize: 13 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : hasLoggedToday ? 'Update Check-in' : 'Save Check-in'}
        </button>
      </div>
    </div>
  );
};

