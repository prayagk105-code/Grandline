import { apiClient } from './api/apiClient';
import type {
  ApiResponse,
  DigitalDetoxDto,
  DisciplineScoreDto,
  FutureLetterDto,
  LifeTimelineEventDto,
  MonthlyReflectionDto,
  NinetyDayChallengeDto,
  PersonalRuleDto
} from '../types/api';

export interface CreateTimelineEventPayload {
  eventDate: string;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
  significanceLevel: number;
}

export interface CreateFutureLetterPayload {
  title: string;
  content: string;
  unlockDate: string;
}

export interface CreateChallengePayload {
  title: string;
  description?: string;
  startDate: string;
  dailyAction: string;
}

export interface LogChallengeDayPayload {
  dayNumber: number;
  logDate: string;
  isCompleted: boolean;
  notes?: string;
}

export interface CreateRulePayload {
  ruleText: string;
  category: string;
}

export interface CreateDetoxPayload {
  title: string;
  distractingApps: string;
  startDate: string;
  endDate: string;
}

export interface UpsertMonthlyReflectionPayload {
  year: number;
  month: number;
  expectations?: string;
  achievements?: string;
  biggestImprovements?: string;
  challengesFaced?: string;
  lessonsLearned?: string;
  nextMonthPriorities?: string;
}

export const specialGrandlineService = {
  // 11.1 Life Timeline
  async getTimeline(): Promise<LifeTimelineEventDto[]> {
    const res = await apiClient.get<ApiResponse<LifeTimelineEventDto[]>>('/special/timeline');
    return res.data.data;
  },

  async createTimelineEvent(payload: CreateTimelineEventPayload): Promise<LifeTimelineEventDto> {
    const res = await apiClient.post<ApiResponse<LifeTimelineEventDto>>('/special/timeline', payload);
    return res.data.data;
  },

  async removeTimelineEvent(id: string): Promise<void> {
    await apiClient.delete(`/special/timeline/${id}`);
  },

  // 11.2 Future Self
  async getFutureLetters(): Promise<FutureLetterDto[]> {
    const res = await apiClient.get<ApiResponse<FutureLetterDto[]>>('/special/future-letters');
    return res.data.data;
  },

  async createFutureLetter(payload: CreateFutureLetterPayload): Promise<FutureLetterDto> {
    const res = await apiClient.post<ApiResponse<FutureLetterDto>>('/special/future-letters', payload);
    return res.data.data;
  },

  async markLetterRead(id: string): Promise<FutureLetterDto> {
    const res = await apiClient.post<ApiResponse<FutureLetterDto>>(`/special/future-letters/${id}/read`);
    return res.data.data;
  },

  // 11.3 90-Day Challenge
  async getChallenges(): Promise<NinetyDayChallengeDto[]> {
    const res = await apiClient.get<ApiResponse<NinetyDayChallengeDto[]>>('/special/challenges');
    return res.data.data;
  },

  async createChallenge(payload: CreateChallengePayload): Promise<NinetyDayChallengeDto> {
    const res = await apiClient.post<ApiResponse<NinetyDayChallengeDto>>('/special/challenges', payload);
    return res.data.data;
  },

  async logChallengeDay(challengeId: string, payload: LogChallengeDayPayload): Promise<NinetyDayChallengeDto> {
    const res = await apiClient.post<ApiResponse<NinetyDayChallengeDto>>(`/special/challenges/${challengeId}/day`, payload);
    return res.data.data;
  },

  // 11.5 Personal Rules
  async getRules(date?: string): Promise<PersonalRuleDto[]> {
    const res = await apiClient.get<ApiResponse<PersonalRuleDto[]>>('/special/rules', { params: { date } });
    return res.data.data;
  },

  async createRule(payload: CreateRulePayload): Promise<PersonalRuleDto> {
    const res = await apiClient.post<ApiResponse<PersonalRuleDto>>('/special/rules', payload);
    return res.data.data;
  },

  async logRuleCompliance(ruleId: string, logDate: string, complied: boolean): Promise<PersonalRuleDto> {
    const res = await apiClient.post<ApiResponse<PersonalRuleDto>>(`/special/rules/${ruleId}/compliance`, { logDate, complied });
    return res.data.data;
  },

  async removeRule(id: string): Promise<void> {
    await apiClient.delete(`/special/rules/${id}`);
  },

  // 11.6 Digital Detox
  async getDetoxes(): Promise<DigitalDetoxDto[]> {
    const res = await apiClient.get<ApiResponse<DigitalDetoxDto[]>>('/special/detox');
    return res.data.data;
  },

  async createDetox(payload: CreateDetoxPayload): Promise<DigitalDetoxDto> {
    const res = await apiClient.post<ApiResponse<DigitalDetoxDto>>('/special/detox', payload);
    return res.data.data;
  },

  async logCleanDay(id: string): Promise<DigitalDetoxDto> {
    const res = await apiClient.post<ApiResponse<DigitalDetoxDto>>(`/special/detox/${id}/clean-day`);
    return res.data.data;
  },

  // 11.7 Monthly Reflection
  async getMonthlyReflection(year: number, month: number): Promise<MonthlyReflectionDto | null> {
    const res = await apiClient.get<ApiResponse<MonthlyReflectionDto | null>>('/special/reflections/monthly', {
      params: { year, month }
    });
    return res.data.data;
  },

  async upsertMonthlyReflection(payload: UpsertMonthlyReflectionPayload): Promise<MonthlyReflectionDto> {
    const res = await apiClient.post<ApiResponse<MonthlyReflectionDto>>('/special/reflections/monthly', payload);
    return res.data.data;
  },

  // 11.10 Discipline Score
  async getDisciplineScore(): Promise<DisciplineScoreDto> {
    const res = await apiClient.get<ApiResponse<DisciplineScoreDto>>('/special/discipline-score');
    return res.data.data;
  }
};

