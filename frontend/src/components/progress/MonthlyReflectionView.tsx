import React, { useCallback, useEffect, useState } from 'react';
import { LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { specialGrandlineService } from '../../services/specialGrandlineService';
import type { MonthlyReflectionDto } from '../../types/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyReflectionView: React.FC = () => {
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const [reflection, setReflection] = useState<MonthlyReflectionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [expectations, setExpectations] = useState('');
  const [achievements, setAchievements] = useState('');
  const [improvements, setImprovements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [nextMonthPriorities, setNextMonthPriorities] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await specialGrandlineService.getMonthlyReflection(year, month);
      setReflection(data);
      if (data) {
        setExpectations(data.expectations || '');
        setAchievements(data.achievements || '');
        setImprovements(data.biggestImprovements || '');
        setChallenges(data.challengesFaced || '');
        setLessonsLearned(data.lessonsLearned || '');
        setNextMonthPriorities(data.nextMonthPriorities || '');
      } else {
        setExpectations('');
        setAchievements('');
        setImprovements('');
        setChallenges('');
        setLessonsLearned('');
        setNextMonthPriorities('');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await specialGrandlineService.upsertMonthlyReflection({
        year,
        month,
        expectations: expectations.trim() || undefined,
        achievements: achievements.trim() || undefined,
        biggestImprovements: improvements.trim() || undefined,
        challengesFaced: challenges.trim() || undefined,
        lessonsLearned: lessonsLearned.trim() || undefined,
        nextMonthPriorities: nextMonthPriorities.trim() || undefined
      });
      showToast(`Monthly Reflection for ${MONTH_NAMES[month - 1]} ${year} recorded! 📜`);
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760, margin: '0 auto' }}>
      {/* Month Selector */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Monthly Retrospective & Alignment</h2>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            Inspect expectations vs reality, extract hard lessons, and set high-leverage priorities.
          </p>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <select
            className="inp"
            style={{ width: 140, padding: '4px 8px', fontSize: 13 }}
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="inp"
            style={{ width: 80, padding: '4px 8px', fontSize: 13 }}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || currentYear)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton lines={6} />
      ) : (
        <form onSubmit={handleSave} className="cd" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 17 }}>
              {MONTH_NAMES[month - 1]} {year} Retrospective
            </h3>
            {reflection && <span className="chip on" style={{ fontSize: 11 }}>Saved</span>}
          </div>

          <div>
            <label className="lbl">1. What were your expectations entering this month?</label>
            <textarea
              className="inp"
              rows={2}
              placeholder="What did you set out to conquer?"
              value={expectations}
              onChange={(e) => setExpectations(e.target.value)}
            />
          </div>

          <div>
            <label className="lbl">2. Actual Achievements & Conquered Milestones</label>
            <textarea
              className="inp"
              rows={3}
              placeholder="What tangible victories, big or small, did you secure?"
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
            />
          </div>

          <div>
            <label className="lbl">3. Biggest Improvements & Growth Areas</label>
            <textarea
              className="inp"
              rows={2}
              placeholder="Where did your consistency, mindset, or physical capacity noticeably improve?"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
            />
          </div>

          <div>
            <label className="lbl">4. Challenges & Obstacles Faced</label>
            <textarea
              className="inp"
              rows={2}
              placeholder="What created friction? Where did willpower fail or discipline slip?"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
            />
          </div>

          <div>
            <label className="lbl">5. Key Lessons Learned</label>
            <textarea
              className="inp"
              rows={2}
              placeholder="What universal rule or personal insight did this month teach you?"
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
            />
          </div>

          <div>
            <label className="lbl">6. Next Month's Non-Negotiable Priorities</label>
            <textarea
              className="inp"
              rows={2}
              placeholder="The top 2-3 focus anchors for next month..."
              value={nextMonthPriorities}
              onChange={(e) => setNextMonthPriorities(e.target.value)}
            />
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="submit" className="btn pri" disabled={saving}>
              {saving ? 'Saving...' : 'Save Monthly Retrospective'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
