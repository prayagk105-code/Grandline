import { apiClient } from './api/apiClient';
import type { ApiResponse, GoalActionStepDto, GoalDto, GoalMilestoneDto, VisionBoardItemDto } from '../types/api';

export interface CreateGoalPayload {
  title: string;
  description?: string;
  category: string;
  timeframe: string;
  startDate: string;
  targetDate: string;
  connectedHabitId?: string | null;
  milestones?: string[];
  actionSteps?: string[];
}

export interface UpdateGoalPayload {
  title: string;
  description?: string;
  category: string;
  timeframe: string;
  startDate: string;
  targetDate: string;
  progressPercentage: number;
  status: string;
  connectedHabitId?: string | null;
}

export interface CreateVisionBoardItemPayload {
  title: string;
  imageUrl?: string;
  quote?: string;
  category: string;
  targetYear?: number;
}

export const goalService = {
  async getAll(category?: string, status?: string): Promise<GoalDto[]> {
    const res = await apiClient.get<ApiResponse<GoalDto[]>>('/goals', {
      params: { category, status }
    });
    return res.data.data;
  },

  async getById(id: string): Promise<GoalDto> {
    const res = await apiClient.get<ApiResponse<GoalDto>>(`/goals/${id}`);
    return res.data.data;
  },

  async create(payload: CreateGoalPayload): Promise<GoalDto> {
    const res = await apiClient.post<ApiResponse<GoalDto>>('/goals', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateGoalPayload): Promise<GoalDto> {
    const res = await apiClient.put<ApiResponse<GoalDto>>(`/goals/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/goals/${id}`);
  },

  async toggleMilestone(goalId: string, milestoneId: string): Promise<GoalMilestoneDto> {
    const res = await apiClient.post<ApiResponse<GoalMilestoneDto>>(`/goals/${goalId}/milestones/${milestoneId}/toggle`);
    return res.data.data;
  },

  async toggleStep(goalId: string, stepId: string): Promise<GoalActionStepDto> {
    const res = await apiClient.post<ApiResponse<GoalActionStepDto>>(`/goals/${goalId}/steps/${stepId}/toggle`);
    return res.data.data;
  },

  async getVisionBoard(): Promise<VisionBoardItemDto[]> {
    const res = await apiClient.get<ApiResponse<VisionBoardItemDto[]>>('/goals/vision-board');
    return res.data.data;
  },

  async addVisionBoardItem(payload: CreateVisionBoardItemPayload): Promise<VisionBoardItemDto> {
    const res = await apiClient.post<ApiResponse<VisionBoardItemDto>>('/goals/vision-board', payload);
    return res.data.data;
  },

  async removeVisionBoardItem(id: string): Promise<void> {
    await apiClient.delete(`/goals/vision-board/${id}`);
  }
};

