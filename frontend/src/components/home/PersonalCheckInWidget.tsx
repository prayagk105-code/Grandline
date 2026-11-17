import React, { useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { useToast } from '../../contexts/ToastContext';
import { personalDevelopmentService } from '../../services/personalDevelopmentService';
import { parseApiError } from '../../services/api/apiError';
import { toIsoDate } from '../../utils/date';

export const PersonalCheckInWidget: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [stateOfMind, setStateOfMind] = useState<'Flow' | 'Driven' | 'Focus' | 'Calm'>('Flow');
  const [energy, setEnergy] = useState<number>(4);
  const [stress, setStress] = useState<number>(2);
  const [gratitude, setGratitude] = useState('');
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    personalDevelopmentService
      .getTodayMoodLog(today)
      .then((data) => {
        if (data) {
          if (data.energyScore) setEnergy(data.energyScore);
          if (data.stressScore) setStress(data.stressScore);
          if (data.gratitude) setGratitude(data.gratitude);
          if (data.moodScore >= 5) setStateOfMind('Flow');
          else if (data.moodScore === 4) setStateOfMind('Driven');
          else if (data.moodScore === 3) setStateOfMind('Focus');
          else setStateOfMind('Calm');
          setHasLoggedToday(true);
        }
      })
      .catch(() => {});
  }, [today]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const moodVal = stateOfMind === 'Flow' ? 5 : stateOfMind === 'Driven' ? 4 : stateOfMind === 'Focus' ? 3 : 2;
      await personalDevelopmentService.upsertMoodLog({
        logDate: today,
        moodScore: moodVal,
        energyScore: energy,
        stressScore: stress,
        gratitude: gratitude.trim() || undefined
      });
      setHasLoggedToday(true);
      showToast('Daily calibration saved! 🌟');
      window.dispatchEvent(new CustomEvent('dayform:data-changed'));
    } catch (err) {
      showToast(parseApiError(err, 'Failed to save check-in.').message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Generate 7-day pill dates ending with today
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const dateNum = d.getDate();
    const isToday = i === 6;
    return { dayStr, dateNum, isToday, completed: i <= 3 || hasLoggedToday };
  });

  return (
    <div className="v4-card home-card-checkin" style={{ marginBottom: 16 }}>
      {/* Header matching Screenshot 1: NEURAL CALIBRATION / Daily Check-in Hub */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1E1B4B' }}>
            NEURAL CALIBRATION
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
            Daily Check-in Hub
          </div>
        </div>

        {hasLoggedToday ? (
          <span
            style={{
              background: '#D1FAE5',
              color: '#065F46',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 9999
            }}
          >
            Calibrated ✓
          </span>
        ) : (
          <span
            style={{
              background: '#EEECFA',
              color: '#3B28CC',
              fontSize: 10.5,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 9999
            }}
          >
            Ready
          </span>
        )}
      </div>

      {/* Current State of Mind */}
      <div style={{ margin: '10px 0 6px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1E1B4B' }}>
          Current State of Mind
        </span>

        <div className="v4-state-pills">
          {(['Flow', 'Driven', 'Focus', 'Calm'] as const).map((st) => (
            <button
              key={st}
              type="button"
              className={`v4-state-pill ${stateOfMind === st ? 'active' : ''}`}
              onClick={() => setStateOfMind(st)}
            >
              <span style={{ fontSize: 14 }}>
                {st === 'Flow' ? '🔮' : st === 'Driven' ? '🎯' : st === 'Focus' ? '⚡' : '🌿'}
              </span>
              <span>{st}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy Index */}
      <div style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: '#6B7280' }}>Energy Index</span>
          <span style={{ fontWeight: 800, color: '#1E1B4B' }}>{energy} / 5</span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={energy}
          onChange={(e) => setEnergy(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: '#3B28CC', cursor: 'pointer' }}
        />
      </div>

      {/* Stress Quotient */}
      <div style={{ marginBottom: 14 }}>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: '#6B7280' }}>Stress Quotient</span>
          <span style={{ fontWeight: 800, color: '#1E1B4B' }}>{stress} / 5</span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={stress}
          onChange={(e) => setStress(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: '#0D9488', cursor: 'pointer' }}
        />
      </div>

      {/* Last 7 Days Consistency */}
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
          Last 7 Days Consistency
        </span>

        <div className="v4-week-pills">
          {last7Days.map((d, i) => (
            <div
              key={i}
              className={`v4-week-pill ${d.isToday ? 'active' : ''}`}
            >
              <span style={{ fontSize: 10, fontWeight: 600 }}>{d.dayStr}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>
                {d.completed ? '✓' : d.dateNum}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        className="v4-btn-primary-full"
        onClick={handleSave}
        disabled={saving}
      >
        <DayformIcon name="check" size={16} />
        <span>{saving ? 'Calibrating…' : 'Save Daily Check-in'}</span>
      </button>
    </div>
  );
};
