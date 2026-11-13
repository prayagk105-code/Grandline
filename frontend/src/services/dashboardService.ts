import { apiClient } from './api/apiClient';
import type { ApiResponse, DashboardSummaryDto, MemoryDto, WeeklyActivityDayDto } from '../types/api';
import { toIsoDate } from '../utils/date';

export const dashboardService = {
  async getSummary(date: string = toIsoDate()): Promise<DashboardSummaryDto> {
    const res = await apiClient.get<ApiResponse<DashboardSummaryDto>>('/dashboard/summary', {
      params: { date }
    });
    return res.data.data;
  },

  async getWeeklyActivity(date: string = toIsoDate()): Promise<WeeklyActivityDayDto[]> {
    const res = await apiClient.get<ApiResponse<WeeklyActivityDayDto[]>>('/dashboard/weekly-activity', {
      params: { date }
    });
    return res.data.data;
  },

  async getRecentMemories(limit = 5): Promise<MemoryDto[]> {
    const res = await apiClient.get<ApiResponse<MemoryDto[]>>('/dashboard/recent-memories', {
      params: { limit }
    });
    return res.data.data;
  }
};

