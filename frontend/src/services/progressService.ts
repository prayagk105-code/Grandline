import { apiClient } from './api/apiClient';
import type {
  ApiResponse,
  MonthlySummaryDto,
  ProgressHabitAnalyticsDto,
  ProgressStudyAnalyticsDto,
  ProgressSummaryDto
} from '../types/api';
import { toIsoDate } from '../utils/date';

export const progressService = {
  async getSummary(from: string, to: string): Promise<ProgressSummaryDto> {
    const res = await apiClient.get<ApiResponse<ProgressSummaryDto>>('/progress/summary', {
      params: { from, to }
    });
    return res.data.data;
  },

  async getHabits(from: string, to: string): Promise<ProgressHabitAnalyticsDto> {
    const res = await apiClient.get<ApiResponse<ProgressHabitAnalyticsDto>>('/progress/habits', {
      params: { from, to }
    });
    return res.data.data;
  },

  async getStudy(from: string, to: string): Promise<ProgressStudyAnalyticsDto> {
    const res = await apiClient.get<ApiResponse<ProgressStudyAnalyticsDto>>('/progress/study', {
      params: { from, to }
    });
    return res.data.data;
  },

  async getMonthly(months = 5, date: string = toIsoDate()): Promise<MonthlySummaryDto[]> {
    const res = await apiClient.get<ApiResponse<MonthlySummaryDto[]>>('/progress/monthly', {
      params: { months, date }
    });
    return res.data.data;
  }
};

