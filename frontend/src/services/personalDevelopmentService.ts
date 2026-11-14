import { apiClient } from './api/apiClient';
import type { ApiResponse, BadHabitDto, MoodLogDto, StrengthWeaknessDto } from '../types/api';

export interface UpsertMoodLogPayload {
  logDate: string;
  moodScore: number;
  energyScore: number;
  stressScore: number;
  gratitude?: string;
  reflection?: string;
  lessonsLearned?: string;
  notes?: string;
}

export interface CreateBadHabitPayload {
  name: string;
  trigger?: string;
  replacementHabit?: string;
  cleanDaysStartDate: string;
}

export interface CreateStrengthWeaknessPayload {
  type: string;
  title: string;
  description?: string;
  actionPlan?: string;
}

export const personalDevelopmentService = {
  async getMoodLogs(limit = 30): Promise<MoodLogDto[]> {
    const res = await apiClient.get<ApiResponse<MoodLogDto[]>>('/personal-development/mood-logs', { params: { limit } });
    return res.data.data;
  },

  async getTodayMoodLog(date?: string): Promise<MoodLogDto | null> {
    const res = await apiClient.get<ApiResponse<MoodLogDto | null>>('/personal-development/mood-logs/today', { params: { date } });
    return res.data.data;
  },

  async upsertMoodLog(payload: UpsertMoodLogPayload): Promise<MoodLogDto> {
    const res = await apiClient.post<ApiResponse<MoodLogDto>>('/personal-development/mood-logs', payload);
    return res.data.data;
  },

  async getBadHabits(): Promise<BadHabitDto[]> {
    const res = await apiClient.get<ApiResponse<BadHabitDto[]>>('/personal-development/bad-habits');
    return res.data.data;
  },

  async createBadHabit(payload: CreateBadHabitPayload): Promise<BadHabitDto> {
    const res = await apiClient.post<ApiResponse<BadHabitDto>>('/personal-development/bad-habits', payload);
    return res.data.data;
  },

  async logRelapse(id: string): Promise<BadHabitDto> {
    const res = await apiClient.post<ApiResponse<BadHabitDto>>(`/personal-development/bad-habits/${id}/relapse`);
    return res.data.data;
  },

  async removeBadHabit(id: string): Promise<void> {
    await apiClient.delete(`/personal-development/bad-habits/${id}`);
  },

  async getStrengthsWeaknesses(type?: string): Promise<StrengthWeaknessDto[]> {
    const res = await apiClient.get<ApiResponse<StrengthWeaknessDto[]>>('/personal-development/strengths-weaknesses', { params: { type } });
    return res.data.data;
  },

  async createStrengthWeakness(payload: CreateStrengthWeaknessPayload): Promise<StrengthWeaknessDto> {
    const res = await apiClient.post<ApiResponse<StrengthWeaknessDto>>('/personal-development/strengths-weaknesses', payload);
    return res.data.data;
  },

  async removeStrengthWeakness(id: string): Promise<void> {
    await apiClient.delete(`/personal-development/strengths-weaknesses/${id}`);
  }
};

