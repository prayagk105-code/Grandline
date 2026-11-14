import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DayformIcon } from '../components/common/DayformIcon';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { ErrorState, LoadingSkeleton } from '../components/common/StateBlocks';
import { AdvancedReportsView } from '../components/progress/AdvancedReportsView';
import { GamificationView } from '../components/progress/GamificationView';
import { HealthLifestyleView } from '../components/progress/HealthLifestyleView';
import { MonthlyReflectionView } from '../components/progress/MonthlyReflectionView';
import { MyJourneyView } from '../components/progress/MyJourneyView';
import { PersonalFinanceView } from '../components/progress/PersonalFinanceView';
import { useToast } from '../contexts/ToastContext';
import { parseApiError } from '../services/api/apiError';
import { profileService } from '../services/profileService';
import { progressService } from '../services/progressService';
import type {
  MonthlySummaryDto,
  ProgressHabitAnalyticsDto,
  ProgressStudyAnalyticsDto,
  ProgressSummaryDto
} from '../types/api';
import { addDays, formatDurationMinutes, toIsoDate } from '../utils/date';

type PeriodKey = 'week' | 'month' | '5m';
type ProgressTab = 'analytics' | 'gamification' | 'health' | 'finance' | 'journey' | 'reflection';

export const ProgressPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();

  const tabParam = (params.get('tab') as ProgressTab) || 'analytics';
  const [activeTab, setActiveTab] = useState<ProgressTab>(tabParam);

  const setTab = (t: ProgressTab) => {
    setActiveTab(t);
    setParams((p) => {
      p.set('tab', t);
      return p;
    });
  };

  const [period, setPeriod] = useState<PeriodKey>('5m');
  const [summary, setSummary] = useState<ProgressSummaryDto | null>(null);
  const [habitChart, setHabitChart] = useState<ProgressHabitAnalyticsDto | null>(null);
  const [studyChart, setStudyChart] = useState<ProgressStudyAnalyticsDto | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    const today = toIsoDate();
    if (period === 'week') {
      return { from: addDays(today, -6), to: today };
    }
    if (period === 'month') {
      return { from: addDays(today, -27), to: today };
    }
    const now = new Date();
    const fiveMonthsStart = new Date(now.getFullYear(), now.getMonth() - 4, 1);
    return { from: toIsoDate(fiveMonthsStart), to: today };
  }, [period]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, hab, stu, mon] = await Promise.all([
        progressService.getSummary(dateRange.from, dateRange.to),
        progressService.getHabits(dateRange.from, dateRange.to),
        progressService.getStudy(dateRange.from, dateRange.to),
        progressService.getMonthly(5, dateRange.to)
      ]);
      setSummary(sum);
      setHabitChart(hab);
      setStudyChart(stu);
      setMonthly(mon);
    } catch (err) {
      setError(parseApiError(err, 'Could not load progress analytics.').message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    load();
    const handleChanged = () => load();
    window.addEventListener('dayform:data-changed', handleChanged);
    return () => window.removeEventListener('dayform:data-changed', handleChanged);
  }, [load]);

  const handleExport = async () => {
    try {
      const data = await profileService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dayform-export-${toIsoDate()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Export downloaded');
    } catch (err) {
      showToast(parseApiError(err, 'Export failed.').message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Zoom out & master your course"
        title="Progress & Operating System"
        subtitle="Holistic synthesis of performance, gamification, health vitals, and finances."
        action={
          <button type="button" className="ib" onClick={handleExport} aria-label="Export data">
            <DayformIcon name="copy" />
          </button>
        }
      />

      {/* Main Tabs */}
      <div className="chips" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={`chip ${activeTab === 'analytics' ? 'on' : ''}`}
          onClick={() => setTab('analytics')}
        >
          Analytics & Reports
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'gamification' ? 'on' : ''}`}
          onClick={() => setTab('gamification')}
        >
          Gamification & XP
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'health' ? 'on' : ''}`}
          onClick={() => setTab('health')}
        >
          Health & Lifestyle
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'finance' ? 'on' : ''}`}
          onClick={() => setTab('finance')}
        >
          Personal Finance
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'journey' ? 'on' : ''}`}
          onClick={() => setTab('journey')}
        >
          My Journey
        </button>
        <button
          type="button"
          className={`chip ${activeTab === 'reflection' ? 'on' : ''}`}
          onClick={() => setTab('reflection')}
        >
          Monthly Reflection
        </button>
      </div>

      {activeTab === 'gamification' && <GamificationView />}
      {activeTab === 'health' && <HealthLifestyleView />}
      {activeTab === 'finance' && <PersonalFinanceView />}
      {activeTab === 'journey' && <MyJourneyView />}
      {activeTab === 'reflection' && <MonthlyReflectionView />}

      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <AdvancedReportsView />

          <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 20 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Historical Trend Visualizer</h3>
              <div className="chips" style={{ marginBottom: 0 }}>
                {[
                  { key: 'week' as const, label: 'Week' },
                  { key: 'month' as const, label: 'Month' },
                  { key: '5m' as const, label: '5 months' }
                ].map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={`chip ${period === c.key ? 'on' : ''}`}
                    onClick={() => setPeriod(c.key)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {loading && !summary ? <LoadingSkeleton lines={5} /> : null}
            {error && !summary ? <ErrorState message={error} onRetry={load} /> : null}

            {summary && habitChart ? (
              <>
                <div className="df-grid-2" style={{ marginBottom: 12 }}>
                  <div className="cd">
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                      <b className="d">Habit completion</b>
                      <small className="mut">by {habitChart.granularity}</small>
                    </div>
                    <div style={{ width: '100%', height: 196 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={habitChart.points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--mut)' }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} width={32} allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--mut)' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(value: number) => [`${Math.round(value)}%`, 'Completion']}
                            contentStyle={{
                              backgroundColor: 'var(--cd)',
                              border: '1px solid var(--ln)',
                              borderRadius: 12,
                              fontSize: 12
                            }}
                          />
                          <Bar dataKey="completionPercent" radius={[6, 6, 0, 0]}>
                            {habitChart.points.map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={idx === habitChart.points.length - 1 ? 'var(--ac)' : 'var(--h2)'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {studyChart ? (
                    <div className="cd">
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                        <b className="d">Study time</b>
                        <small className="mut">minutes</small>
                      </div>
                      <div style={{ width: '100%', height: 196 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={studyChart.points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--mut)' }} axisLine={false} tickLine={false} />
                            <YAxis width={34} allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--mut)' }} axisLine={false} tickLine={false} />
                            <Tooltip
                              formatter={(value: number) => [`${value} min`, 'Study']}
                              contentStyle={{
                                backgroundColor: 'var(--cd)',
                                border: '1px solid var(--ln)',
                                borderRadius: 12,
                                fontSize: 12
                              }}
                            />
                            <Bar dataKey="minutes" fill="var(--h3)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="g4">
                  <StatCard icon="habit" label="Habit average" value={`${Math.round(summary.habitAveragePercent)}%`} note="in range" />
                  <StatCard icon="clock" label="Study time" value={formatDurationMinutes(summary.studyMinutes)} note="in range" />
                  <StatCard icon="book" label="Sessions" value={summary.studySessionsCount} note="in range" />
                  <StatCard icon="img" label="Memories" value={summary.memoriesCount} note="in range" />
                </div>

                <div className="df-grid-2" style={{ marginTop: 14 }}>
                  <div>
                    <div className="sec">
                      <h2>Month by month</h2>
                    </div>
                    <div className="cd">
                      {monthly.map((m) => (
                        <div key={`${m.year}-${m.month}`} className="li">
                          <span className="ic">
                            <DayformIcon name="cal" />
                          </span>
                          <div className="g">
                            <b>{m.monthLabel}</b>
                            <small>
                              {formatDurationMinutes(m.studyMinutes)} study · {m.studySessions} sessions · {m.memoriesCount} memories
                            </small>
                          </div>
                          <b style={{ color: 'var(--ac)' }}>{Math.round(m.habitCompletionPercent)}%</b>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="sec">
                      <h2>What your data suggests</h2>
                    </div>
                    <div className="cd">
                      {summary.insights.length > 0 ? (
                        summary.insights.map((ins, idx) => (
                          <div key={idx} className="li">
                            <span className="ic">
                              <DayformIcon name={ins.icon} />
                            </span>
                            <div className="g">
                              <b style={{ whiteSpace: 'normal' }}>{ins.title}</b>
                              <small>{ins.description}</small>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="mut" style={{ margin: 0 }}>
                          Log more habits and study sessions across multiple days to unlock trend comparisons.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};
