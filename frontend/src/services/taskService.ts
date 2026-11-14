import { apiClient } from './api/apiClient';
import type { ApiResponse, TaskDto, TaskSubtaskDto } from '../types/api';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: string;
  dueDate?: string | null;
  dueTime?: string | null;
  isPinnedToDashboard?: boolean;
  recurrence?: string;
  goalId?: string | null;
  subtasks?: string[];
}

export interface UpdateTaskPayload {
  title: string;
  description?: string;
  priority: string;
  dueDate?: string | null;
  dueTime?: string | null;
  isCompleted: boolean;
  isPinnedToDashboard: boolean;
  recurrence: string;
  goalId?: string | null;
}

export const taskService = {
  async getAll(params?: { date?: string; priority?: string; isCompleted?: boolean; isPinned?: boolean }): Promise<TaskDto[]> {
    const res = await apiClient.get<ApiResponse<TaskDto[]>>('/tasks', { params });
    return res.data.data;
  },

  async getById(id: string): Promise<TaskDto> {
    const res = await apiClient.get<ApiResponse<TaskDto>>(`/tasks/${id}`);
    return res.data.data;
  },

  async create(payload: CreateTaskPayload): Promise<TaskDto> {
    const res = await apiClient.post<ApiResponse<TaskDto>>('/tasks', payload);
    return res.data.data;
  },

  async update(id: string, payload: UpdateTaskPayload): Promise<TaskDto> {
    const res = await apiClient.put<ApiResponse<TaskDto>>(`/tasks/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async toggleCompletion(id: string): Promise<TaskDto> {
    const res = await apiClient.post<ApiResponse<TaskDto>>(`/tasks/${id}/toggle`);
    return res.data.data;
  },

  async toggleSubtask(taskId: string, subtaskId: string): Promise<TaskSubtaskDto> {
    const res = await apiClient.post<ApiResponse<TaskSubtaskDto>>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
    return res.data.data;
  }
};

