import React, { useCallback, useEffect, useState } from 'react';
import { LoadingSkeleton } from '../common/StateBlocks';
import { goalService } from '../../services/goalService';
import { memoryService } from '../../services/memoryService';
import { specialGrandlineService } from '../../services/specialGrandlineService';
import { formatDisplayDate } from '../../utils/date';

interface JourneyItem {
  id: string;
  date: string;
  type: 'Goal' | 'Milestone' | 'Challenge' | 'Memory';
  title: string;
  description?: string;
  badge?: string;
}

export const MyJourneyView: React.FC = () => {
  const [items, setItems] = useState<JourneyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [goals, milestones, challenges, memories] = await Promise.all([
        goalService.getAll(),
        specialGrandlineService.getTimeline(),
        specialGrandlineService.getChallenges(),
        memoryService.getAll(undefined, 1, 20)
      ]);

      const stream: JourneyItem[] = [];

      // Completed goals
      goals.forEach((g) => {
        stream.push({
          id: `goal-${g.id}`,
          date: g.targetDate || g.startDate,
          type: 'Goal',
          title: g.title,
          description: g.description || undefined,
          badge: g.status === 'Completed' ? 'Goal Conquered 🎯' : `${Math.round(g.progressPercentage)}% Progress`
        });
      });

      // Milestones
      milestones.forEach((m) => {
        stream.push({
          id: `milestone-${m.id}`,
          date: m.eventDate,
          type: 'Milestone',
          title: m.title,
          description: m.description || undefined,
          badge: `${m.category} Milestone 🏆`
        });
      });

      // Challenges
      challenges.forEach((c) => {
        stream.push({
          id: `challenge-${c.id}`,
          date: c.startDate,
          type: 'Challenge',
          title: c.title,
          description: c.description || c.dailyAction,
          badge: `90-Day Quest (${c.daysCompleted}/90) 🔥`
        });
      });

      // Memories
      memories.items.forEach((m) => {
        stream.push({
          id: `memory-${m.id}`,
          date: m.memoryDate,
          type: 'Memory',
          title: m.title,
          description: m.note || undefined,
          badge: `${m.category} Memory ✨`
        });
      });

      // Sort descending
      stream.sort((a, b) => (b.date > a.date ? 1 : -1));
      setItems(stream);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSkeleton lines={6} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>My Journey Through the Grandline</h2>
        <p className="mut" style={{ margin: 0, fontSize: 13 }}>
          A unified chronological stream weaving your conquered goals, deep focus breakthroughs, and defining memories into one story.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="cd" style={{ padding: 32, textAlign: 'center' }}>
          <p className="mut" style={{ margin: 0, fontSize: 14 }}>
            As you achieve goals, record memories, and start challenges, your personal odyssey will unfold here.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid var(--ln)', display: 'flex', flexDirection: 'column', gap: 24, marginLeft: 10 }}>
          {items.map((item) => (
            <div key={item.id} style={{ position: 'relative' }}>
              {/* Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: -31,
                  top: 6,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: item.type === 'Goal' ? 'var(--ac)' : item.type === 'Milestone' ? '#f59e0b' : '#3b82f6',
                  border: '3px solid var(--bg)'
                }}
              />

              <div className="cd" style={{ padding: 18 }}>
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className="chip on" style={{ fontSize: 10, padding: '2px 8px' }}>
                    {item.badge}
                  </span>
                  <span className="mut" style={{ fontSize: 12 }}>
                    {formatDisplayDate(item.date)}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: 16 }}>{item.title}</h4>
                {item.description && (
                  <p className="mut" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
