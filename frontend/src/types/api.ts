export type ThemePreference = 'Auto' | 'Light' | 'Dark';
export type MemoryCategory = 'Everyday' | 'Travel' | 'Milestone';
export type RepeatFrequency = 'Never' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface UserDto {
  id: string;
  displayName: string;
  email: string;
  themePreference: ThemePreference;
  journeyStartDate: string;
  timeZoneId: string;
  isDemoUser: boolean;
  createdAtUtc: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  user: UserDto;
}

export interface ForgotPasswordResponse {
  message: string;
  developmentResetToken?: string | null;
}

export interface SendOtpResponse {
  message: string;
  expiresAtUtc: string;
  developmentOtp?: string | null;
}

export interface HabitDto {
  id: string;
  name: string;
  category: string;
  target?: string | null;
  icon: string;
  color?: string | null;
  isActive: boolean;
  completedToday: boolean;
  createdAtUtc: string;
}

export interface HabitLogDto {
  id: string;
  habitId: string;
  logDate: string;
  isCompleted: boolean;
}

export interface HabitSummaryDto {
  weeklyAveragePercent: number;
  currentStreakDays: number;
  bestStreakDays: number;
  activeCount: number;
}

export interface HabitHeatmapDayDto {
  date: string;
  completedCount: number;
  totalActiveCount: number;
  completionPercent: number;
  intensityLevel: number;
}

export interface LearningPathDto {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  targetMinutes?: number | null;
  progress: number;
  isArchived: boolean;
  totalMinutesLogged: number;
  sessionCount: number;
  lastSessionDate?: string | null;
  createdAtUtc: string;
}

export interface StudySessionDto {
  id: string;
  learningPathId?: string | null;
  learningPathName: string;
  topic: string;
  minutes: number;
  sessionDate: string;
  notes?: string | null;
  startedAtUtc?: string | null;
  completedAtUtc?: string | null;
  createdAtUtc: string;
}

export interface StudySummaryDto {
  totalMinutesAllTime: number;
  totalSessionsAllTime: number;
  minutesThisWeek: number;
}

export interface MediaAssetDto {
  id: string;
  provider: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
}

export interface MemoryDto {
  id: string;
  title: string;
  memoryDate: string;
  category: MemoryCategory;
  note?: string | null;
  icon?: string | null;
  gradientIndex: number;
  image?: MediaAssetDto | null;
  createdAtUtc: string;
}

export interface WeeklyActivityDayDto {
  date: string;
  weekdayShort: string;
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  studyMinutes: number;
}

export interface DashboardSummaryDto {
  todayDate: string;
  journeyDay: number;
  journeyTotalDays: number;
  completedHabitsToday: number;
  totalActiveHabits: number;
  completionPercentToday: number;
  nextIncompleteHabitName?: string | null;
  currentStreakDays: number;
  bestStreakDays: number;
  focusMinutesLast7Days: number;
  habitAverageLast7Days: number;
  last7Days: WeeklyActivityDayDto[];
  todayHabits: HabitDto[];
  recentMemories: MemoryDto[];
}

export interface ReminderDto {
  id: string;
  title: string;
  reminderDate: string;
  reminderTime?: string | null;
  repeatFrequency: RepeatFrequency;
  isActive: boolean;
}

export interface ReminderOccurrenceDto {
  reminderId: string;
  title: string;
  occurrenceDate: string;
  reminderTime?: string | null;
  repeatFrequency: RepeatFrequency;
  isRecurringInstance: boolean;
}

export interface PlannerDayDto {
  date: string;
  habitCompletionPercent: number;
  habitIntensityLevel: number;
  studyMinutes: number;
  studySessionCount: number;
  reminders: ReminderOccurrenceDto[];
  studySessions: StudySessionDto[];
  memories: MemoryDto[];
}

export interface PlannerCalendarDto {
  from: string;
  to: string;
  days: PlannerDayDto[];
}

export interface JournalEntryDto {
  id: string;
  entryDate: string;
  accomplishments?: string | null;
  distractions?: string | null;
  improvements?: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface ProgressInsightDto {
  icon: string;
  title: string;
  description: string;
}

export interface JourneyProgressDto {
  journeyStartDate: string;
  currentDay: number;
  totalDays: number;
  remainingDays: number;
  percentComplete: number;
  phaseName: string;
  totalPhases: number;
}

export interface ProgressSummaryDto {
  from: string;
  to: string;
  habitAveragePercent: number;
  previousPeriodHabitAveragePercent?: number | null;
  habitTrendDeltaPoints?: number | null;
  studyMinutes: number;
  studySessionsCount: number;
  memoriesCount: number;
  insights: ProgressInsightDto[];
  journey: JourneyProgressDto;
}

export interface ProgressHabitPointDto {
  label: string;
  from: string;
  to: string;
  completionPercent: number;
}

export interface ProgressHabitAnalyticsDto {
  from: string;
  to: string;
  granularity: string;
  points: ProgressHabitPointDto[];
}

export interface ProgressStudyPointDto {
  label: string;
  from: string;
  to: string;
  minutes: number;
  sessions: number;
}

export interface ProgressStudyAnalyticsDto {
  from: string;
  to: string;
  totalMinutes: number;
  totalSessions: number;
  bestWeekday?: string | null;
  points: ProgressStudyPointDto[];
}

export interface MonthlySummaryDto {
  year: number;
  month: number;
  monthLabel: string;
  habitCompletionPercent: number;
  studyMinutes: number;
  studySessions: number;
  memoriesCount: number;
}

export type ProfileDto = UserDto;

export interface UserExportDto {
  exportedAtUtc: string;
  profile: ProfileDto;
  habits: HabitDto[];
  habitLogs: HabitLogDto[];
  learningPaths: LearningPathDto[];
  studySessions: StudySessionDto[];
  memories: MemoryDto[];
  journalEntries: JournalEntryDto[];
  reminders: ReminderDto[];
}

