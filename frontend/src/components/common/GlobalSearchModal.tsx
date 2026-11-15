import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayformIcon } from './DayformIcon';
import { financeService } from '../../services/financeService';
import { goalService } from '../../services/goalService';
import { habitService } from '../../services/habitService';
import { journalService } from '../../services/journalService';
import { knowledgeService } from '../../services/knowledgeService';
import { memoryService } from '../../services/memoryService';
import { taskService } from '../../services/taskService';
import type {
  BookDto,
  FinancialTransactionDto,
  GoalDto,
  HabitDto,
  JournalEntryDto,
  MemoryDto,
  PersonalNoteDto,
  TaskDto
} from '../../types/api';
import { toIsoDate } from '../../utils/date';

interface SearchResult {
  id: string;
  type: 'Task' | 'Goal' | 'Habit' | 'Book' | 'Note' | 'Memory' | 'Journal' | 'Transaction';
  title: string;
  subtitle?: string;
  route: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = query.toLowerCase();
        const [tasks, goals, habits, books, notes, memories, journals, transactions] = await Promise.all([
          taskService.getAll().catch(() => [] as TaskDto[]),
          goalService.getAll().catch(() => [] as GoalDto[]),
          habitService.getAll(undefined, false, toIsoDate()).catch(() => [] as HabitDto[]),
          knowledgeService.getBooks().catch(() => [] as BookDto[]),
          knowledgeService.getNotes().catch(() => [] as PersonalNoteDto[]),
          memoryService.getAll(undefined, 1, 50).catch(() => ({ items: [] as MemoryDto[], totalCount: 0 })),
          journalService.getAll(1, 30).catch(() => ({ items: [] as JournalEntryDto[], totalCount: 0 })),
          financeService.getTransactions().catch(() => [] as FinancialTransactionDto[])
        ]);

        const items: SearchResult[] = [];

        tasks.filter((t: TaskDto) => t.title.toLowerCase().includes(q)).forEach((t: TaskDto) => {
          items.push({ id: t.id, type: 'Task', title: t.title, subtitle: `${t.priority} priority`, route: '/planner' });
        });

        goals.filter((g: GoalDto) => g.title.toLowerCase().includes(q)).forEach((g: GoalDto) => {
          items.push({ id: g.id, type: 'Goal', title: g.title, subtitle: `${g.timeframe} · ${g.category}`, route: '/planner' });
        });

        habits.filter((h: HabitDto) => h.name.toLowerCase().includes(q)).forEach((h: HabitDto) => {
          items.push({ id: h.id, type: 'Habit', title: h.name, subtitle: h.category, route: '/habits' });
        });

        books.filter((b: BookDto) => b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q)).forEach((b: BookDto) => {
          items.push({ id: b.id, type: 'Book', title: b.title, subtitle: b.author ? `by ${b.author}` : undefined, route: '/study?tab=books' });
        });

        notes.filter((n: PersonalNoteDto) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).forEach((n: PersonalNoteDto) => {
          items.push({ id: n.id, type: 'Note', title: n.title, subtitle: n.category, route: '/study?tab=knowledge' });
        });

        memories.items.filter((m: MemoryDto) => m.title.toLowerCase().includes(q)).forEach((m: MemoryDto) => {
          items.push({ id: m.id, type: 'Memory', title: m.title, subtitle: m.category, route: '/memories' });
        });

        journals.items
          .filter((j: JournalEntryDto) =>
            (j.accomplishments && j.accomplishments.toLowerCase().includes(q)) ||
            (j.improvements && j.improvements.toLowerCase().includes(q)) ||
            (j.distractions && j.distractions.toLowerCase().includes(q))
          )
          .forEach((j: JournalEntryDto) => {
            items.push({ id: j.id, type: 'Journal', title: `Journal (${j.entryDate})`, subtitle: j.accomplishments ? j.accomplishments.slice(0, 45) + '...' : 'Reflection', route: '/journal' });
          });

        transactions
          .filter((tx: FinancialTransactionDto) =>
            (tx.description && tx.description.toLowerCase().includes(q)) ||
            (tx.category && tx.category.toLowerCase().includes(q))
          )
          .forEach((tx: FinancialTransactionDto) => {
            items.push({ id: tx.id, type: 'Transaction', title: `${tx.type === 'Income' ? '+' : '-'}$${tx.amount.toFixed(2)}: ${tx.description || tx.category}`, subtitle: `${tx.transactionDate} · ${tx.category}`, route: '/balance' });
          });

        setResults(items.slice(0, 20));
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: '10vh' }}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540, width: '90%', borderRadius: 14, overflow: 'hidden' }}
      >
        <div className="row" style={{ alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--ln)' }}>
          <DayformIcon name="search" size={18} />
          <input
            type="text"
            placeholder="Search goals, tasks, habits, books, notes, memories... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 15,
              outline: 'none',
              color: 'var(--ink)'
            }}
          />
          <button type="button" className="ib" onClick={onClose}>
            <DayformIcon name="close" size={16} />
          </button>
        </div>

        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}>
          {isSearching && (
            <div style={{ padding: 16, textAlign: 'center' }} className="mut">
              Searching database...
            </div>
          )}

          {!isSearching && query.trim() && results.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center' }} className="mut">
              No results found for "{query}"
            </div>
          )}

          {!isSearching && !query.trim() && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13 }} className="mut">
              Type anything to search across all Grandline systems. Press <b>Ctrl + K</b> anywhere to open.
            </div>
          )}

          {results.map((r) => (
            <div
              key={`${r.type}-${r.id}`}
              onClick={() => {
                navigate(r.route);
                onClose();
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--sf)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.title}</div>
                {r.subtitle && <span className="mut" style={{ fontSize: 12 }}>{r.subtitle}</span>}
              </div>
              <span className="chip" style={{ fontSize: 10, padding: '2px 6px' }}>{r.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
