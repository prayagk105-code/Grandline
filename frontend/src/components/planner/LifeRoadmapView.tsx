import React, { useCallback, useEffect, useState } from 'react';
import { LoadingSkeleton } from '../common/StateBlocks';
import { goalService } from '../../services/goalService';
import type { GoalDto } from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

export const LifeRoadmapView: React.FC = () => {
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [horizon, setHorizon] = useState<'All' | '1-Year' | '3-Year' | '5-Year'>('All');
  const [loading, setLoading] = useState(true);
  const today = toIsoDate();

  const load = useCallback(async () => {
    try {
      const data = await goalService.getAll();
      setGoals(data);
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSkeleton lines={6} />;

  const filteredGoals = goals.filter((g) => {
    if (horizon === '1-Year') return g.timeframe === 'Yearly' || g.timeframe === '1-Year';
    if (horizon === '3-Year') return g.timeframe === '3-Year';
    if (horizon === '5-Year') return g.timeframe === '5-Year';
    return true;
  });

  // Sort by targetDate ascending
  const sorted = [...filteredGoals].sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header & Controls */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Life Roadmap & Strategic Horizon</h2>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            Connect long-term vision to yearly anchors, monthly milestones, and daily execution.
          </p>
        </div>

        <div className="chips" style={{ marginBottom: 0 }}>
          {(['All', '1-Year', '3-Year', '5-Year'] as const).map((h) => (
            <button
              key={h}
              type="button"
              className={`chip ${horizon === h ? 'on' : ''}`}
              onClick={() => setHorizon(h)}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Goal-to-Action Architecture Diagram */}
      <div
        className="cd"
        style={{
          background: 'var(--sf)',
          border: '1px solid var(--ln)',
          padding: '16px 20px',
          borderRadius: 14
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--ink)' }}>
          Goal-to-Action Hierarchy
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            textAlign: 'center'
          }}
        >
          <div style={{ padding: '10px 8px', borderRadius: 8, background: 'var(--cd)', border: '1px solid var(--ln)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac)' }}>VISION & 5-YR</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Life Mission</div>
          </div>
          <div style={{ padding: '10px 8px', borderRadius: 8, background: 'var(--cd)', border: '1px solid var(--ln)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac)' }}>YEARLY</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Anchors & Goals</div>
          </div>
          <div style={{ padding: '10px 8px', borderRadius: 8, background: 'var(--cd)', border: '1px solid var(--ln)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac)' }}>MONTHLY</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Milestones</div>
          </div>
          <div style={{ padding: '10px 8px', borderRadius: 8, background: 'var(--cd)', border: '1px solid var(--ln)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac)' }}>WEEKLY</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Key Priorities</div>
          </div>
          <div style={{ padding: '10px 8px', borderRadius: 8, background: 'var(--cd)', border: '1px solid var(--ln)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac)' }}>DAILY</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Tasks & Habits</div>
          </div>
        </div>
      </div>

      {/* Visual Roadmap Milestones */}
      {sorted.length === 0 ? (
        <div className="cd" style={{ padding: 32, textAlign: 'center' }}>
          <p className="mut" style={{ margin: 0 }}>
            No goals found for this horizon. Create a goal in the Goals tab to place it on the roadmap.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Vertical continuous track line */}
          <div
            style={{
              position: 'absolute',
              left: 11,
              top: 14,
              bottom: 14,
              width: 2,
              background: 'var(--ln)'
            }}
          />

          {sorted.map((goal, index) => {
            const isCompleted = goal.status === 'Completed';
            const isOverdue = !isCompleted && goal.targetDate < today;

            return (
              <div key={goal.id} style={{ position: 'relative' }}>
                {/* Node circle on timeline */}
                <div
                  style={{
                    position: 'absolute',
                    left: -28,
                    top: 12,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--badge-completed-text)' : isOverdue ? 'var(--badge-overdue-text)' : 'var(--ac)',
                    border: '3px solid var(--cd)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    zIndex: 2
                  }}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>

                <div className="cd" style={{ padding: '18px 20px', borderRadius: 12 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                        {goal.timeframe}
                      </span>
                      <span className="chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                        {goal.category}
                      </span>
                      {isCompleted && (
                        <span className="chip on" style={{ fontSize: 11, padding: '2px 8px' }}>
                          Completed
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500 }} className="mut">
                      Target: {formatDisplayDate(goal.targetDate)}
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600 }}>{goal.title}</h3>
                  {goal.description && (
                    <p className="mut" style={{ margin: '0 0 12px', fontSize: 13 }}>
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span className="mut">Milestone Progress</span>
                      <span style={{ fontWeight: 600 }}>{goal.progressPercentage}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--sf)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, goal.progressPercentage))}%`,
                          height: '100%',
                          background: isCompleted ? 'var(--badge-completed-text)' : 'var(--ac)',
                          borderRadius: 3
                        }}
                      />
                    </div>
                  </div>

                  {/* Milestones list */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }} className="mut">
                        Milestone Steps ({goal.milestones.filter((m) => m.isCompleted).length}/{goal.milestones.length})
                      </div>
                      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                        {goal.milestones.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              background: m.isCompleted ? 'var(--badge-completed-bg)' : 'var(--sf)',
                              color: m.isCompleted ? 'var(--badge-completed-text)' : 'var(--ink)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <span>{m.isCompleted ? '✓' : '○'}</span>
                            <span>{m.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
