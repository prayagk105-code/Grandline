import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type { HabitDto } from '../../types/api';

interface ResetDayViewProps {
  habits?: HabitDto[];
  onHabitsRefreshed?: () => void;
}

export const ResetDayView: React.FC<ResetDayViewProps> = ({ habits = [] }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Review states
  const [challengesIdentified, setChallengesIdentified] = useState('');
  const [adjustments, setAdjustments] = useState('');
  const [weeklyIntention, setWeeklyIntention] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Habits with lower completion or incomplete today
  const strugglingHabits = habits.filter((h) => h.isActive && !h.completedToday);

  const handleFinishReset = () => {
    setIsCompleted(true);
    showToast('Reset Day completed! Your compass is re-aligned for the week ahead.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720, margin: '0 auto' }}>
      <div>
        <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <span className="chip on" style={{ fontSize: 11, padding: '2px 8px' }}>
            Weekly Alignment
          </span>
          <span className="mut" style={{ fontSize: 12 }}>
            Never resets history · Preserves all logs
          </span>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Reset Day Protocol</h2>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          A designated pause to inspect friction, shed guilt over missed days, recalibrate habits, and enter the coming week with clean momentum.
        </p>
      </div>

      {/* Progress tracker */}
      <div className="row" style={{ gap: 8 }}>
        {[
          { num: 1, label: 'Audit' },
          { num: 2, label: 'Root Cause' },
          { num: 3, label: 'Adjustments' },
          { num: 4, label: 'Intention' }
        ].map((s) => (
          <div
            key={s.num}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: step >= s.num ? 'var(--ac)' : 'var(--bd)',
              transition: 'background 0.3s ease'
            }}
          />
        ))}
      </div>

      {isCompleted ? (
        <div className="cd" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🌱</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Clean Slate Established</h3>
          <p className="mut" style={{ margin: '0 auto 20px', maxWidth: 440, fontSize: 14 }}>
            "Consistency is not about never failing; it is about how rapidly and gracefully you reset."
          </p>

          <div
            style={{
              textAlign: 'left',
              background: 'var(--sf)',
              borderRadius: 12,
              padding: 18,
              marginBottom: 20
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <b style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Weekly Focus:</b>
              <p style={{ margin: '4px 0 0', fontSize: 14 }}>{weeklyIntention || 'Relentless execution with zero drama.'}</p>
            </div>
            {adjustments && (
              <div>
                <b style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Guardrails & Fixes:</b>
                <p style={{ margin: '4px 0 0', fontSize: 14 }}>{adjustments}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn pri"
            onClick={() => {
              setIsCompleted(false);
              setStep(1);
            }}
          >
            Start Another Reset
          </button>
        </div>
      ) : (
        <div className="cd" style={{ padding: 24 }}>
          {step === 1 && (
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Step 1: The Non-Judgmental Audit</h3>
              <p className="mut" style={{ margin: '0 0 18px', fontSize: 13 }}>
                Review where friction occurred this past week. Missed habits indicate misaligned friction, not lack of willpower.
              </p>

              {strugglingHabits.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Habits needing calibration:</span>
                  {strugglingHabits.map((h) => (
                    <div
                      key={h.id}
                      className="row"
                      style={{
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--sf)',
                        borderRadius: 8
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{h.name}</span>
                      <span className="chip" style={{ fontSize: 11 }}>
                        Needs focus
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 14, background: 'var(--sf)', borderRadius: 8, marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    All active habits have solid consistency this week. Great job holding the line!
                  </p>
                </div>
              )}

              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn pri" onClick={() => setStep(2)}>
                  Proceed to Analysis →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Step 2: Identify Bottlenecks & Friction</h3>
              <p className="mut" style={{ margin: '0 0 16px', fontSize: 13 }}>
                What repeatedly derailed you? Was it sleep deficit, unexpected schedule disruptions, or setting the bar too high?
              </p>

              <textarea
                className="inp"
                rows={4}
                placeholder="Identify the main source of friction this week..."
                value={challengesIdentified}
                onChange={(e) => setChallengesIdentified(e.target.value)}
                style={{ marginBottom: 16 }}
              />

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="button" className="btn pri" onClick={() => setStep(3)}>
                  Plan Fixes →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Step 3: Concrete Adjustments</h3>
              <p className="mut" style={{ margin: '0 0 16px', fontSize: 13 }}>
                Adjust routines to reduce friction. Lower the barrier to entry (e.g. 5 minutes instead of 30, pre-packing clothes, blocking calendar time).
              </p>

              <textarea
                className="inp"
                rows={4}
                placeholder="What tangible changes will you implement starting Monday?"
                value={adjustments}
                onChange={(e) => setAdjustments(e.target.value)}
                style={{ marginBottom: 16 }}
              />

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn" onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button type="button" className="btn pri" onClick={() => setStep(4)}>
                  Set Fresh Intention →
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Step 4: Fresh Week Intention</h3>
              <p className="mut" style={{ margin: '0 0 16px', fontSize: 13 }}>
                Define your primary anchor for the upcoming 7 days. One single commitment you will protect at all costs.
              </p>

              <input
                type="text"
                className="inp"
                placeholder="e.g. Uncompromised morning focus block from 8-10 AM"
                value={weeklyIntention}
                onChange={(e) => setWeeklyIntention(e.target.value)}
                style={{ marginBottom: 20 }}
              />

              <div className="row" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn" onClick={() => setStep(3)}>
                  ← Back
                </button>
                <button type="button" className="btn pri" onClick={handleFinishReset}>
                  Complete Reset Day ✓
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
