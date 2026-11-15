import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';
import { goalService } from '../../services/goalService';
import type { GoalDto } from '../../types/api';
import { formatDisplayDate } from '../../utils/date';

export const GoalOverviewWidget: React.FC = () => {
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await goalService.getAll();
      setGoals(data.filter((g) => g.status === 'Active'));
    } catch {
      setGoals([]);
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

  if (loading || goals.length === 0) {
    return null;
  }

  // Active goals summary
  const activeCount = goals.length;
  const avgProgress = Math.round(goals.reduce((sum, g) => sum + (g.progressPercentage || 0), 0) / activeCount);

  // Goal closest to deadline
  const sortedByDeadline = [...goals].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const focusGoal = sortedByDeadline[0];

  return (
    <div className="cd" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <DayformIcon name="star" size={17} />
          <b className="d" style={{ fontSize: 16 }}>Goal Trajectory</b>
        </div>
        <Link to="/planner?tab=goals" className="lk" style={{ fontSize: 13 }}>
          All goals <DayformIcon name="right" size={14} />
        </Link>
      </div>

      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Active Goals: {activeCount}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{avgProgress}% avg</span>
          </div>
          <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--sf)', overflow: 'hidden' }}>
            <div style={{ width: `${avgProgress}%`, height: '100%', background: 'var(--ac)', borderRadius: 3 }} />
          </div>
        </div>
      </div>

      {focusGoal && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--sf)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{focusGoal.title}</span>
            <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>{focusGoal.category}</span>
          </div>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, color: 'var(--mut)' }}>
            <span>Target: {formatDisplayDate(focusGoal.targetDate)}</span>
            <span>{focusGoal.progressPercentage}% completed</span>
          </div>
        </div>
      )}
    </div>
  );
};
