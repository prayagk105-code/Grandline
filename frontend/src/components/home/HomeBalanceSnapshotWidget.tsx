import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';
import { healthService } from '../../services/healthService';
import { financeService } from '../../services/financeService';
import type { FinancialSummaryDto, HealthDailyLogDto } from '../../types/api';
import { toIsoDate } from '../../utils/date';

export const HomeBalanceSnapshotWidget: React.FC = () => {
  const today = toIsoDate();
  const [healthLog, setHealthLog] = useState<HealthDailyLogDto | null>(null);
  const [financeSummary, setFinanceSummary] = useState<FinancialSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const now = new Date();
      const [hLog, fSum] = await Promise.all([
        healthService.getTodayDailyLog(today).catch(() => null),
        financeService.getSummary(now.getFullYear(), now.getMonth() + 1).catch(() => null)
      ]);
      setHealthLog(hLog);
      setFinanceSummary(fSum);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
    const handleChanged = () => load();
    window.addEventListener('dayform:data-changed', handleChanged);
    return () => window.removeEventListener('dayform:data-changed', handleChanged);
  }, [load]);

  if (loading && !healthLog && !financeSummary) return null;

  const sleepHours = healthLog?.sleepHours ?? 0;
  const waterGlasses = healthLog?.waterIntakeMl ? Math.round(healthLog.waterIntakeMl / 250) : 0;
  const steps = healthLog?.stepsCount ?? 0;

  const totalSpent = financeSummary?.totalExpensesThisMonth ?? 0;
  const savingsRate = financeSummary?.savingsRatePercent ?? 0;

  return (
    <div className="cd home-card-balance-snapshot" style={{ borderLeft: '3px solid var(--mod-balance)', marginBottom: 16 }}>
      {/* Header */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className="mod-icon mod-icon-balance" style={{ flexShrink: 0 }}>
            <DayformIcon name="wallet" size={16} />
          </span>
          <div>
            <b className="d" style={{ fontSize: 15 }}>Health & Balance</b>
            <div className="mut" style={{ fontSize: 11 }}>Vitals & monthly cashflow</div>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <Link to="/health" className="lk" style={{ fontSize: 12 }}>
            Health <DayformIcon name="right" size={12} />
          </Link>
          <span className="mut" style={{ fontSize: 11 }}>·</span>
          <Link to="/balance" className="lk" style={{ fontSize: 12 }}>
            Balance <DayformIcon name="right" size={12} />
          </Link>
        </div>
      </div>

      {/* 2 Split Columns: Left = Health Vitals, Right = Financial Health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {/* Health Column */}
        <div
          style={{
            padding: '9px 11px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--cd-sec)',
            border: '1px solid var(--ln)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 6
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mod-health)' }}>
              Daily Vitals
            </span>
            <span style={{ fontSize: 11 }}>🌿</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
              <span className="mut">Sleep</span>
              <b style={{ color: 'var(--ink)' }}>{sleepHours > 0 ? `${sleepHours}h` : '—'}</b>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
              <span className="mut">Water</span>
              <b style={{ color: 'var(--ink)' }}>{waterGlasses > 0 ? `${waterGlasses} gl` : '—'}</b>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
              <span className="mut">Steps</span>
              <b style={{ color: 'var(--ink)' }}>{steps > 0 ? steps.toLocaleString() : '—'}</b>
            </div>
          </div>
        </div>

        {/* Finance Column */}
        <div
          style={{
            padding: '9px 11px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--cd-sec)',
            border: '1px solid var(--ln)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 6
          }}
        >
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mod-balance)' }}>
              Monthly Cashflow
            </span>
            <span style={{ fontSize: 11 }}>💳</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
              <span className="mut">Month Spend</span>
              <b style={{ color: 'var(--ink)' }}>${Math.round(totalSpent).toLocaleString()}</b>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
              <span className="mut">Savings Rate</span>
              <b style={{ color: savingsRate >= 20 ? 'var(--badge-completed-text)' : 'var(--badge-pending-text)' }}>
                {Math.round(savingsRate)}%
              </b>
            </div>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
              <span className="mut">Subscriptions</span>
              <b style={{ color: 'var(--ink)' }}>
                ${Math.round(financeSummary?.totalMonthlySubscriptions ?? 0)}/mo
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
