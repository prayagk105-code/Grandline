import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { StatCard } from '../common/StatCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { financeService } from '../../services/financeService';
import type {
  DebtItemDto,
  FinancialSummaryDto,
  FinancialTransactionDto,
  MonthlyBudgetDto,
  SavingsGoalDto,
  SubscriptionItemDto
} from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

type FinanceTab = 'overview' | 'transactions' | 'budgets' | 'savings' | 'debts' | 'subscriptions';

export const PersonalFinanceView: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();
  const [tab, setTab] = useState<FinanceTab>('overview');

  // Year/Month
  const [year] = useState(new Date().getFullYear());
  const [month] = useState(new Date().getMonth() + 1);

  // Data states
  const [summary, setSummary] = useState<FinancialSummaryDto | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransactionDto[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudgetDto[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalDto[]>([]);
  const [debts, setDebts] = useState<DebtItemDto[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transaction modal
  const [txModal, setTxModal] = useState(false);
  const [txType, setTxType] = useState<'Income' | 'Expense'>('Expense');
  const [txAmount, setTxAmount] = useState(50);
  const [txCategory, setTxCategory] = useState('Food');
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(today);

  // Budget modal
  const [bModal, setBModal] = useState(false);
  const [bCategory, setBCategory] = useState('Groceries');
  const [bAmount, setBAmount] = useState(500);

  // Savings goal modal
  const [sgModal, setSgModal] = useState(false);
  const [sgTitle, setSgTitle] = useState('');
  const [sgTarget, setSgTarget] = useState(5000);
  const [sgCurrent, setSgCurrent] = useState(1000);

  // Debt modal
  const [debtModal, setDebtModal] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtTotal, setDebtTotal] = useState(2000);
  const [debtBalance, setDebtBalance] = useState(1500);

  // Sub modal
  const [subModal, setSubModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCost, setSubCost] = useState(15);
  const [subFreq, setSubFreq] = useState('Monthly');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, txData, bData, sgData, dData, subData] = await Promise.all([
        financeService.getSummary(year, month),
        financeService.getTransactions(year, month),
        financeService.getBudgets(year, month),
        financeService.getSavingsGoals(),
        financeService.getDebts(),
        financeService.getSubscriptions()
      ]);
      setSummary(sumData);
      setTransactions(txData);
      setBudgets(bData);
      setSavingsGoals(sgData);
      setDebts(dData);
      setSubscriptions(subData);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load financial records.').message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  // Handlers
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0) return;
    try {
      await financeService.createTransaction({
        type: txType,
        amount: txAmount,
        category: txCategory,
        description: txDesc.trim() || 'Transaction',
        transactionDate: txDate
      });
      showToast('Transaction logged');
      setTxModal(false);
      setTxDesc('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bAmount <= 0) return;
    try {
      await financeService.setBudget({
        category: bCategory,
        budgetAmount: bAmount,
        year,
        month
      });
      showToast('Budget configured');
      setBModal(false);
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleSaveSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sgTitle.trim() || sgTarget <= 0) return;
    try {
      await financeService.createSavingsGoal({
        title: sgTitle.trim(),
        targetAmount: sgTarget,
        currentAmount: sgCurrent
      });
      showToast('Savings goal committed');
      setSgModal(false);
      setSgTitle('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtName.trim() || debtTotal <= 0) return;
    try {
      await financeService.createDebt({
        creditorName: debtName.trim(),
        totalAmount: debtTotal,
        remainingAmount: debtBalance
      });
      showToast('Debt tracker created');
      setDebtModal(false);
      setDebtName('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || subCost <= 0) return;
    try {
      await financeService.createSubscription({
        name: subName.trim(),
        cost: subCost,
        billingCycle: subFreq
      });
      showToast('Subscription registered');
      setSubModal(false);
      setSubName('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  if (loading && !summary) return <LoadingSkeleton lines={6} />;
  if (error && !summary) return <ErrorState message={error} onRetry={load} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub Tabs */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="chips" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`chip ${tab === 'overview' ? 'on' : ''}`}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`chip ${tab === 'transactions' ? 'on' : ''}`}
            onClick={() => setTab('transactions')}
          >
            Transactions ({transactions.length})
          </button>
          <button
            type="button"
            className={`chip ${tab === 'budgets' ? 'on' : ''}`}
            onClick={() => setTab('budgets')}
          >
            Budgets ({budgets.length})
          </button>
          <button
            type="button"
            className={`chip ${tab === 'savings' ? 'on' : ''}`}
            onClick={() => setTab('savings')}
          >
            Savings ({savingsGoals.length})
          </button>
          <button
            type="button"
            className={`chip ${tab === 'debts' ? 'on' : ''}`}
            onClick={() => setTab('debts')}
          >
            Debts ({debts.length})
          </button>
          <button
            type="button"
            className={`chip ${tab === 'subscriptions' ? 'on' : ''}`}
            onClick={() => setTab('subscriptions')}
          >
            Subscriptions ({subscriptions.length})
          </button>
        </div>

        <button
          type="button"
          className="btn pri sm"
          onClick={() => setTxModal(true)}
          style={{ gap: 6 }}
        >
          <DayformIcon name="plus" size={14} />
          <span>Log Transaction</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div className="g3">
          <StatCard
            icon="star"
            label="Total Income"
            value={`$${summary.totalIncomeThisMonth.toFixed(2)}`}
            note="this month"
            accent="green"
          />
          <StatCard
            icon="habit"
            label="Total Expenses"
            value={`$${summary.totalExpensesThisMonth.toFixed(2)}`}
            note="this month"
            accent="orange"
          />
          <StatCard
            icon="flame"
            label="Net Savings"
            value={`$${summary.netSavingsThisMonth.toFixed(2)}`}
            note={`${Math.round(summary.savingsRatePercent)}% savings rate`}
            accent="teal"
          />
        </div>
      )}

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="df-grid-2">
          {/* Monthly Budget vs Actual */}
          <div className="cd" style={{ borderLeft: '3px solid var(--mod-balance)' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span className="mod-icon mod-icon-balance" style={{ width: 28, height: 28 }}>
                  <DayformIcon name="wallet" size={15} />
                </span>
                <b className="d" style={{ fontSize: 16 }}>Budget vs Spent</b>
              </div>
              <button
                type="button"
                className="btn sm"
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => setBModal(true)}
              >
                + Set Budget
              </button>
            </div>

            {budgets.length === 0 ? (
              <p className="mut" style={{ fontSize: 13, margin: '8px 0' }}>
                No category budgets set for this month.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {budgets.map((b) => {
                  const pct = b.budgetAmount > 0 ? Math.min(100, Math.round((b.actualSpent / b.budgetAmount) * 100)) : 0;
                  const isOver = b.actualSpent > b.budgetAmount;

                  return (
                    <div key={b.id}>
                      <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{b.category}</span>
                        <span style={{ color: isOver ? 'var(--badge-overdue-text)' : 'var(--ink)', fontWeight: isOver ? 600 : 400 }}>
                          ${b.actualSpent.toFixed(0)} / ${b.budgetAmount.toFixed(0)} ({pct}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--sf)', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: isOver ? 'var(--badge-overdue-text)' : 'var(--mod-balance)',
                            borderRadius: 3,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Savings Goals */}
          <div className="cd" style={{ borderLeft: '3px solid var(--mod-balance)' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span className="mod-icon mod-icon-balance" style={{ width: 28, height: 28 }}>
                  <DayformIcon name="star" size={15} />
                </span>
                <b className="d" style={{ fontSize: 16 }}>Savings Targets</b>
              </div>
              <button
                type="button"
                className="btn sm"
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => setSgModal(true)}
              >
                + New Goal
              </button>
            </div>

            {savingsGoals.length === 0 ? (
              <p className="mut" style={{ fontSize: 13, margin: '8px 0' }}>
                No active savings goals configured.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {savingsGoals.map((sg) => {
                  const pct = sg.targetAmount > 0 ? Math.min(100, Math.round((sg.currentAmount / sg.targetAmount) * 100)) : 0;
                  return (
                    <div key={sg.id}>
                      <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{sg.title}</span>
                        <span style={{ color: 'var(--mod-balance)', fontWeight: 600 }}>
                          ${sg.currentAmount.toLocaleString()} / ${sg.targetAmount.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--sf)', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'var(--mod-balance)',
                            borderRadius: 3,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {tab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transactions.length === 0 ? (
            <EmptyState
              title="No Transactions Recorded"
              description="Log your income and expenses to keep your finances clear."
              action={
                <button type="button" className="btn pri" onClick={() => setTxModal(true)}>
                  Log Transaction
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="cd"
                  style={{
                    padding: '12px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 0
                  }}
                >
                  <div className="row" style={{ gap: 12, alignItems: 'center' }}>
                    <span className={`badge ${tx.type === 'Income' ? 'badge-completed' : 'badge-overdue'} badge-sm`}>
                      {tx.type === 'Income' ? '+ IN' : '- OUT'}
                    </span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{tx.category}</div>
                      {tx.description && <span className="mut" style={{ fontSize: 11.5 }}>{tx.description}</span>}
                    </div>
                  </div>

                  <div className="row" style={{ gap: 16, alignItems: 'center' }}>
                    <span className="mut" style={{ fontSize: 12 }}>{formatDisplayDate(tx.transactionDate)}</span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: tx.type === 'Income' ? 'var(--badge-completed-text)' : 'var(--badge-overdue-text)'
                      }}
                    >
                      {tx.type === 'Income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      className="ib sm"
                      onClick={async () => {
                        await financeService.removeTransaction(tx.id);
                        load();
                      }}
                      aria-label="Delete transaction"
                      title="Delete Transaction"
                    >
                      <DayformIcon name="trash" size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SAVINGS TAB */}
      {tab === 'savings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Savings Vaults</h3>
            <button type="button" className="btn pri sm" onClick={() => setSgModal(true)}>
              + New Savings Goal
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
            {savingsGoals.map((sg) => (
              <div key={sg.id} className="cd" style={{ padding: 18, borderLeft: '3px solid var(--mod-balance)', marginBottom: 0 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 15 }}>{sg.title}</h4>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--mod-balance)', margin: '4px 0 10px' }}>
                  ${sg.currentAmount.toLocaleString()} <span className="mut" style={{ fontSize: 12, fontWeight: 400 }}>of ${sg.targetAmount.toLocaleString()}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--sf)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (sg.currentAmount / sg.targetAmount) * 100)}%`,
                      background: 'var(--mod-balance)',
                      borderRadius: 3
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEBTS TAB */}
      {tab === 'debts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Debt Elimination Tracker</h3>
            <button type="button" className="btn pri sm" onClick={() => setDebtModal(true)}>
              + Add Debt
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
            {debts.map((d) => (
              <div key={d.id} className="cd" style={{ padding: 18, borderLeft: '3px solid var(--badge-overdue-border)', marginBottom: 0 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{d.creditorName}</h4>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--badge-overdue-text)', margin: '4px 0 8px' }}>
                  ${d.remainingAmount.toLocaleString()} <span className="mut" style={{ fontSize: 12, fontWeight: 400 }}>remaining (orig. ${d.totalAmount.toLocaleString()})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {tab === 'subscriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Recurring Subscriptions</h3>
            <button type="button" className="btn pri sm" onClick={() => setSubModal(true)}>
              + Add Subscription
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
            {subscriptions.map((s) => (
              <div key={s.id} className="cd" style={{ padding: 16, marginBottom: 0 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h4 style={{ margin: 0, fontSize: 14.5 }}>{s.name}</h4>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--mod-balance)' }}>${s.cost.toFixed(2)}</span>
                </div>
                <span className="mut" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>Billed {s.billingCycle}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {txModal && (
        <div className="sheet-backdrop" onClick={() => setTxModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Log Transaction</h3>
              <button type="button" className="ib" onClick={() => setTxModal(false)}>
                <DayformIcon name="close" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="row" style={{ gap: 8 }}>
                <button
                  type="button"
                  className={`btn ${txType === 'Expense' ? 'pri' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => setTxType('Expense')}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`btn ${txType === 'Income' ? 'pri' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => setTxType('Income')}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="lbl">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="inp"
                  value={txAmount}
                  onChange={(e) => setTxAmount(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Category</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. Groceries, Rent, Salary, Freelance"
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Description (Optional)</label>
                <input
                  type="text"
                  className="inp"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="lbl">Date</label>
                <input
                  type="date"
                  className="inp"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  required
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setTxModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {bModal && (
        <div className="sheet-backdrop" onClick={() => setBModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Set Category Budget</h3>
            <form onSubmit={handleSaveBudget} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Category</label>
                <input type="text" className="inp" value={bCategory} onChange={(e) => setBCategory(e.target.value)} required />
              </div>
              <div>
                <label className="lbl">Monthly Limit ($)</label>
                <input type="number" min={1} className="inp" value={bAmount} onChange={(e) => setBAmount(parseFloat(e.target.value) || 0)} required />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setBModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Set Limit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Savings Goal Modal */}
      {sgModal && (
        <div className="sheet-backdrop" onClick={() => setSgModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Create Savings Vault</h3>
            <form onSubmit={handleSaveSavingsGoal} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Goal Title</label>
                <input type="text" className="inp" placeholder="e.g. Emergency Fund" value={sgTitle} onChange={(e) => setSgTitle(e.target.value)} required />
              </div>
              <div>
                <label className="lbl">Target Amount ($)</label>
                <input type="number" min={1} className="inp" value={sgTarget} onChange={(e) => setSgTarget(parseFloat(e.target.value) || 0)} required />
              </div>
              <div>
                <label className="lbl">Current Saved ($)</label>
                <input type="number" min={0} className="inp" value={sgCurrent} onChange={(e) => setSgCurrent(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setSgModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Commit Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Modal */}
      {debtModal && (
        <div className="sheet-backdrop" onClick={() => setDebtModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Add Debt to Eliminate</h3>
            <form onSubmit={handleSaveDebt} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Creditor / Loan Name</label>
                <input type="text" className="inp" placeholder="e.g. Student Loan, Credit Card" value={debtName} onChange={(e) => setDebtName(e.target.value)} required />
              </div>
              <div>
                <label className="lbl">Total Original ($)</label>
                <input type="number" min={1} className="inp" value={debtTotal} onChange={(e) => setDebtTotal(parseFloat(e.target.value) || 0)} required />
              </div>
              <div>
                <label className="lbl">Remaining Balance ($)</label>
                <input type="number" min={0} className="inp" value={debtBalance} onChange={(e) => setDebtBalance(parseFloat(e.target.value) || 0)} required />
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setDebtModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Save Debt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {subModal && (
        <div className="sheet-backdrop" onClick={() => setSubModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Add Subscription</h3>
            <form onSubmit={handleSaveSubscription} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Service Name</label>
                <input type="text" className="inp" placeholder="e.g. Spotify, Gym, Cloud Storage" value={subName} onChange={(e) => setSubName(e.target.value)} required />
              </div>
              <div>
                <label className="lbl">Cost ($)</label>
                <input type="number" step="0.01" min={0.01} className="inp" value={subCost} onChange={(e) => setSubCost(parseFloat(e.target.value) || 0)} required />
              </div>
              <div>
                <label className="lbl">Billing Cycle</label>
                <select className="inp" value={subFreq} onChange={(e) => setSubFreq(e.target.value)}>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setSubModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Track Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
