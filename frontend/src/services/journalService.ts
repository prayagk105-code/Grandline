import { apiClient } from './api/apiClient';
import type { ApiResponse, JournalEntryDto, PagedResult } from '../types/api';

export interface UpsertJournalPayload {
  accomplishments?: string;
  distractions?: string;
  improvements?: string;
}

export const journalService = {
  async getAll(page = 1, pageSize = 20): Promise<PagedResult<JournalEntryDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<JournalEntryDto>>>('/journals', {
      params: { page, pageSize }
    });
    return res.data.data;
  },

  async getByDate(date: string): Promise<JournalEntryDto | null> {
    const res = await apiClient.get<ApiResponse<JournalEntryDto | null>>(`/journals/${date}`);
    return res.data.data;
  },

  async upsert(date: string, payload: UpsertJournalPayload): Promise<JournalEntryDto> {
    const res = await apiClient.put<ApiResponse<JournalEntryDto>>(`/journals/${date}`, payload);
    return res.data.data;
  },

  async remove(date: string): Promise<void> {
    await apiClient.delete(`/journals/${date}`);
  }
};

