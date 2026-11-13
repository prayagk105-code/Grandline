import { apiClient } from './api/apiClient';
import type { ApiResponse, PlannerCalendarDto, ReminderDto, RepeatFrequency } from '../types/api';

export interface CreateReminderPayload {
  title: string;
  reminderDate: string;
  reminderTime?: string | null;
  repeatFrequency: RepeatFrequency;
}

export interface UpdateReminderPayload extends CreateReminderPayload {
  isActive: boolean;
}

export const reminderService = {
  async getAll(activeOnly = false): Promise<ReminderDto[]> {
    const res = await apiClient.get<ApiResponse<ReminderDto[]>>('/reminders', {
      params: { activeOnly }
    });
    return res.data.data;
  },

  async create(payload: CreateReminderPayload): Promise<ReminderDto> {
    const res = await apiClient.post<ApiResponse<ReminderDto>>('/reminders', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateReminderPayload): Promise<ReminderDto> {
    const res = await apiClient.put<ApiResponse<ReminderDto>>(`/reminders/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/reminders/${id}`);
  },

  async getCalendar(from: string, to: string): Promise<PlannerCalendarDto> {
    const res = await apiClient.get<ApiResponse<PlannerCalendarDto>>('/planner/calendar', {
      params: { from, to }
    });
    return res.data.data;
  }
};

