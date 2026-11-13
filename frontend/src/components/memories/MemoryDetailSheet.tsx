import React from 'react';
import type { MemoryDto } from '../../types/api';
import { formatDisplayDate, memoryGradient } from '../../utils/date';
import { DayformIcon } from '../common/DayformIcon';
import { SheetModal } from '../common/SheetModal';

interface MemoryDetailSheetProps {
  memory: MemoryDto | null;
  onClose: () => void;
  onEdit: (memory: MemoryDto) => void;
  onDelete: (memory: MemoryDto) => void;
}

export const MemoryDetailSheet: React.FC<MemoryDetailSheetProps> = ({ memory, onClose, onEdit, onDelete }) => {
  if (!memory) return null;
  const imageUrl = memory.image?.secureUrl;

  return (
    <SheetModal isOpen={Boolean(memory)} title={memory.title} onClose={onClose}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={memory.title}
          style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 16, marginBottom: 12 }}
        />
      ) : (
        <div
          style={{
            height: 160,
            borderRadius: 16,
            background: memoryGradient(memory.gradientIndex),
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            marginBottom: 12
          }}
        >
          <DayformIcon name={memory.icon || 'star'} size={42} />
        </div>
      )}

      <p className="mut" style={{ margin: '0 0 8px' }}>
        {formatDisplayDate(memory.memoryDate, { day: 'numeric', month: 'long', year: 'numeric' })} ·{' '}
        {memory.category}
      </p>
      {memory.note ? <p style={{ margin: '0 0 16px', whiteSpace: 'pre-wrap' }}>{memory.note}</p> : null}

      <div className="row">
        <button type="button" className="btn" style={{ flex: 1 }} onClick={() => onEdit(memory)}>
          <DayformIcon name="pen" size={16} /> Edit
        </button>
        <button type="button" className="btn dg" style={{ flex: 1 }} onClick={() => onDelete(memory)}>
          <DayformIcon name="trash" size={16} /> Delete
        </button>
      </div>
    </SheetModal>
  );
};

