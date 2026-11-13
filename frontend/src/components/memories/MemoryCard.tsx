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

  return (
    <button type="button" className="mc" onClick={() => onSelect(memory)}>
      <div
        className="ma"
        style={{
          background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : memoryGradient(memory.gradientIndex)
        }}
      >
        {!imageUrl ? <DayformIcon name={memory.icon || 'star'} size={34} /> : null}
      </div>
      <b>{memory.title}</b>
      <small>
        {formatDisplayDate(memory.memoryDate)} · {memory.category.toLowerCase()}
      </small>
    </button>
  );
};

