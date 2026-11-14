import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { gamificationService } from '../../services/gamificationService';
import type { GamificationStatusDto } from '../../types/api';

export const DailyMissionsWidget: React.FC = () => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<GamificationStatusDto | null>(null);

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

  const activeMissions = Array.isArray(status.dailyMissions) ? status.dailyMissions.slice(0, 3) : [];

  return (
    <div className="cd" style={{ padding: 20 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Daily Missions</h3>
            <span className="mut" style={{ fontSize: 11 }}>
              Level {status.level ?? 1} · {status.xpInCurrentLevel ?? 0}/{status.xpToNextLevel ?? 1000} XP
            </span>
          </div>
        </div>
        <span className="chip on" style={{ fontSize: 10, padding: '1px 6px' }}>{status.tierTitle ?? 'Navigator'}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeMissions.map((m) => {
          const isDone = (m.currentCount ?? 0) >= (m.targetCount ?? 1);
          return (
            <div
              key={m.id}
              className="row"
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--sf)',
                borderRadius: 8,
                opacity: m.isClaimed ? 0.6 : 1
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.title}</div>
                <span className="mut" style={{ fontSize: 11 }}>
                  {m.currentCount ?? 0}/{m.targetCount ?? 1} · +{m.xpReward ?? 0} XP
                </span>
              </div>

              <div>
                {m.isClaimed ? (
                  <span className="mut" style={{ fontSize: 11 }}>Claimed ✓</span>
                ) : isDone ? (
                  <button
                    type="button"
                    className="btn pri"
                    style={{ fontSize: 11, padding: '3px 8px' }}
                    onClick={() => handleClaim(m.id)}
                  >
                    Claim
                  </button>
                ) : (
                  <span className="mut" style={{ fontSize: 11 }}>Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
