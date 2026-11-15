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
      <div className="cd" style={{ padding: 18 }}>
        <span className="mut" style={{ fontSize: 13 }}>Calculating discipline score...</span>
      </div>
    );
  }

  const rawScore = Number(scoreData?.overallScore ?? 0);
  const score = isNaN(rawScore) ? 0 : Math.round(rawScore);
  const tierColor =
    score >= 80 ? 'var(--ac)' : score >= 60 ? 'var(--mod-study)' : score >= 40 ? 'var(--mod-progress)' : 'var(--badge-overdue-text)';

  const habitScore = Math.round(Number(scoreData?.habitScore ?? 0) || 0);
  const focusScore = Math.round(Number(scoreData?.focusScore ?? 0) || 0);
  const taskScore = Math.round(Number(scoreData?.taskScore ?? 0) || 0);
  const title = scoreData?.ratingTitle || (scoreData as any)?.scoreTier || 'On Track';

  return (
    <>
      <div className="cd home-card-discipline">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span className="mod-icon mod-icon-home">
              <span style={{ fontSize: 15 }}>🛡️</span>
            </span>
            <div>
              <b className="d" style={{ fontSize: 15 }}>Discipline Score</b>
              <div className="mut" style={{ fontSize: 11 }}>30-day verified consistency</div>
            </div>
          </div>

          <button
            type="button"
            className="ib sm"
            onClick={() => setShowExplainModal(true)}
            title="Formula & Factor Breakdown"
            aria-label="Formula & Factor Breakdown"
          >
            <span style={{ fontSize: 12, fontWeight: 700 }}>?</span>
          </button>
        </div>

        {/* Score Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--cd-sec)',
            border: '1px solid var(--ln)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 12
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ font: '700 26px var(--font-display)', color: 'var(--ink)' }}>{score}</span>
              <span className="mut" style={{ fontSize: 13 }}>/ 100</span>
            </div>
            <div className="mut" style={{ fontSize: 11 }}>Deterministic score</div>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tierColor,
              background: 'var(--cd)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--ln)'
            }}
          >
            {title}
          </span>
        </div>

        {/* 3 Consistency Pillars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Habit Pillar */}
          <div>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
              <span className="mut">Habit Consistency (40%)</span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{habitScore}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: 'var(--sf)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${habitScore}%`, background: 'var(--mod-habits)', borderRadius: 999 }} />
            </div>
          </div>

          {/* Focus Pillar */}
          <div>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
              <span className="mut">Focus Adherence (30%)</span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{focusScore}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: 'var(--sf)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${focusScore}%`, background: 'var(--mod-focus)', borderRadius: 999 }} />
            </div>
          </div>

          {/* Task Pillar */}
          <div>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
              <span className="mut">Task Execution (30%)</span>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{taskScore}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: 'var(--sf)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${taskScore}%`, background: 'var(--mod-planner)', borderRadius: 999 }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button
            type="button"
            className="lk"
            style={{ fontSize: 11.5 }}
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
