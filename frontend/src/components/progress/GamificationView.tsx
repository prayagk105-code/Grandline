import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { gamificationService } from '../../services/gamificationService';
import type { GamificationStatusDto } from '../../types/api';

const BADGE_ICONS: Record<string, string> = {
  'First Step': '🌱',
  '7-Day Streak': '🔥',
  '30-Day Master': '⚡',
  'Deep Work Initiate': '⏳',
  'Knowledge Seeker': '📚',
  'Goal Crusher': '🎯',
  'Discipline Sentinel': '🛡️',
  'Grandline Voyager': '👑'
};

export const GamificationView: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<GamificationStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New reward modal
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState(250);
  const [rewardDesc, setRewardDesc] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gamificationService.getStatus();
      setStatus(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load gamification status.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClaimMission = async (missionId: string) => {
    try {
      await gamificationService.claimMission(missionId);
      showToast('Mission XP Claimed! Keep crushing it! ⚡');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim() || rewardCost <= 0) return;
    try {
      await gamificationService.createReward({
        title: rewardTitle.trim(),
        xpCost: rewardCost,
        description: rewardDesc.trim() || undefined
      });
      showToast('Custom reward added to the armory');
      setShowRewardModal(false);
      setRewardTitle('');
      setRewardDesc('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleRedeemReward = async (rewardId: string, cost: number, title: string) => {
    if (!status || status.xpInCurrentLevel < cost) {
      showToast(`Not enough XP! You need ${cost} XP to redeem this reward.`, 'error');
      return;
    }
    if (!window.confirm(`Redeem "${title}" for ${cost} XP?`)) return;
    try {
      await gamificationService.redeemReward(rewardId);
      showToast(`🎉 Reward "${title}" redeemed! Enjoy your hard-earned prize!`);
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  if (loading && !status) return <LoadingSkeleton lines={6} />;
  if (error && !status) return <ErrorState message={error} onRetry={load} />;
  if (!status) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Profile / Tier Banner */}
      <div
        className="cd"
        style={{
          background: 'linear-gradient(135deg, var(--cd) 0%, var(--sf) 100%)',
          border: '1px solid var(--ln)'
        }}
      >
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>👑</span>
              <span className="badge badge-goals badge-sm" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {status.tierTitle}
              </span>
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 28 }}>Level {status.level}</h2>
            <p className="mut" style={{ margin: 0, fontSize: 13 }}>
              Total Accumulated: <b>{status.totalXp.toLocaleString()} XP</b>
            </p>
          </div>

          <div style={{ minWidth: 220, textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ac)' }}>
              {status.xpInCurrentLevel} / {status.xpToNextLevel} XP
            </div>
            <span className="mut" style={{ fontSize: 12 }}>
              {status.xpToNextLevel - status.xpInCurrentLevel} XP to Level {status.level + 1}
            </span>
          </div>
        </div>

        {/* Level XP Bar */}
        <div className="bar" style={{ height: 10, marginTop: 18 }}>
          <i
            style={{
              width: `${Math.min(100, status.progressPercent)}%`,
              background: 'linear-gradient(90deg, var(--ac) 0%, #34d399 100%)'
            }}
          />
        </div>
      </div>

      {/* Daily Missions */}
      <div className="cd" style={{ padding: 22 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: '0 0 2px', fontSize: 18 }}>Daily Missions & Bounties</h3>
            <p className="mut" style={{ margin: 0, fontSize: 12 }}>
              Complete consistent actions to earn XP and level up your discipline.
            </p>
          </div>
          <span className="badge badge-info badge-sm">Resets Daily</span>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {status.dailyMissions.map((m) => {
            const isCompleted = m.currentCount >= m.targetCount;
            return (
              <div
                key={m.id}
                className="row"
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--sf)',
                  borderRadius: 10,
                  border: m.isClaimed ? '1px solid var(--ln)' : isCompleted ? '1px solid var(--ac)' : '1px solid var(--ln)',
                  opacity: m.isClaimed ? 0.7 : 1
                }}
              >
                <div>
                  <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <h4 style={{ margin: 0, fontSize: 14 }}>{m.title}</h4>
                    <span style={{ fontSize: 11, color: 'var(--ac)', fontWeight: 600 }}>+{m.xpReward} XP</span>
                  </div>
                  <span className="mut" style={{ fontSize: 12 }}>
                    Progress: {m.currentCount}/{m.targetCount}
                  </span>
                </div>

                <div>
                  {m.isClaimed ? (
                    <span className="badge badge-archived badge-sm">Claimed ✓</span>
                  ) : isCompleted ? (
                    <button
                      type="button"
                      className="btn pri sm"
                      onClick={() => handleClaimMission(m.id)}
                    >
                      Claim {m.xpReward} XP
                    </button>
                  ) : (
                    <span className="badge badge-pending badge-sm">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges & Achievements Grid */}
      <div className="cd" style={{ padding: 22 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Achievement Badges</h3>
        <p className="mut" style={{ margin: '0 0 16px', fontSize: 12 }}>
          Earn permanent badges for remarkable consistency and milestones.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
            gap: 10
          }}
        >
          {status.achievements.map((b) => {
            const icon = BADGE_ICONS[b.title] || '🎖️';
            return (
              <div
                key={b.id}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'var(--sf)',
                  border: '1px solid var(--ac)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ fontSize: 28 }}>{icon}</div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: 14 }}>{b.title}</h4>
                  <p className="mut" style={{ margin: 0, fontSize: 11 }}>{b.description}</p>
                  <span className="badge badge-completed badge-sm" style={{ marginTop: 4 }}>Unlocked ✓</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Rewards Store */}
      <div className="cd" style={{ padding: 22 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: '0 0 2px', fontSize: 18 }}>XP Rewards Store</h3>
            <p className="mut" style={{ margin: 0, fontSize: 12 }}>
              Spend your earned XP on guilt-free real-world rewards and celebrations.
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ fontSize: 12, padding: '5px 12px' }}
            onClick={() => setShowRewardModal(true)}
          >
            + Create Reward
          </button>
        </div>

        {status.availableRewards.length === 0 ? (
          <EmptyState
            title="No Rewards in Store"
            description="Add treats like 'Coffee shop visit', 'Weekend gaming session', or 'New book purchase'."
            action={
              <button type="button" className="btn pri" onClick={() => setShowRewardModal(true)}>
                Add First Reward
              </button>
            }
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
            {status.availableRewards.map((r) => {
              const canAfford = status.xpInCurrentLevel >= r.xpCost;
              return (
                <div
                  key={r.id}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: 'var(--sf)',
                    border: '1px solid var(--ln)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: 15 }}>{r.title}</h4>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ac)' }}>
                        {r.xpCost} XP
                      </span>
                    </div>
                    {r.description && <p className="mut" style={{ margin: 0, fontSize: 12 }}>{r.description}</p>}
                  </div>

                  <button
                    type="button"
                    className="btn pri"
                    style={{ fontSize: 12, width: '100%' }}
                    disabled={!canAfford}
                    onClick={() => handleRedeemReward(r.id, r.xpCost, r.title)}
                  >
                    {canAfford ? `Redeem for ${r.xpCost} XP` : `Need ${r.xpCost - status.xpInCurrentLevel} more XP`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Reward Modal */}
      {showRewardModal && (
        <div className="sheet-backdrop" onClick={() => setShowRewardModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Create Custom Reward</h3>
              <button type="button" className="ib" onClick={() => setShowRewardModal(false)}>
                <DayformIcon name="close" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateReward} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">Reward Name</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. Saturday afternoon movie or cheat meal"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">XP Cost</label>
                <input
                  type="number"
                  min={25}
                  max={10000}
                  className="inp"
                  value={rewardCost}
                  onChange={(e) => setRewardCost(parseInt(e.target.value) || 25)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Description (Optional)</label>
                <textarea
                  className="inp"
                  rows={2}
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn" onClick={() => setShowRewardModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri">
                  Add to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
