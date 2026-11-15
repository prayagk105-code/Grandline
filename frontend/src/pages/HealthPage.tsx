import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { HealthLifestyleView } from '../components/progress/HealthLifestyleView';

export const HealthPage: React.FC = () => {
  return (
    <>
      <PageHeader
        eyebrow="Vitality & Wellbeing"
        title="Health & Lifestyle"
        subtitle="Track sleep quality, hydration, daily steps, workouts, meals, and body metrics."
      />
      <HealthLifestyleView />
    </>
  );
};

export default HealthPage;

