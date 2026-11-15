import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { ProgressRing } from '../common/ProgressRing';
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
      <div className="cd" style={{ padding: 20 }}>
        <span className="mut" style={{ fontSize: 13 }}>Calculating discipline score...</span>
      </div>
    );
  }

  const rawScore = Number(scoreData?.overallScore ?? 0);
  const score = isNaN(rawScore) ? 0 : Math.round(rawScore);
  const tierColor =
    score >= 80 ? 'var(--ac)' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  const habitScore = Math.round(Number(scoreData?.habitScore ?? 0) || 0);
  const focusScore = Math.round(Number(scoreData?.focusScore ?? 0) || 0);
  const taskScore = Math.round(Number(scoreData?.taskScore ?? 0) || 0);
  const title = scoreData?.ratingTitle || (scoreData as any)?.scoreTier || 'On Track';

  return (
    <>
      <div className="cd home-duo-card">
        <div className="home-duo-header">
          <div className="home-duo-title">
            <span style={{ fontSize: 16 }}>🛡️</span>
            <span>Discipline Score</span>
          </div>
          <button
            type="button"
            className="ib"
            onClick={() => setShowExplainModal(true)}
            title="Explain Calculation"
            aria-label="Explain Calculation"
            style={{ width: 24, height: 24, padding: 0 }}
          >
            <span style={{ fontSize: 12, fontWeight: 700 }}>?</span>
          </button>
        </div>

        <div className="home-duo-center">
          <ProgressRing percent={score} size={68} strokeWidth={7} label={`${score}`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: tierColor,
                  background: 'var(--sf)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--bd)'
                }}
              >
                {title}
              </span>
            </div>
            <div className="home-duo-sub">
              Habit: {habitScore}% · Focus: {focusScore}% · Tasks: {taskScore}%
            </div>
          </div>
        </div>

        <div className="home-duo-action">
          <button
            type="button"
            className="btn sec"
            style={{ width: '100%', justifyContent: 'center', padding: '6px 10px', fontSize: 12 }}
            onClick={() => setShowExplainModal(true)}
          >
            View Formula
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
                      <span style={{ color: 'var(--ac)' }}>20% Weight</span>
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
