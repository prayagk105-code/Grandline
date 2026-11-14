import { apiClient } from './api/apiClient';
import type { ApiResponse, LearningPathDto, PagedResult, StudySessionDto, StudySummaryDto } from '../types/api';
import { toIsoDate } from '../utils/date';

export interface CreateLearningPathPayload {
  name: string;
  description?: string;
  icon: string;
  targetMinutes?: number | null;
  progress: number;
}

export interface UpdateLearningPathPayload extends CreateLearningPathPayload {
  isArchived: boolean;
}

export interface CreateStudySessionPayload {
  learningPathId?: string | null;
  topic: string;
  minutes: number;
  sessionDate: string;
  notes?: string;
  startedAtUtc?: string;
  completedAtUtc?: string;
  clientSessionKey?: string;
}

export interface UpdateStudySessionPayload {
  learningPathId?: string | null;
  topic: string;
  minutes: number;
  sessionDate: string;
  notes?: string;
}

export const studyService = {
  async getLearningPaths(includeArchived = false): Promise<LearningPathDto[]> {
    const res = await apiClient.get<ApiResponse<LearningPathDto[]>>('/learning-paths', {
      params: { includeArchived }
    });
    return res.data.data;
  },

  async createLearningPath(payload: CreateLearningPathPayload): Promise<LearningPathDto> {
    const res = await apiClient.post<ApiResponse<LearningPathDto>>('/learning-paths', payload);
    return res.data.data;
  },

  async updateLearningPath(id: string, payload: UpdateLearningPathPayload): Promise<LearningPathDto> {
    const res = await apiClient.put<ApiResponse<LearningPathDto>>(`/learning-paths/${id}`, payload);
    return res.data.data;
  },

  async deleteLearningPath(id: string): Promise<void> {
    await apiClient.delete(`/learning-paths/${id}`);
  },

  async removeLearningPath(id: string): Promise<void> {
    await apiClient.delete(`/learning-paths/${id}`);
  },

  async getSessions(params: {
    learningPathId?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<PagedResult<StudySessionDto>> {
    const res = await apiClient.get<ApiResponse<PagedResult<StudySessionDto>>>('/study-sessions', { params });
    return res.data.data;
  },

  async createSession(payload: CreateStudySessionPayload): Promise<StudySessionDto> {
    const res = await apiClient.post<ApiResponse<StudySessionDto>>('/study-sessions', payload);
    return res.data.data;
  },

  async updateSession(id: string, payload: UpdateStudySessionPayload): Promise<StudySessionDto> {
    const res = await apiClient.put<ApiResponse<StudySessionDto>>(`/study-sessions/${id}`, payload);
    return res.data.data;
  },

  async deleteSession(id: string): Promise<void> {
    await apiClient.delete(`/study-sessions/${id}`);
  },

  async removeSession(id: string): Promise<void> {
    await apiClient.delete(`/study-sessions/${id}`);
  },

  async getSummary(date: string = toIsoDate()): Promise<StudySummaryDto> {
    const res = await apiClient.get<ApiResponse<StudySummaryDto>>('/study-sessions/summary', {
      params: { date }
    });
    return res.data.data;
  }
};

