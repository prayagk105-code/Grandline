import React, { useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SheetModal } from '../common/SheetModal';
import { useToast } from '../../contexts/ToastContext';
import { goalService, type CreateGoalPayload, type CreateVisionBoardItemPayload } from '../../services/goalService';
import type { GoalDto, VisionBoardItemDto } from '../../types/api';
import { toIsoDate, formatDisplayDate } from '../../utils/date';
import { parseApiError } from '../../services/api/apiError';

export const GoalsManager: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [activeTab, setActiveTab] = useState<'goals' | 'vision'>('goals');
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [visionItems, setVisionItems] = useState<VisionBoardItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [timeframeFilter, setTimeframeFilter] = useState('All');

  // Modals
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [visionModalOpen, setVisionModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDto | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<GoalDto | null>(null);
  const [deletingVision, setDeletingVision] = useState<VisionBoardItemDto | null>(null);

  // Goal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Personal');
  const [formTimeframe, setFormTimeframe] = useState('Yearly');
  const [formStartDate, setFormStartDate] = useState(today);
  const [formTargetDate, setFormTargetDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return toIsoDate(d);
  });
  const [formMilestones, setFormMilestones] = useState<string[]>([]);
  const [formSteps, setFormSteps] = useState<string[]>([]);
  const [newMilestoneInput, setNewMilestoneInput] = useState('');
  const [newStepInput, setNewStepInput] = useState('');

  // Vision Form State
  const [visionTitle, setVisionTitle] = useState('');
  const [visionImage, setVisionImage] = useState('');
  const [visionQuote, setVisionQuote] = useState('');
  const [visionCategory, setVisionCategory] = useState('General');
  const [visionYear, setVisionYear] = useState<number>(new Date().getFullYear());

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsData, visionData] = await Promise.all([
        goalService.getAll(),
        goalService.getVisionBoard()
      ]);
      setGoals(goalsData);
      setVisionItems(visionData);
    } catch (err) {
      showToast(parseApiError(err, 'Failed to load goals & vision board.').message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateGoalModal = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('Personal');
    setFormTimeframe('Yearly');
    setFormStartDate(today);
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setFormTargetDate(toIsoDate(d));
    setFormMilestones([]);
    setFormSteps([]);
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      if (editingGoal) {
        const updated = await goalService.update(editingGoal.id, {
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          category: formCategory,
          timeframe: formTimeframe,
          startDate: formStartDate,
          targetDate: formTargetDate,
          progressPercentage: editingGoal.progressPercentage,
          status: editingGoal.status
        });
        setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? updated : g)));
        showToast('Goal updated');
      } else {
        const payload: CreateGoalPayload = {
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          category: formCategory,
          timeframe: formTimeframe,
          startDate: formStartDate,
          targetDate: formTargetDate,
          milestones: formMilestones.filter(Boolean),
          actionSteps: formSteps.filter(Boolean)
        };
        const created = await goalService.create(payload);
        setGoals((prev) => [created, ...prev]);
        showToast('Goal created');
      }
      setGoalModalOpen(false);
    } catch (err) {
      showToast(parseApiError(err, 'Failed to save goal.').message);
    }
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    try {
      await goalService.toggleMilestone(goalId, milestoneId);
      await loadData();
      showToast('Milestone updated');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to update milestone.').message);
    }
  };

  const handleToggleStep = async (goalId: string, stepId: string) => {
    try {
      await goalService.toggleStep(goalId, stepId);
      await loadData();
    } catch (err) {
      showToast(parseApiError(err, 'Failed to update step.').message);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoal) return;
    try {
      await goalService.remove(deletingGoal.id);
      setGoals((prev) => prev.filter((g) => g.id !== deletingGoal.id));
      showToast('Goal deleted');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to delete goal.').message);
    } finally {
      setDeletingGoal(null);
    }
  };

  const handleSaveVision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visionTitle.trim()) return;

    try {
      const payload: CreateVisionBoardItemPayload = {
        title: visionTitle.trim(),
        imageUrl: visionImage.trim() || undefined,
        quote: visionQuote.trim() || undefined,
        category: visionCategory,
        targetYear: visionYear || undefined
      };
      const created = await goalService.addVisionBoardItem(payload);
      setVisionItems((prev) => [created, ...prev]);
      setVisionModalOpen(false);
      setVisionTitle('');
      setVisionImage('');
      setVisionQuote('');
      showToast('Vision board item added');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to add vision item.').message);
    }
  };

  const handleDeleteVision = async () => {
    if (!deletingVision) return;
    try {
      await goalService.removeVisionBoardItem(deletingVision.id);
      setVisionItems((prev) => prev.filter((v) => v.id !== deletingVision.id));
      showToast('Vision item removed');
    } catch (err) {
      showToast(parseApiError(err, 'Failed to delete item.').message);
    } finally {
      setDeletingVision(null);
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (categoryFilter !== 'All' && g.category !== categoryFilter) return false;
    if (timeframeFilter !== 'All' && g.timeframe !== timeframeFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub tabs: Goals vs Vision Board */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, background: 'var(--sf)', padding: 4, borderRadius: 'var(--radius-pill)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: activeTab === 'goals' ? 'var(--cd)' : 'transparent',
              color: activeTab === 'goals' ? 'var(--ink)' : 'var(--mut)',
              fontWeight: activeTab === 'goals' ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            🎯 Goals & Milestones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vision')}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: activeTab === 'vision' ? 'var(--cd)' : 'transparent',
              color: activeTab === 'vision' ? 'var(--ink)' : 'var(--mut)',
              fontWeight: activeTab === 'vision' ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            🖼️ Vision Board
          </button>
        </div>

        {activeTab === 'goals' ? (
          <button type="button" className="btn pri" onClick={openCreateGoalModal} style={{ padding: '6px 14px', fontSize: 13 }}>
            + New Goal
          </button>
        ) : (
          <button type="button" className="btn pri" onClick={() => setVisionModalOpen(true)} style={{ padding: '6px 14px', fontSize: 13 }}>
            + Add to Vision Board
          </button>
        )}
      </div>

      {activeTab === 'goals' ? (
        <>
          {/* Filters Bar */}
          <div className="goals-filter-grid" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ border: '1px solid var(--ln)', background: 'var(--sf)', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}
            >
              <option value="All">All Categories</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
              <option value="Career">Career</option>
              <option value="Finance">Finance</option>
              <option value="Learning">Learning</option>
            </select>

            <select
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(e.target.value)}
              style={{ border: '1px solid var(--ln)', background: 'var(--sf)', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}
            >
              <option value="All">All Timeframes</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="1 Year">1 Year</option>
              <option value="3 Years">3 Years</option>
              <option value="5 Years">5 Years (Long-Term)</option>
            </select>
          </div>

          {/* Goals List */}
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--mut)' }}>Loading goals...</div>
          ) : filteredGoals.length === 0 ? (
            <div className="cd" style={{ padding: 32, textAlign: 'center', color: 'var(--mut)' }}>
              <p style={{ margin: 0 }}>No goals defined yet. Set your first vision and milestones!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
              {filteredGoals.map((g) => (
                <div key={g.id} className="cd" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span className="badge badge-goals badge-sm">
                          {g.category}
                        </span>
                        <span className="badge badge-info badge-sm">
                          {g.timeframe}
                        </span>
                        <span className={`badge ${g.status === 'Completed' ? 'badge-completed' : 'badge-active'} badge-sm`}>
                          {g.status}
                        </span>
                      </div>
                      <h4 style={{ margin: 0, fontSize: 16 }}>{g.title}</h4>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className="ib sm" onClick={() => setDeletingGoal(g)} aria-label="Delete goal">
                        <DayformIcon name="trash" size={13} />
                      </button>
                    </div>
                  </div>

                  {g.description && <p style={{ margin: 0, fontSize: 13, color: 'var(--mut)' }}>{g.description}</p>}

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--mut)' }}>Progress</span>
                      <span style={{ fontWeight: 600, color: 'var(--ac)' }}>{g.progressPercentage}%</span>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${g.progressPercentage}%` }} />
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--mut)' }}>
                    🎯 Target: {formatDisplayDate(g.targetDate)}
                  </div>

                  {/* Milestones */}
                  {g.milestones.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--ln)', paddingTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Milestones:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {g.milestones.map((m) => (
                          <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={m.isCompleted}
                              onChange={() => handleToggleMilestone(g.id, m.id)}
                            />
                            <span style={{ textDecoration: m.isCompleted ? 'line-through' : 'none', color: m.isCompleted ? 'var(--mut)' : 'var(--ink)' }}>
                              {m.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Steps */}
                  {g.actionSteps.length > 0 && (
                    <div style={{ borderTop: '1px dashed var(--ln)', paddingTop: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Action Steps:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {g.actionSteps.map((s) => (
                          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={s.isCompleted}
                              onChange={() => handleToggleStep(g.id, s.id)}
                            />
                            <span style={{ textDecoration: s.isCompleted ? 'line-through' : 'none', color: s.isCompleted ? 'var(--mut)' : 'var(--ink)' }}>
                              {s.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Vision Board View */
        <div>
          {visionItems.length === 0 ? (
            <div className="cd" style={{ padding: 36, textAlign: 'center', color: 'var(--mut)' }}>
              <p style={{ margin: 0 }}>Your vision board is empty. Add goals, inspiration, quotes, and visions for your future self!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
              {visionItems.map((v) => (
                <div key={v.id} className="cd" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {v.imageUrl ? (
                    <img src={v.imageUrl} alt={v.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: 100, background: 'var(--ac2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'var(--ac)', opacity: 0.7, display: 'inline-flex' }}>
                        <DayformIcon name="img" size={32} />
                      </span>
                    </div>
                  )}
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, background: 'var(--sf)', padding: '2px 6px', borderRadius: 4, color: 'var(--mut)' }}>
                        {v.category} {v.targetYear ? `• ${v.targetYear}` : ''}
                      </span>
                      <button type="button" className="ib" onClick={() => setDeletingVision(v)} aria-label="Delete vision">
                        <DayformIcon name="trash" size={12} />
                      </button>
                    </div>
                    <h5 style={{ margin: 0, fontSize: 15 }}>{v.title}</h5>
                    {v.quote && (
                      <p style={{ margin: 0, fontSize: 13, fontStyle: 'italic', color: 'var(--mut)' }}>"{v.quote}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Goal Create/Edit Modal */}
      <SheetModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} title="Create New Goal">
        <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="f">
            <label>Goal Title *</label>
            <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Master Full-Stack Architecture" />
          </div>

          <div className="f">
            <label>Description / Motivation</label>
            <textarea rows={2} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Why is this goal important to your journey?" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="f">
              <label>Category</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Career">Career</option>
                <option value="Finance">Finance</option>
                <option value="Learning">Learning</option>
              </select>
            </div>

            <div className="f">
              <label>Timeframe</label>
              <select value={formTimeframe} onChange={(e) => setFormTimeframe(e.target.value)}>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="1 Year">1 Year</option>
                <option value="3 Years">3 Years</option>
                <option value="5 Years">5 Years</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="f">
              <label>Start Date</label>
              <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
            </div>
            <div className="f">
              <label>Target Date</label>
              <input type="date" value={formTargetDate} onChange={(e) => setFormTargetDate(e.target.value)} />
            </div>
          </div>

          {/* Add Milestones */}
          <div className="f">
            <label>Key Milestones</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newMilestoneInput}
                onChange={(e) => setNewMilestoneInput(e.target.value)}
                placeholder="e.g. Complete advanced certification"
              />
              <button
                type="button"
                className="btn sec"
                onClick={() => {
                  if (newMilestoneInput.trim()) {
                    setFormMilestones([...formMilestones, newMilestoneInput.trim()]);
                    setNewMilestoneInput('');
                  }
                }}
              >
                Add
              </button>
            </div>
            {formMilestones.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 13 }}>
                {formMilestones.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Add Action Steps */}
          <div className="f">
            <label>Actionable Steps</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newStepInput}
                onChange={(e) => setNewStepInput(e.target.value)}
                placeholder="e.g. Study 45 mins every evening"
              />
              <button
                type="button"
                className="btn sec"
                onClick={() => {
                  if (newStepInput.trim()) {
                    setFormSteps([...formSteps, newStepInput.trim()]);
                    setNewStepInput('');
                  }
                }}
              >
                Add
              </button>
            </div>
            {formSteps.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 13 }}>
                {formSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button type="button" className="btn sec" onClick={() => setGoalModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn pri">
              Save Goal
            </button>
          </div>
        </form>
      </SheetModal>

      {/* Vision Board Modal */}
      <SheetModal isOpen={visionModalOpen} onClose={() => setVisionModalOpen(false)} title="Add to Vision Board">
        <form onSubmit={handleSaveVision} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="f">
            <label>Title / Vision *</label>
            <input type="text" required value={visionTitle} onChange={(e) => setVisionTitle(e.target.value)} placeholder="e.g. Run a half marathon" />
          </div>

          <div className="f">
            <label>Image URL (Optional)</label>
            <input type="url" value={visionImage} onChange={(e) => setVisionImage(e.target.value)} placeholder="https://..." />
          </div>

          <div className="f">
            <label>Inspirational Quote / Motto</label>
            <input type="text" value={visionQuote} onChange={(e) => setVisionQuote(e.target.value)} placeholder="Small steps every day..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="f">
              <label>Category</label>
              <select value={visionCategory} onChange={(e) => setVisionCategory(e.target.value)}>
                <option value="General">General</option>
                <option value="Career">Career</option>
                <option value="Health">Health</option>
                <option value="Travel">Travel</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            <div className="f">
              <label>Target Year</label>
              <input type="number" value={visionYear} onChange={(e) => setVisionYear(Number(e.target.value))} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button type="button" className="btn sec" onClick={() => setVisionModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn pri">
              Add Vision
            </button>
          </div>
        </form>
      </SheetModal>

      {/* Delete Goal Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingGoal)}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deletingGoal?.title}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteGoal}
        onCancel={() => setDeletingGoal(null)}
      />

      {/* Delete Vision Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingVision)}
        title="Delete Vision Item"
        message={`Remove "${deletingVision?.title}" from your vision board?`}
        confirmLabel="Remove"
        onConfirm={handleDeleteVision}
        onCancel={() => setDeletingVision(null)}
      />
    </div>
  );
};
