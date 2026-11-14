import { apiClient } from './api/apiClient';
import type { ApiResponse, CustomRewardDto, DailyMissionDto, GamificationStatusDto } from '../types/api';

export interface CreateCustomRewardPayload {
  title: string;
  xpCost: number;
  icon?: string;
  description?: string;
}

export const gamificationService = {
  async getStatus(): Promise<GamificationStatusDto> {
    const res = await apiClient.get<ApiResponse<GamificationStatusDto>>('/gamification/status');
    return res.data.data;
  },

  async awardXp(amount: number, reason: string): Promise<GamificationStatusDto> {
    const res = await apiClient.post<ApiResponse<GamificationStatusDto>>('/gamification/award-xp', null, {
      params: { amount, reason }
    });
    return res.data.data;
  },

  async claimMission(missionId: string): Promise<DailyMissionDto> {
    const res = await apiClient.post<ApiResponse<DailyMissionDto>>(`/gamification/missions/${missionId}/claim`);
    return res.data.data;
  },

  async createReward(payload: CreateCustomRewardPayload): Promise<CustomRewardDto> {
    const res = await apiClient.post<ApiResponse<CustomRewardDto>>('/gamification/rewards', payload);
    return res.data.data;
  },

  async redeemReward(rewardId: string): Promise<CustomRewardDto> {
    const res = await apiClient.post<ApiResponse<CustomRewardDto>>(`/gamification/rewards/${rewardId}/redeem`);
    return res.data.data;
  }
};

