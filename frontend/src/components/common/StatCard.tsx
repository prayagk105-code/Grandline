import React from 'react';
import { DayformIcon } from './DayformIcon';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  note?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, note }) => {
  return (
    <div className="st">
      <div className="l">
        <DayformIcon name={icon} size={15} />
        <span>{label}</span>
      </div>
      <div className="v">{value}</div>
      {note ? <small>{note}</small> : null}
    </div>
  );
};

