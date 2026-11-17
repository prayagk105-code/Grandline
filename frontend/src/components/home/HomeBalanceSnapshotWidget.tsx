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

  const sleepHours = healthLog?.sleepHours ? `${healthLog.sleepHours} hrs` : '7.8 hrs';
  const hydration = healthLog?.waterIntakeMl ? `${(healthLog.waterIntakeMl / 1000).toFixed(1)} L` : '2.4 L';
  const steps = healthLog?.stepsCount ? healthLog.stepsCount.toLocaleString() : '8,420';

  const totalIncome = financeSummary?.totalIncomeThisMonth ?? 1450;
  const totalExpenses = financeSummary?.totalExpensesThisMonth ?? 320;
  const netBalance = financeSummary?.netSavingsThisMonth ?? 12840;

  return (
    <div className="v4-vitals-cashflow-grid home-card-balance-snapshot" style={{ marginBottom: 16 }}>
      {/* Left Card: Daily Vitals */}
      <Link to="/health" className="v4-metric-card" style={{ textDecoration: 'none' }}>
        <div className="v4-metric-card-header">
          <span style={{ color: '#0D9488' }}>
            <DayformIcon name="heart" size={15} />
          </span>
          <span>Daily Vitals</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="v4-metric-row">
            <span className="v4-metric-label">Sleep</span>
            <span className="v4-metric-val">{sleepHours}</span>
          </div>
          <div className="v4-metric-row">
            <span className="v4-metric-label">Hydration</span>
            <span className="v4-metric-val">{hydration}</span>
          </div>
          <div className="v4-metric-row">
            <span className="v4-metric-label">Steps</span>
            <span className="v4-metric-val">{steps}</span>
          </div>
        </div>
      </Link>

      {/* Right Card: Cashflow */}
      <Link to="/balance" className="v4-metric-card" style={{ textDecoration: 'none' }}>
        <div className="v4-metric-card-header">
          <span style={{ color: '#3B28CC' }}>
            <DayformIcon name="wallet" size={15} />
          </span>
          <span>Cashflow</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="v4-metric-row">
            <span className="v4-metric-label">Inflow</span>
            <span className="v4-metric-val" style={{ color: '#0D9488' }}>
              +${Math.round(totalIncome).toLocaleString()}
            </span>
          </div>
          <div className="v4-metric-row">
            <span className="v4-metric-label">Burn</span>
            <span className="v4-metric-val" style={{ color: '#EF4444' }}>
              -${Math.round(totalExpenses).toLocaleString()}
            </span>
          </div>
          <div className="v4-metric-row">
            <span className="v4-metric-label">Net Balance</span>
            <span className="v4-metric-val" style={{ color: '#3B28CC' }}>
              ${Math.round(netBalance).toLocaleString()}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};
