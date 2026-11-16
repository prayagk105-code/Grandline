import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { specialGrandlineService } from '../../services/specialGrandlineService';
import type { PersonalRuleDto } from '../../types/api';
import { toIsoDate } from '../../utils/date';

const CATEGORIES = ['All', 'Focus', 'Health', 'Mind', 'Finance', 'General'];

const DEFAULT_RULE_SUGGESTIONS = [
  { ruleText: 'No phone during study or deep work blocks', category: 'Focus' },
  { ruleText: 'Exercise or move body every morning before screens', category: 'Health' },
  { ruleText: 'Read at least 10 pages of a book daily', category: 'Mind' },
  { ruleText: 'No impulsive online purchases — 48 hour waiting rule', category: 'Finance' },
  { ruleText: 'Bed by 11:00 PM on weeknights', category: 'Health' }
];

export const PersonalRulesManager: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [rules, setRules] = useState<PersonalRuleDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [ruleText, setRuleText] = useState('');
  const [category, setCategory] = useState('General');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await specialGrandlineService.getRules(today);
      setRules(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load rules.').message);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleText.trim()) return;
    try {
      await specialGrandlineService.createRule({
        ruleText: ruleText.trim(),
        category
      });
      showToast('Personal rule committed');
      setModalOpen(false);
      resetForm();
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleToggleToday = async (rule: PersonalRuleDto) => {
    try {
      await specialGrandlineService.logRuleCompliance(rule.id, today, !rule.compliedToday);
      showToast(!rule.compliedToday ? 'Rule honored today! 🛡️' : 'Rule uncheck recorded');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this personal rule?')) return;
    try {
      await specialGrandlineService.removeRule(id);
      showToast('Rule removed');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const addSuggestion = async (sug: { ruleText: string; category: string }) => {
    try {
      await specialGrandlineService.createRule({
        ruleText: sug.ruleText,
        category: sug.category
      });
      showToast('Rule added to your code');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const resetForm = () => {
    setRuleText('');
    setCategory('General');
  };

  const filtered = rules.filter(
    (r) => selectedCategory === 'All' || r.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  if (loading) return <LoadingSkeleton lines={4} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>Personal Code & Principles</h2>
          <p className="mut" style={{ margin: 0, fontSize: 13 }}>
            Self-imposed guidelines and standards that govern your decisions and protect your standards.
          </p>
        </div>
        <button
          type="button"
          className="btn pri"
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <DayformIcon name="plus" size={14} />
          <span>New Principle</span>
        </button>
      </div>

      <div className="chips" style={{ marginBottom: 0 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`chip ${selectedCategory === cat ? 'on' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {rules.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <EmptyState
            title="No Personal Rules Set Yet"
            description="Principles define the boundaries between who you were and who you are becoming."
            action={
              <button
                type="button"
                className="btn pri"
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
              >
                Draft First Principle
              </button>
            }
          />
          <div className="cd cd-discipline" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Sample Principles to Adopt:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEFAULT_RULE_SUGGESTIONS.map((sug, idx) => (
                <div
                  key={idx}
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--card-discipline-inner-border)',
                    background: 'var(--card-discipline-inner-bg)'
                  }}
                >
                  <span style={{ fontSize: 13 }}>"{sug.ruleText}"</span>
                  <button
                    type="button"
                    className="btn sec"
                    style={{ fontSize: 12, padding: '4px 10px' }}
                    onClick={() => addSuggestion(sug)}
                  >
                    + Adopt
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((rule) => {
            const isFollowedToday = rule.compliedToday;

            return (
              <div
                key={rule.id}
                className="cd cd-habits cd-compact"
                style={{
                  padding: '11px 13px',
                  marginBottom: 8
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 260 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleToday(rule)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: isFollowedToday ? '2px solid var(--badge-completed-text)' : '2px solid var(--ln)',
                        background: isFollowedToday ? 'var(--badge-completed-text)' : 'transparent',
                        color: isFollowedToday ? '#ffffff' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        marginTop: 2
                      }}
                      title={isFollowedToday ? 'Followed today' : 'Click to mark followed today'}
                    >
                      ✓
                    </button>
                    <div>
                      <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span className="chip" style={{ fontSize: 11, padding: '1px 8px' }}>
                          {rule.category}
                        </span>
                        {isFollowedToday && (
                          <span style={{ fontSize: 12, color: 'var(--ac)', fontWeight: 600 }}>
                            Honored today 🛡️
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>
                        {rule.ruleText}
                      </h3>
                    </div>
                  </div>

                  <div className="row" style={{ alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                        {rule.currentStreak}d
                      </div>
                      <span className="mut" style={{ fontSize: 11 }}>Streak 🔥</span>
                    </div>

                    <button
                      type="button"
                      className="ib"
                      onClick={() => handleDelete(rule.id)}
                      aria-label="Delete"
                    >
                      <DayformIcon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="sheet-backdrop" onClick={() => setModalOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Define Personal Rule</h3>
              <button type="button" className="ib" onClick={() => setModalOpen(false)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="lbl">The Principle / Rule</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. No phone in bed after 10 PM"
                  value={ruleText}
                  onChange={(e) => setRuleText(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Category</label>
                <select
                  className="inp"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Focus">Focus</option>
                  <option value="Health">Health</option>
                  <option value="Mind">Mind</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn pri">
                  Adopt Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
