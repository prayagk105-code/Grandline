import React from 'react';
import type { HabitHeatmapDayDto } from '../../types/api';
import { formatDisplayDate } from '../../utils/date';
import { useToast } from '../../contexts/ToastContext';

interface HabitHeatmapProps {
  days: HabitHeatmapDayDto[];
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ days }) => {
  const { showToast } = useToast();

  if (days.length === 0) {
    return <p className="mut">Complete habits to build your activity heatmap.</p>;
  }

  return (
    <div>
      <div className="hm" role="grid" aria-label="Habit activity heatmap">
        {days.map((d) => {
          const levelClass = d.intensityLevel > 0 ? `a${d.intensityLevel}` : '';
          const label = `${formatDisplayDate(d.date)} · ${Math.round(d.completionPercent)}% of habits (${d.completedCount}/${d.totalActiveCount})`;
          return (
            <button
              key={d.date}
              type="button"
              className={`hm-cell ${levelClass}`}
              title={label}
              aria-label={label}
              onClick={() => showToast(label)}
            />
          );
        })}
      </div>
      <div className="lg" aria-hidden="true">
        <span>Less</span>
        <i style={{ background: 'var(--h0)' }} />
        <i style={{ background: 'var(--h1)' }} />
        <i style={{ background: 'var(--h2)' }} />
        <i style={{ background: 'var(--h3)' }} />
        <i style={{ background: 'var(--h4)' }} />
        <span>More</span>
      </div>
    </div>
  );
};

