import { apiClient } from './api/apiClient';
import type { ApiResponse, ProfileDto, ThemePreference, UserExportDto } from '../types/api';

export interface UpdateProfilePayload {
  displayName: string;
  themePreference: ThemePreference;
  timeZoneId: string;
  journeyStartDate?: string;
  dashboardConfigJson?: string;
  dailyFocusTargetMinutes?: number;
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
  },

  async exportCsv(): Promise<Blob> {
    const res = await apiClient.get('/profile/export/csv', { responseType: 'blob' });
    return res.data;
  },

  async restoreBackup(data: UserExportDto): Promise<void> {
    await apiClient.post('/profile/backup/restore', data);
  },

  async setPin(pin?: string | null): Promise<void> {
    await apiClient.post('/profile/pin', { pin: pin || undefined });
  },

  async verifyPin(pin: string): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>('/profile/pin/verify', { pin });
    return res.data.data;
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/profile/account');
  }
};
