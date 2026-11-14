import { apiClient } from './api/apiClient';
import type { ApiResponse, HealthDailyLogDto, HealthSummaryDto, MealLogDto, WorkoutLogDto } from '../types/api';

export interface UpsertHealthDailyLogPayload {
  logDate: string;
  sleepHours: number;
  sleepBedtime?: string;
  sleepWakeTime?: string;
  sleepQuality: number;
  waterIntakeMl: number;
  weightKg?: number | null;
  stepsCount: number;
  walkingDistanceKm?: number | null;
  bodyMeasurementsJson?: string;
  notes?: string;
}

export interface CreateWorkoutPayload {
  workoutDate: string;
  activityType: string;
  durationMinutes: number;
  intensity: string;
  caloriesBurned?: number | null;
  notes?: string;
}

export interface CreateMealPayload {
  mealDate: string;
  mealType: string;
  description: string;
  healthyRating: number;
  notes?: string;
}

export const healthService = {
  async getDailyLogs(limit = 30): Promise<HealthDailyLogDto[]> {
    const res = await apiClient.get<ApiResponse<HealthDailyLogDto[]>>('/health-logs/daily', { params: { limit } });
    return res.data.data;
  },

  async getTodayDailyLog(date?: string): Promise<HealthDailyLogDto | null> {
    const res = await apiClient.get<ApiResponse<HealthDailyLogDto | null>>('/health-logs/daily/today', { params: { date } });
    return res.data.data;
  },

  async upsertDailyLog(payload: UpsertHealthDailyLogPayload): Promise<HealthDailyLogDto> {
    const res = await apiClient.post<ApiResponse<HealthDailyLogDto>>('/health-logs/daily', payload);
    return res.data.data;
  },

  async getWorkouts(limit = 30): Promise<WorkoutLogDto[]> {
    const res = await apiClient.get<ApiResponse<WorkoutLogDto[]>>('/health-logs/workouts', { params: { limit } });
    return res.data.data;
  },

  async createWorkout(payload: CreateWorkoutPayload): Promise<WorkoutLogDto> {
    const res = await apiClient.post<ApiResponse<WorkoutLogDto>>('/health-logs/workouts', payload);
    return res.data.data;
  },

  async removeWorkout(id: string): Promise<void> {
    await apiClient.delete(`/health-logs/workouts/${id}`);
  },

  async getMeals(date?: string): Promise<MealLogDto[]> {
    const res = await apiClient.get<ApiResponse<MealLogDto[]>>('/health-logs/meals', { params: { date } });
    return res.data.data;
  },

  async createMeal(payload: CreateMealPayload): Promise<MealLogDto> {
    const res = await apiClient.post<ApiResponse<MealLogDto>>('/health-logs/meals', payload);
    return res.data.data;
  },

  async removeMeal(id: string): Promise<void> {
    await apiClient.delete(`/health-logs/meals/${id}`);
  },

  async getSummary(): Promise<HealthSummaryDto> {
    const res = await apiClient.get<ApiResponse<HealthSummaryDto>>('/health-logs/summary');
    return res.data.data;
  }
};

