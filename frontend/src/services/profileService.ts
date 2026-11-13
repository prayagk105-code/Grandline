import { apiClient } from './api/apiClient';
import type { ApiResponse, ProfileDto, ThemePreference, UserExportDto } from '../types/api';

export interface UpdateProfilePayload {
  displayName: string;
  themePreference: ThemePreference;
  timeZoneId: string;
  journeyStartDate?: string;
}

export const profileService = {
  async get(): Promise<ProfileDto> {
    const res = await apiClient.get<ApiResponse<ProfileDto>>('/profile');
    return res.data.data;
  },

  async update(payload: UpdateProfilePayload): Promise<ProfileDto> {
    const res = await apiClient.put<ApiResponse<ProfileDto>>('/profile', payload);
    return res.data.data;
  },

  async exportData(): Promise<UserExportDto> {
    const res = await apiClient.get<ApiResponse<UserExportDto>>('/profile/export');
    return res.data.data;
  }
};

