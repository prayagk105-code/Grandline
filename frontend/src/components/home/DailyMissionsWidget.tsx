import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { gamificationService } from '../../services/gamificationService';
import type { GamificationStatusDto } from '../../types/api';
import { DayformIcon } from '../common/DayformIcon';

export const DailyMissionsWidget: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<GamificationStatusDto | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await gamificationService.getStatus();
      setStatus(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!status || !Array.isArray(status.dailyMissions) || status.dailyMissions.length === 0) {
    return null;
  }

  const handleClaim = async (missionId: string) => {
    try {
      await gamificationService.claimMission(missionId);
      showToast('Mission XP Claimed! ⚡');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const allMissions = Array.isArray(status.dailyMissions) ? status.dailyMissions : [];
  const initialLimit = 2;
  const visibleMissions = expanded ? allMissions : allMissions.slice(0, initialLimit);
  const hasMore = allMissions.length > initialLimit;

  return (
    <div className="cd home-card-missions" style={{ marginBottom: 16 }}>
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center', minWidth: 0, flex: 1 }}>
          <span className="mod-icon mod-icon-home" style={{ width: 28, height: 28, fontSize: 14, flexShrink: 0 }}>
            ⚡
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Daily Missions</h3>
            <span className="mut" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
              Level {status.level ?? 1} · {status.xpInCurrentLevel ?? 0}/{status.xpToNextLevel ?? 1000} XP
            </span>
          </div>
        </div>
        <span className="badge badge-goals badge-sm" style={{ flexShrink: 0 }}>{status.tierTitle ?? 'Navigator'}</span>
      </div>

      {/* Missions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visibleMissions.map((m) => {
          const isDone = (m.currentCount ?? 0) >= (m.targetCount ?? 1);
          return (
            <div
              key={m.id}
              className="row"
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 11px',
                background: 'var(--sf)',
                border: '1px solid var(--ln)',
                borderRadius: 'var(--radius-md)',
                opacity: m.isClaimed ? 0.6 : 1,
                gap: 8,
                transition: 'background-color 0.15s ease'
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: 'var(--ink)'
                  }}
                >
                  {m.title}
                </div>
                <span className="mut" style={{ fontSize: 10.5 }}>
                  {m.currentCount ?? 0}/{m.targetCount ?? 1} · +{m.xpReward ?? 0} XP
                </span>
              </div>

              <div style={{ flexShrink: 0 }}>
                {m.isClaimed ? (
                  <span className="badge badge-archived badge-sm">Claimed ✓</span>
                ) : isDone ? (
                  <button
                    type="button"
                    className="btn pri sm"
                    style={{ padding: '3px 10px', fontSize: 11 }}
                    onClick={() => handleClaim(m.id)}
                  >
                    Claim
                  </button>
                ) : (
                  <span className="badge badge-pending badge-sm">Pending</span>
                )}
              </div>
            </div>
          );
        })}

        {hasMore && (
          <button
            type="button"
            className="home-view-toggle-btn"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                <span>View Less</span>
                <DayformIcon name="up" size={12} />
              </>
            ) : (
              <>
                <span>View More ({allMissions.length - initialLimit} remaining)</span>
                <DayformIcon name="down" size={12} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
