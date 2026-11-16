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
    if (c === 'travel') return 'badge-study';
    if (c === 'everyday') return 'badge-memories';
    return 'badge-memories';
  };

  return (
    <button
      type="button"
      className="mc"
      onClick={() => onSelect(memory)}
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--card-memories-border)',
        background: 'var(--card-memories-bg)',
        overflow: 'hidden',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'transform 0.12s ease, box-shadow 0.15s ease'
      }}
    >
      <div
        className="ma"
        style={{
          height: 120,
          background: imageUrl ? `url(${imageUrl}) center/cover no-repeat` : memoryGradient(memory.gradientIndex),
          position: 'relative',
          display: 'grid',
          placeItems: 'center'
        }}
      >
        {!imageUrl ? (
          <span style={{ color: 'rgba(255,255,255,0.85)' }}>
            <DayformIcon name={memory.icon || 'star'} size={32} />
          </span>
        ) : null}
        <span
          className={`badge ${getCategoryBadge(memory.category)} badge-sm`}
          style={{ position: 'absolute', top: 8, right: 8, backdropFilter: 'blur(6px)' }}
        >
          {memory.category}
        </span>
      </div>

      <div style={{ padding: '10px 12px' }}>
        <b
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--ink)'
          }}
        >
          {memory.title}
        </b>
        <small style={{ color: 'var(--mut)', fontSize: 11, marginTop: 2, display: 'block' }}>
          {formatDisplayDate(memory.memoryDate)}
        </small>
      </div>
    </button>
  );
};
