import { apiClient } from './api/apiClient';
import type { ApiResponse, HabitDto, HabitHeatmapDayDto, HabitLogDto, HabitSummaryDto } from '../types/api';
import { toIsoDate } from '../utils/date';

export interface CreateHabitPayload {
  name: string;
  category: string;
  target?: string;
  icon: string;
  color?: string;
}

export interface UpdateHabitPayload extends CreateHabitPayload {
  isActive: boolean;
}

export const habitService = {
  async getAll(category?: string, includeArchived = false, date: string = toIsoDate()): Promise<HabitDto[]> {
    const res = await apiClient.get<ApiResponse<HabitDto[]>>('/habits', {
      params: { category, includeArchived, date }
    });
    return res.data.data;
  },

  async create(payload: CreateHabitPayload): Promise<HabitDto> {
    const res = await apiClient.post<ApiResponse<HabitDto>>('/habits', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateHabitPayload): Promise<HabitDto> {
    const res = await apiClient.put<ApiResponse<HabitDto>>(`/habits/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/habits/${id}`);
  },

  async getLogs(habitId: string, from?: string, to?: string): Promise<HabitLogDto[]> {
    const res = await apiClient.get<ApiResponse<HabitLogDto[]>>(`/habits/${habitId}/logs`, {
      params: { from, to }
    });
    return res.data.data;
  },

  async setLog(habitId: string, logDate: string, isCompleted: boolean): Promise<HabitLogDto> {
    const res = await apiClient.put<ApiResponse<HabitLogDto>>(`/habits/${habitId}/logs/${logDate}`, {
      isCompleted
    });
    return res.data.data;
  },

  async getSummary(date: string = toIsoDate()): Promise<HabitSummaryDto> {
    const res = await apiClient.get<ApiResponse<HabitSummaryDto>>('/habits/summary', {
      params: { date }
    });
    return res.data.data;
  },

  async getHeatmap(weeks = 21, date: string = toIsoDate()): Promise<HabitHeatmapDayDto[]> {
    const res = await apiClient.get<ApiResponse<HabitHeatmapDayDto[]>>('/habits/heatmap', {
      params: { weeks, date }
    });
    return res.data.data;
  }
};

