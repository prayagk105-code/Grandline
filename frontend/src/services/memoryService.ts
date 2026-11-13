import { apiClient } from './api/apiClient';
import type { ApiResponse, MemoryCategory, MemoryDto, PagedResult } from '../types/api';

export interface MemoryPayload {
  title: string;
  memoryDate: string;
  category: MemoryCategory;
  note?: string;
  icon?: string;
}

export const memoryService = {
  async getAll(category?: MemoryCategory, page = 1, pageSize = 50): Promise<PagedResult<MemoryDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<MemoryDto>>>('/memories', {
      params: { category, page, pageSize }
    });
    return res.data.data;
  },

  async create(payload: MemoryPayload): Promise<MemoryDto> {
    const res = await apiClient.post<ApiResponse<MemoryDto>>('/memories', payload);
    return res.data.data;
  },

  async update(id: string, payload: MemoryPayload): Promise<MemoryDto> {
    const res = await apiClient.put<ApiResponse<MemoryDto>>(`/memories/${id}`, payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/memories/${id}`);
  },

  async uploadImage(memoryId: string, file: File, onProgress?: (percent: number) => void): Promise<MemoryDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<MemoryDto>>(`/memories/${memoryId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      }
    });
    return res.data.data;
  },

  async deleteImage(memoryId: string): Promise<MemoryDto> {
    const res = await apiClient.delete<ApiResponse<MemoryDto>>(`/memories/${memoryId}/image`);
    return res.data.data;
  }
};

