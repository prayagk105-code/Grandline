import { apiClient } from './api/apiClient';
import type {
  ApiResponse,
  DebtItemDto,
  FinancialSummaryDto,
  FinancialTransactionDto,
  MonthlyBudgetDto,
  SavingsGoalDto,
  SubscriptionItemDto
} from '../types/api';

export interface CreateTransactionPayload {
  transactionDate: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  paymentMethod?: string;
}

export interface SetBudgetPayload {
  year: number;
  month: number;
  category: string;
  budgetAmount: number;
}

export interface CreateSavingsGoalPayload {
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
}

export interface CreateDebtPayload {
  creditorName: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  notes?: string;
}

export interface CreateSubscriptionPayload {
  name: string;
  cost: number;
  billingCycle: string;
  nextBillingDate?: string;
  category?: string;
}

export const financeService = {
  async getTransactions(year?: number, month?: number): Promise<FinancialTransactionDto[]> {
    const res = await apiClient.get<ApiResponse<FinancialTransactionDto[]>>('/finance/transactions', {
      params: { year, month }
    });
    return res.data.data;
  },

  async createTransaction(payload: CreateTransactionPayload): Promise<FinancialTransactionDto> {
    const res = await apiClient.post<ApiResponse<FinancialTransactionDto>>('/finance/transactions', payload);
    return res.data.data;
  },

  async removeTransaction(id: string): Promise<void> {
    await apiClient.delete(`/finance/transactions/${id}`);
  },

  async getBudgets(year: number, month: number): Promise<MonthlyBudgetDto[]> {
    const res = await apiClient.get<ApiResponse<MonthlyBudgetDto[]>>('/finance/budgets', {
      params: { year, month }
    });
    return res.data.data;
  },

  async setBudget(payload: SetBudgetPayload): Promise<MonthlyBudgetDto> {
    const res = await apiClient.post<ApiResponse<MonthlyBudgetDto>>('/finance/budgets', payload);
    return res.data.data;
  },

  async getSavingsGoals(): Promise<SavingsGoalDto[]> {
    const res = await apiClient.get<ApiResponse<SavingsGoalDto[]>>('/finance/savings-goals');
    return res.data.data;
  },

  async createSavingsGoal(payload: CreateSavingsGoalPayload): Promise<SavingsGoalDto> {
    const res = await apiClient.post<ApiResponse<SavingsGoalDto>>('/finance/savings-goals', payload);
    return res.data.data;
  },

  async addSavings(id: string, amount: number): Promise<SavingsGoalDto> {
    const res = await apiClient.post<ApiResponse<SavingsGoalDto>>(`/finance/savings-goals/${id}/add`, null, {
      params: { amount }
    });
    return res.data.data;
  },

  async removeSavingsGoal(id: string): Promise<void> {
    await apiClient.delete(`/finance/savings-goals/${id}`);
  },

  async getDebts(): Promise<DebtItemDto[]> {
    const res = await apiClient.get<ApiResponse<DebtItemDto[]>>('/finance/debts');
    return res.data.data;
  },

  async createDebt(payload: CreateDebtPayload): Promise<DebtItemDto> {
    const res = await apiClient.post<ApiResponse<DebtItemDto>>('/finance/debts', payload);
    return res.data.data;
  },

  async makePayment(id: string, amount: number): Promise<DebtItemDto> {
    const res = await apiClient.post<ApiResponse<DebtItemDto>>(`/finance/debts/${id}/pay`, null, {
      params: { amount }
    });
    return res.data.data;
  },

  async removeDebt(id: string): Promise<void> {
    await apiClient.delete(`/finance/debts/${id}`);
  },

  async getSubscriptions(): Promise<SubscriptionItemDto[]> {
    const res = await apiClient.get<ApiResponse<SubscriptionItemDto[]>>('/finance/subscriptions');
    return res.data.data;
  },

  async createSubscription(payload: CreateSubscriptionPayload): Promise<SubscriptionItemDto> {
    const res = await apiClient.post<ApiResponse<SubscriptionItemDto>>('/finance/subscriptions', payload);
    return res.data.data;
  },

  async toggleSubscription(id: string): Promise<SubscriptionItemDto> {
    const res = await apiClient.post<ApiResponse<SubscriptionItemDto>>(`/finance/subscriptions/${id}/toggle`);
    return res.data.data;
  },

  async removeSubscription(id: string): Promise<void> {
    await apiClient.delete(`/finance/subscriptions/${id}`);
  },

  async getSummary(year?: number, month?: number): Promise<FinancialSummaryDto> {
    const res = await apiClient.get<ApiResponse<FinancialSummaryDto>>('/finance/summary', {
      params: { year, month }
    });
    return res.data.data;
  }
};

