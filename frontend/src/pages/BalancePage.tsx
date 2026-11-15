import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { PersonalFinanceView } from '../components/progress/PersonalFinanceView';

export const BalancePage: React.FC = () => {
  return (
    <>
      <PageHeader
        eyebrow="Financial Command Center"
        title="Balance"
        subtitle="Manage your income, expenses, budgets, savings goals, debts, and recurring subscriptions."
      />
      <PersonalFinanceView />
    </>
  );
};

export default BalancePage;

