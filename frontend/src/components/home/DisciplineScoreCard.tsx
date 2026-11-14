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
      <div className="cd" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Grandline Discipline Score</h3>
              <span className="mut" style={{ fontSize: 11 }}>True mathematical consistency</span>
            </div>
          </div>
          <button
            type="button"
            className="ib"
            onClick={() => setShowExplainModal(true)}
            title="Explain Calculation"
            aria-label="Explain Calculation"
          >
            <span style={{ fontSize: 13, fontWeight: 700 }}>?</span>
          </button>
        </div>

        <div className="row" style={{ alignItems: 'center', gap: 20 }}>
          <ProgressRing percent={score} size={84} strokeWidth={8} label={`${score}`} />
          <div style={{ flex: 1 }}>
            <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: tierColor,
                  background: 'var(--sf)',
                  padding: '2px 8px',
                  borderRadius: 6
                }}
              >
                {title}
              </span>
            </div>
            <p className="mut" style={{ margin: 0, fontSize: 12, lineHeight: 1.4 }}>
              Habit: {habitScore}% · Focus: {focusScore}% · Tasks: {taskScore}%
            </p>
          </div>
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
