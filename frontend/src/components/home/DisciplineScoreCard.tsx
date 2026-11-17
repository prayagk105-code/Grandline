import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { specialGrandlineService } from '../../services/specialGrandlineService';
import type { DisciplineScoreDto } from '../../types/api';

export const DisciplineScoreCard: React.FC = () => {
  const [scoreData, setScoreData] = useState<DisciplineScoreDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExplainModal, setShowExplainModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await specialGrandlineService.getDisciplineScore();
      setScoreData(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !scoreData) {
    return (
      <div className="v4-card home-card-discipline" style={{ padding: 18 }}>
        <span className="mut" style={{ fontSize: 13 }}>Calculating discipline score...</span>
      </div>
    );
  }

  const rawScore = Number(scoreData?.overallScore ?? 0);
  const score = isNaN(rawScore) ? 0 : Math.round(rawScore);
  const habitScore = Math.round(Number(scoreData?.habitScore ?? 0) || 0);
  const focusScore = Math.round(Number(scoreData?.focusScore ?? 0) || 0);
  const taskScore = Math.round(Number(scoreData?.taskScore ?? 0) || 0);
  const title = scoreData?.ratingTitle || (scoreData as any)?.scoreTier || 'High Consistency';

  return (
    <>
      <div className="v4-card home-card-discipline" style={{ marginBottom: 16 }}>
        {/* Card Header matching Screenshot 1: TELEMETRY INDEX / Discipline Mastery Hub */}
        <div className="v4-telemetry-header">
          <div>
            <h3 className="v4-telemetry-title">TELEMETRY INDEX</h3>
            <p className="v4-telemetry-subtitle">Discipline Mastery Hub</p>
            <span className="sr-only">Discipline Score</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="sr-only">{title}</span>
            <div
              className="v4-score-circle"
              title={`Discipline Score: ${score}/100 (${title})`}
              aria-label={`Score: ${score} out of 100`}
            >
              <span>{score}</span>
              <span className="sr-only">/ 100</span>
            </div>

            <button
              type="button"
              className="ib sm"
              onClick={() => setShowExplainModal(true)}
              title="Formula & Factor Breakdown"
              aria-label="Formula & Factor Breakdown"
              style={{ width: 28, height: 28 }}
            >
              <span style={{ fontSize: 12, fontWeight: 700 }}>?</span>
            </button>
          </div>
        </div>

        {/* 3 Pillars matching Screenshot 1: HABITS, FOCUS, TASKS */}
        <div className="v4-telemetry-pillars home-discipline-pillars-grid">
          {/* Habits Pillar */}
          <div className="v4-pillar-box home-discipline-pillar-card">
            <div className="v4-pillar-top home-discipline-pillar-header">
              <span className="v4-pillar-dot home-discipline-pillar-dot" style={{ background: '#3B28CC' }} />
              <span className="home-discipline-pillar-label">Habits</span>
              <span className="home-discipline-pillar-weight sr-only">40%</span>
            </div>
            <div className="v4-pillar-val home-discipline-pillar-val">{habitScore}%</div>
            <div className="v4-pillar-label">Consistency</div>
            <div className="v4-pillar-bar home-discipline-pillar-bar">
              <div
                className="home-discipline-pillar-fill"
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, habitScore))}%`,
                  background: '#3B28CC',
                  borderRadius: 9999
                }}
              />
            </div>
          </div>

          {/* Focus Pillar */}
          <div className="v4-pillar-box home-discipline-pillar-card">
            <div className="v4-pillar-top home-discipline-pillar-header">
              <span className="v4-pillar-dot home-discipline-pillar-dot" style={{ background: '#0D9488' }} />
              <span className="home-discipline-pillar-label">Focus</span>
              <span className="home-discipline-pillar-weight sr-only">30%</span>
            </div>
            <div className="v4-pillar-val home-discipline-pillar-val">{focusScore}%</div>
            <div className="v4-pillar-label">Execution</div>
            <div className="v4-pillar-bar home-discipline-pillar-bar">
              <div
                className="home-discipline-pillar-fill"
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, focusScore))}%`,
                  background: '#0D9488',
                  borderRadius: 9999
                }}
              />
            </div>
          </div>

          {/* Tasks Pillar */}
          <div className="v4-pillar-box home-discipline-pillar-card">
            <div className="v4-pillar-top home-discipline-pillar-header">
              <span className="v4-pillar-dot home-discipline-pillar-dot" style={{ background: '#D97706' }} />
              <span className="home-discipline-pillar-label">Tasks</span>
              <span className="home-discipline-pillar-weight sr-only">30%</span>
            </div>
            <div className="v4-pillar-val home-discipline-pillar-val">{taskScore}%</div>
            <div className="v4-pillar-label">Velocity</div>
            <div className="v4-pillar-bar home-discipline-pillar-bar">
              <div
                className="home-discipline-pillar-fill"
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, taskScore))}%`,
                  background: '#D97706',
                  borderRadius: 9999
                }}
              />
            </div>
          </div>
        </div>

        {/* View Formula Link Action */}
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button
            type="button"
            className="lk"
            style={{ fontSize: 11.5, color: '#3B28CC' }}
            onClick={() => setShowExplainModal(true)}
          >
            View Mathematical Formula →
          </button>
        </div>
      </div>

      {/* Explanation Modal */}
      {showExplainModal && (
        <div className="sheet-backdrop" onClick={() => setShowExplainModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Discipline Score Formula</h3>
              <button type="button" className="ib" onClick={() => setShowExplainModal(false)}>
                <DayformIcon name="close" size={16} />
              </button>
            </div>

            <p className="mut" style={{ margin: '0 0 16px', fontSize: 13, lineHeight: 1.5 }}>
              Grandline strictly rejects fabricated or arbitrary scores. Your score is deterministically calculated across the last 30 days based on verified pillars:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {scoreData.factorBreakdowns && scoreData.factorBreakdowns.length > 0 ? (
                scoreData.factorBreakdowns.map((fb, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', background: 'var(--sf)', borderRadius: 8, fontSize: 13 }}>
                    {fb}
                  </div>
                ))
              ) : (
                <>
                  <div style={{ padding: '8px 12px', background: 'var(--sf)', borderRadius: 8 }}>
                    <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                      <span>1. Habit Adherence Consistency</span>
                      <span style={{ color: 'var(--ac)' }}>40% Weight</span>
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--sf)', borderRadius: 8 }}>
                    <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                      <span>2. Focus Target Adherence</span>
                      <span style={{ color: 'var(--ac)' }}>30% Weight</span>
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--sf)', borderRadius: 8 }}>
                    <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                      <span>3. Task Execution & Deadlines</span>
                      <span style={{ color: 'var(--ac)' }}>30% Weight</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn pri" onClick={() => setShowExplainModal(false)}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
