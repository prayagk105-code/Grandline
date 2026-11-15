import React from 'react';
import type { MemoryDto } from '../../types/api';
import { formatDisplayDate, memoryGradient } from '../../utils/date';
import { DayformIcon } from '../common/DayformIcon';

interface MemoryCardProps {
  memory: MemoryDto;
  onSelect: (memory: MemoryDto) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onSelect }) => {
  const imageUrl = memory.image?.secureUrl;

  const getCategoryBadge = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c === 'milestone') return 'badge-goals';
    if (c === 'travel') return 'badge-low';
    return 'badge-health';
  };

  return (
    <button type="button" className="mc" onClick={() => onSelect(memory)}>
      <div
        className="ma"
        style={{
          background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : memoryGradient(memory.gradientIndex),
          position: 'relative'
        }}
      >
        {!imageUrl ? <DayformIcon name={memory.icon || 'star'} size={34} /> : null}
        <span
          className={`badge ${getCategoryBadge(memory.category)} badge-sm`}
          style={{ position: 'absolute', top: 8, right: 8, backdropFilter: 'blur(4px)' }}
        >
          {memory.category}
        </span>
      </div>
      <b>{memory.title}</b>
      <small>
        {formatDisplayDate(memory.memoryDate)}
      </small>
    </button>
  );
};
