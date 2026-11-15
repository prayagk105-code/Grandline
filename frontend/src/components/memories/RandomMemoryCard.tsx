import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DayformIcon } from '../common/DayformIcon';
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
    <div className="cd home-card-memory-lane" style={{ borderLeft: '3px solid var(--mod-memories)' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span className="mod-icon mod-icon-memories">
            <DayformIcon name="img" size={15} />
          </span>
          <div>
            <b className="d" style={{ fontSize: 15 }}>Memory Lane</b>
            <div className="mut" style={{ fontSize: 11 }}>A reflection from the past</div>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <button
            type="button"
            className="btn sm"
            style={{ fontSize: 11, padding: '3px 8px' }}
            onClick={fetchRandom}
            disabled={loading}
          >
            {loading ? 'Finding...' : '↻ Another'}
          </button>
          <Link to="/memories" className="lk" style={{ fontSize: 12 }}>
            All <DayformIcon name="right" size={13} />
          </Link>
        </div>
      </div>

      {memory ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{memory.title}</h4>
            <span className="mut" style={{ fontSize: 11.5 }}>
              {formatDisplayDate(memory.memoryDate)}
            </span>
          </div>

          {memory.note && (
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.45 }}>
              {memory.note}
            </p>
          )}

          {memory.image?.secureUrl && (
            <div
              style={{
                marginTop: 4,
                maxHeight: 160,
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--ln)'
              }}
            >
              <img
                src={memory.image.secureUrl}
                alt={memory.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          <div className="row" style={{ gap: 6, marginTop: 2 }}>
            <span className="badge badge-memories badge-sm">{memory.category}</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <span className="mut" style={{ fontSize: 12 }}>Loading a memory...</span>
        </div>
      )}
    </div>
  );
};
