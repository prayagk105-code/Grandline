import React, { useCallback, useEffect, useState } from 'react';
import { memoryService } from '../../services/memoryService';
import type { MemoryDto } from '../../types/api';
import { formatDisplayDate } from '../../utils/date';

export const RandomMemoryCard: React.FC = () => {
  const [memory, setMemory] = useState<MemoryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const fetchRandom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await memoryService.getAll(undefined, 1, 100);
      if (res && res.items && Array.isArray(res.items) && res.items.length > 0) {
        const randomIndex = Math.floor(Math.random() * res.items.length);
        setMemory(res.items[randomIndex]);
      } else {
        setMemory(null);
      }
    } catch {
      setMemory(null);
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  }, []);

  useEffect(() => {
    fetchRandom();
  }, [fetchRandom]);

  if (hasChecked && !memory) {
    return null; // No memories exist yet
  }

  return (
    <div className="cd" style={{ background: 'var(--sf)', border: '1px solid var(--bd)' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Memory Lane · Revisit
          </span>
        </div>
        <button
          type="button"
          className="btn"
          style={{ fontSize: 11, padding: '3px 8px' }}
          onClick={fetchRandom}
          disabled={loading}
        >
          {loading ? 'Finding...' : '↻ Another Memory'}
        </button>
      </div>

      {memory && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h4 style={{ margin: 0, fontSize: 15 }}>{memory.title}</h4>
            <span className="mut" style={{ fontSize: 12 }}>
              {formatDisplayDate(memory.memoryDate)}
            </span>
          </div>

          {memory.note && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>
              {memory.note}
            </p>
          )}

          {memory.image?.secureUrl && (
            <div style={{ marginTop: 2, maxHeight: 130, overflow: 'hidden', borderRadius: 8 }}>
              <img
                src={memory.image.secureUrl}
                alt={memory.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          <div className="row" style={{ gap: 6, marginTop: 2 }}>
            <span className="badge badge-med badge-sm">{memory.category}</span>
          </div>
        </div>
      )}
    </div>
  );
};
