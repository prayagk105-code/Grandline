import React, { useCallback, useEffect, useState } from 'react';
import { DayformIcon } from '../common/DayformIcon';
import { StatCard } from '../common/StatCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../common/StateBlocks';
import { useToast } from '../../contexts/ToastContext';
import { parseApiError } from '../../services/api/apiError';
import { healthService } from '../../services/healthService';
import type { HealthSummaryDto, MealLogDto, WorkoutLogDto } from '../../types/api';
import { formatDisplayDate, toIsoDate } from '../../utils/date';

type SubView = 'overview' | 'workouts' | 'meals';

export const HealthLifestyleView: React.FC = () => {
  const { showToast } = useToast();
  const today = toIsoDate();

  const [subView, setSubView] = useState<SubView>('overview');
  const [selectedDate, setSelectedDate] = useState(today);

  // Data states
  const [summary, setSummary] = useState<HealthSummaryDto | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutLogDto[]>([]);
  const [meals, setMeals] = useState<MealLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Daily log form states
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [waterGlasses, setWaterGlasses] = useState(8);
  const [steps, setSteps] = useState(8000);
  const [distanceKm, setDistanceKm] = useState(5.5);
  const [weightKg, setWeightKg] = useState(70.0);
  const [waistCm, setWaistCm] = useState(80);
  const [chestCm, setChestCm] = useState(96);
  const [hipsCm, setHipsCm] = useState(94);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [savingDaily, setSavingDaily] = useState(false);

  // Workout modal
  const [workoutModal, setWorkoutModal] = useState(false);
  const [wType, setWType] = useState('Strength');
  const [wDuration, setWDuration] = useState(45);
  const [wCalories, setWCalories] = useState(300);
  const [wNotes, setWNotes] = useState('');

  // Meal modal
  const [mealModal, setMealModal] = useState(false);
  const [mType, setMType] = useState('Lunch');
  const [mDesc, setMDesc] = useState('');
  const [mRating, setMRating] = useState(4);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, dailyData, wData, mData] = await Promise.all([
        healthService.getSummary(),
        healthService.getTodayDailyLog(selectedDate),
        healthService.getWorkouts(),
        healthService.getMeals(selectedDate)
      ]);
      setSummary(sumData);
      setWorkouts(wData);
      setMeals(mData);

      if (dailyData) {
        if (dailyData.sleepHours != null) setSleepHours(dailyData.sleepHours);
        if (dailyData.sleepQuality != null) setSleepQuality(dailyData.sleepQuality);
        if (dailyData.waterIntakeMl != null) setWaterGlasses(Math.round(dailyData.waterIntakeMl / 250));
        if (dailyData.stepsCount != null) setSteps(dailyData.stepsCount);
        if (dailyData.walkingDistanceKm != null) setDistanceKm(dailyData.walkingDistanceKm);
        if (dailyData.weightKg != null) setWeightKg(dailyData.weightKg);
        if (dailyData.bodyMeasurementsJson) {
          try {
            const m = JSON.parse(dailyData.bodyMeasurementsJson);
            if (m.waist) setWaistCm(m.waist);
            if (m.chest) setChestCm(m.chest);
            if (m.hips) setHipsCm(m.hips);
            setShowMeasurements(true);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      setError(parseApiError(err, 'Failed to load health metrics.').message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDaily(true);
    try {
      await healthService.upsertDailyLog({
        logDate: selectedDate,
        sleepHours,
        sleepQuality,
        waterIntakeMl: waterGlasses * 250,
        stepsCount: steps,
        walkingDistanceKm: distanceKm,
        weightKg,
        bodyMeasurementsJson: JSON.stringify({ waist: waistCm, chest: chestCm, hips: hipsCm })
      });
      showToast('Health metrics updated for ' + formatDisplayDate(selectedDate));
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    } finally {
      setSavingDaily(false);
    }
  };

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wType.trim() || wDuration <= 0) return;
    try {
      await healthService.createWorkout({
        workoutDate: selectedDate,
        activityType: wType.trim(),
        durationMinutes: wDuration,
        intensity: 'Medium',
        caloriesBurned: wCalories || undefined,
        notes: wNotes.trim() || undefined
      });
      showToast('Workout recorded! Strong body, sharp mind.');
      setWorkoutModal(false);
      setWNotes('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await healthService.removeWorkout(id);
      showToast('Workout log removed');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mDesc.trim()) return;
    try {
      await healthService.createMeal({
        mealDate: selectedDate,
        mealType: mType,
        description: mDesc.trim(),
        healthyRating: mRating
      });
      showToast('Meal logged');
      setMealModal(false);
      setMDesc('');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await healthService.removeMeal(id);
      showToast('Meal removed');
      load();
    } catch (err) {
      showToast(parseApiError(err).message, 'error');
    }
  };

  if (loading && !summary) return <LoadingSkeleton lines={6} />;
  if (error && !summary) return <ErrorState message={error} onRetry={load} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Date Switcher & Sub-tabs */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="chips" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`chip ${subView === 'overview' ? 'on' : ''}`}
            onClick={() => setSubView('overview')}
          >
            Daily Health & Vitals
          </button>
          <button
            type="button"
            className={`chip ${subView === 'workouts' ? 'on' : ''}`}
            onClick={() => setSubView('workouts')}
          >
            Workout Logs ({workouts.length})
          </button>
          <button
            type="button"
            className={`chip ${subView === 'meals' ? 'on' : ''}`}
            onClick={() => setSubView('meals')}
          >
            Meal Journal ({meals.length})
          </button>
        </div>

        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13 }} className="mut">Date:</label>
          <input
            type="date"
            className="inp"
            style={{ width: 140, padding: '4px 8px', fontSize: 13 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Monthly Summary Stats */}
      {summary && (
        <div className="g3">
          <StatCard
            icon="clock"
            label="Avg Sleep"
            value={`${summary.avgSleepHours.toFixed(1)}h`}
            note="last 30 days"
            accent="sage"
          />
          <StatCard
            icon="study"
            label="Avg Daily Steps"
            value={Math.round(summary.avgSteps).toLocaleString()}
            note="movement consistency"
            accent="sage"
          />
          <StatCard
            icon="flame"
            label="Workouts This Week"
            value={String(summary.workoutsThisWeek)}
            note="exercise sessions"
            accent="sage"
          />
        </div>
      )}

      {/* OVERVIEW / DAILY VITALS VIEW */}
      {subView === 'overview' && (
        <div className="cd cd-health">
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Log Vitals for {formatDisplayDate(selectedDate)}</h3>

          <form onSubmit={handleSaveDaily} className="health-vitals-grid">
            <div>
              <label className="lbl">Sleep Hours</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                className="inp"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
              />
              <span className="mut" style={{ fontSize: 11 }}>Recommended: 7-9 hours</span>
            </div>

            <div>
              <label className="lbl">Sleep Quality (1-5)</label>
              <select
                className="inp"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(parseInt(e.target.value) || 3)}
              >
                <option value={1}>1 - Terrible / Exhausted</option>
                <option value={2}>2 - Restless</option>
                <option value={3}>3 - Fair / Average</option>
                <option value={4}>4 - Good / Refreshed</option>
                <option value={5}>5 - Exceptional / Deep</option>
              </select>
            </div>

            <div>
              <label className="lbl">Water Intake (Glasses ~250ml)</label>
              <input
                type="number"
                min="0"
                max="30"
                className="inp"
                value={waterGlasses}
                onChange={(e) => setWaterGlasses(parseInt(e.target.value) || 0)}
              />
              <span className="mut" style={{ fontSize: 11 }}>Total: {waterGlasses * 250} ml</span>
            </div>

            <div>
              <label className="lbl">Daily Steps</label>
              <input
                type="number"
                min="0"
                className="inp"
                value={steps}
                onChange={(e) => setSteps(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="lbl">Walking Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="inp"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="lbl">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className="inp"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Body Measurements Toggle & Fields */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Body Measurements (optional)</span>
                <button
                  type="button"
                  className="lk"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowMeasurements(!showMeasurements)}
                >
                  {showMeasurements ? 'Hide Measurements' : '+ Track Waist, Chest & Hips'}
                </button>
              </div>

              {showMeasurements && (
                <div className="health-measurements-grid">
                  <div>
                    <label className="lbl">Waist (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="inp"
                      value={waistCm}
                      onChange={(e) => setWaistCm(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="lbl">Chest (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="inp"
                      value={chestCm}
                      onChange={(e) => setChestCm(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="lbl">Hips (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="inp"
                      value={hipsCm}
                      onChange={(e) => setHipsCm(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="submit" className="btn pri" disabled={savingDaily}>
                {savingDaily ? 'Saving...' : 'Save Health Vitals'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WORKOUTS VIEW */}
      {subView === 'workouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Workouts</h3>
            <button type="button" className="btn pri" onClick={() => setWorkoutModal(true)}>
              + Log Workout
            </button>
          </div>

          {workouts.length === 0 ? (
            <EmptyState
              title="No Workouts Logged"
              description="Record strength training, cardio, running, swimming, or yoga sessions."
              action={
                <button type="button" className="btn pri" onClick={() => setWorkoutModal(true)}>
                  Log Workout
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {workouts.map((w) => (
                <div
                  key={w.id}
                  className="cd cd-health"
                  style={{
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span className="chip on" style={{ fontSize: 10, padding: '1px 6px' }}>{w.activityType}</span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{w.durationMinutes} minutes</span>
                      {w.caloriesBurned && (
                        <span className="mut" style={{ fontSize: 12 }}>🔥 {w.caloriesBurned} kcal</span>
                      )}
                    </div>
                    {w.notes && <p className="mut" style={{ margin: 0, fontSize: 13 }}>{w.notes}</p>}
                  </div>

                  <button
                    type="button"
                    className="ib"
                    onClick={() => handleDeleteWorkout(w.id)}
                    aria-label="Delete"
                  >
                    <DayformIcon name="trash" size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MEALS VIEW */}
      {subView === 'meals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Meal Journal for {formatDisplayDate(selectedDate)}</h3>
            <button type="button" className="btn pri" onClick={() => setMealModal(true)}>
              + Log Meal
            </button>
          </div>

          {meals.length === 0 ? (
            <EmptyState
              title="No Meals Logged"
              description="Maintain awareness of nutritional choices, whole foods, and meal patterns."
              action={
                <button type="button" className="btn pri" onClick={() => setMealModal(true)}>
                  Log Meal
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {meals.map((m) => (
                <div
                  key={m.id}
                  className="cd cd-health"
                  style={{
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span className="chip" style={{ fontSize: 10, padding: '1px 6px' }}>{m.mealType}</span>
                      <span style={{ fontSize: 12 }}>{'⭐'.repeat(m.healthyRating)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14 }}>{m.description}</p>
                  </div>

                  <button
                    type="button"
                    className="ib"
                    onClick={() => handleDeleteMeal(m.id)}
                    aria-label="Delete"
                  >
                    <DayformIcon name="trash" size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workout Modal */}
      {workoutModal && (
        <div className="sheet-backdrop" onClick={() => setWorkoutModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Log Workout</h3>
              <button type="button" className="ib" onClick={() => setWorkoutModal(false)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkout} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Activity Type</label>
                <input
                  type="text"
                  className="inp"
                  placeholder="e.g. Weightlifting, Running, Swimming"
                  value={wType}
                  onChange={(e) => setWType(e.target.value)}
                  required
                />
              </div>

              <div className="df-grid-2">
                <div>
                  <label className="lbl">Duration (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className="inp"
                    value={wDuration}
                    onChange={(e) => setWDuration(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="lbl">Calories Burned</label>
                  <input
                    type="number"
                    min={0}
                    className="inp"
                    value={wCalories}
                    onChange={(e) => setWCalories(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="lbl">Workout Notes / Sets</label>
                <textarea
                  className="inp"
                  rows={3}
                  placeholder="Bench press 4x8, Squats 4x10, etc."
                  value={wNotes}
                  onChange={(e) => setWNotes(e.target.value)}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setWorkoutModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Save Workout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meal Modal */}
      {mealModal && (
        <div className="sheet-backdrop" onClick={() => setMealModal(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Log Meal</h3>
              <button type="button" className="ib" onClick={() => setMealModal(false)}>
                <DayformIcon name="x" size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMeal} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="lbl">Meal Type</label>
                <select className="inp" value={mType} onChange={(e) => setMType(e.target.value)}>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="lbl">Meal Description</label>
                <textarea
                  className="inp"
                  rows={3}
                  placeholder="Grilled salmon with brown rice and steamed broccoli..."
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="lbl">Nutritional Quality (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  className="inp"
                  value={mRating}
                  onChange={(e) => setMRating(parseInt(e.target.value) || 3)}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn sec" onClick={() => setMealModal(false)}>Cancel</button>
                <button type="submit" className="btn pri">Save Meal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
