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

  // Active goals sorted by target date (closest deadline first)
  const sortedGoals = [...goals].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
  const topGoals = sortedGoals.slice(0, 3);
  const remainingCount = Math.max(0, sortedGoals.length - 3);

  return (
    <div className="cd home-card-goals">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className="mod-icon mod-icon-progress">
            <DayformIcon name="star" size={16} />
          </span>
          <div>
            <b className="d" style={{ fontSize: 15 }}>Active Goals</b>
            <div className="mut" style={{ fontSize: 11 }}>Long-term trajectories & milestones</div>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <Link to="/planner?tab=goals" className="btn sm" style={{ padding: '3px 8px', fontSize: 11 }}>
            + Add
          </Link>
          <Link to="/planner?tab=goals" className="lk" style={{ fontSize: 12 }}>
            View All <DayformIcon name="right" size={13} />
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topGoals.map((g) => {
          const progress = Math.min(100, Math.max(0, g.progressPercentage || 0));

          return (
            <div
              key={g.id}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--cd-sec)',
                border: '1px solid var(--ln)'
              }}
            >
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
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
                  {g.title}
                </span>
                <span className="badge badge-goals badge-sm">{progress}%</span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: 5, borderRadius: 999, background: 'var(--cd)', overflow: 'hidden', marginBottom: 5 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'var(--ac)',
                    borderRadius: 999,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, color: 'var(--mut)' }}>
                <span>Target: {formatDisplayDate(g.targetDate)}</span>
                <span className="chip" style={{ fontSize: 10, padding: '1px 6px', minHeight: 'unset' }}>
                  {g.category}
                </span>
              </div>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div style={{ textAlign: 'center', marginTop: 2 }}>
            <Link to="/planner?tab=goals" className="mut" style={{ fontSize: 12 }}>
              +{remainingCount} more active goals in Planner
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
