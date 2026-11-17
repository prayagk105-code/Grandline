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

  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div>
      {/* Weekday Column Headers matching Screenshot 2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6,
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: '#6B7280',
          marginBottom: 8
        }}
      >
        {weekdays.map((wd, i) => (
          <span key={i}>{wd}</span>
        ))}
      </div>

      <div
        className="hm"
        role="grid"
        aria-label="Habit activity heatmap"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 6
        }}
      >
        {days.map((d) => {
          const pct = Math.min(100, Math.max(0, d.completionPercent || 0));
          const levelClass = d.intensityLevel > 0 ? `a${d.intensityLevel}` : '';
          const label = `${formatDisplayDate(d.date)} · ${Math.round(pct)}% of habits (${d.completedCount}/${d.totalActiveCount})`;
          
          // Color based on completion rate matching green/teal shades in Screenshot 2
          const bg =
            pct === 0
              ? '#EEF2F6'
              : pct < 35
              ? '#A7F3D0'
              : pct < 70
              ? '#34D399'
              : pct < 90
              ? '#0D9488'
              : '#065F46';

          return (
            <button
              key={d.date}
              type="button"
              className={`hm-cell ${levelClass}`}
              title={label}
              aria-label={label}
              onClick={() => showToast(label)}
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: 8,
                background: bg,
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.1s ease'
              }}
            />
          );
        })}
      </div>

      {/* Legend matching Screenshot 2 */}
      <div
        className="lg"
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          fontSize: 11,
          color: '#6B7280'
        }}
      >
        <span>Less</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#EEF2F6', '#A7F3D0', '#34D399', '#0D9488', '#065F46'].map((color, idx) => (
            <i
              key={idx}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2.5,
                background: color,
                display: 'inline-block'
              }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
