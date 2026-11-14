import { apiClient } from './api/apiClient';
import type { ApiResponse, FocusSessionDto, FocusSummaryDto, ScreenTimeLogDto } from '../types/api';

export interface CreateFocusSessionPayload {
  sessionDate: string;
  sessionType: string;
  durationMinutes: number;
  distractionCount: number;
  distractionNotes?: string;
  notes?: string;
}

export interface CreateScreenTimePayload {
  logDate: string;
  category: string;
  durationMinutes: number;
  notes?: string;
}

export const focusService = {
  async getSessions(date?: string, limit = 50): Promise<FocusSessionDto[]> {
    const res = await apiClient.get<ApiResponse<FocusSessionDto[]>>('/focus/sessions', { params: { date, limit } });
    return res.data.data;
  },

  async createSession(payload: CreateFocusSessionPayload): Promise<FocusSessionDto> {
    const res = await apiClient.post<ApiResponse<FocusSessionDto>>('/focus/sessions', payload);
    return res.data.data;
  },

  async getSummary(): Promise<FocusSummaryDto> {
    const res = await apiClient.get<ApiResponse<FocusSummaryDto>>('/focus/summary');
    return res.data.data;
  },

  async getScreenTime(date?: string): Promise<ScreenTimeLogDto[]> {
    const res = await apiClient.get<ApiResponse<ScreenTimeLogDto[]>>('/focus/screen-time', { params: { date } });
    return res.data.data;
  },

  async createScreenTime(payload: CreateScreenTimePayload): Promise<ScreenTimeLogDto> {
    const res = await apiClient.post<ApiResponse<ScreenTimeLogDto>>('/focus/screen-time', payload);
    return res.data.data;
  }
};

