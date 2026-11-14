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
  hasAppPin?: boolean;
  dashboardConfigJson?: string | null;
  dailyFocusTargetMinutes?: number;
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


// -------------------------------------------------------------
// GRANDLINE COMPLETE FEATURE EXPANSION TYPES
// -------------------------------------------------------------

// Module 1: Goals & Vision
export interface GoalMilestoneDto {
  id: string;
  goalId: string;
  title: string;
  targetDate?: string | null;
  isCompleted: boolean;
  completedAtUtc?: string | null;
}

export interface GoalActionStepDto {
  id: string;
  goalId: string;
  title: string;
  isCompleted: boolean;
  orderIndex: number;
}

export interface GoalDto {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  timeframe: string;
  startDate: string;
  targetDate: string;
  progressPercentage: number;
  status: string;
  connectedHabitId?: string | null;
  milestones: GoalMilestoneDto[];
  actionSteps: GoalActionStepDto[];
  createdAtUtc: string;
}

export interface VisionBoardItemDto {
  id: string;
  title: string;
  imageUrl?: string | null;
  quote?: string | null;
  category: string;
  targetYear?: number | null;
  createdAtUtc: string;
}

// Module 2: Tasks
export interface TaskSubtaskDto {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  orderIndex: number;
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string | null;
  priority: 'High' | 'Medium' | 'Low' | string;
  dueDate?: string | null;
  dueTime?: string | null;
  isCompleted: boolean;
  completedAtUtc?: string | null;
  isPinnedToDashboard: boolean;
  recurrence: string;
  goalId?: string | null;
  orderIndex: number;
  subtasks: TaskSubtaskDto[];
  createdAtUtc: string;
}

// Module 3: Personal Development
export interface MoodLogDto {
  id: string;
  logDate: string;
  moodScore: number;
  energyScore: number;
  stressScore: number;
  gratitude?: string | null;
  reflection?: string | null;
  lessonsLearned?: string | null;
  notes?: string | null;
  createdAtUtc: string;
}

export interface BadHabitDto {
  id: string;
  name: string;
  trigger?: string | null;
  replacementHabit?: string | null;
  cleanDaysStartDate: string;
  cleanStreakDays: number;
  relapseCount: number;
  isActive: boolean;
  createdAtUtc: string;
}

export interface StrengthWeaknessDto {
  id: string;
  type: 'Strength' | 'Weakness' | string;
  title: string;
  description?: string | null;
  actionPlan?: string | null;
  createdAtUtc: string;
}

// Module 4: Focus & Productivity
export interface FocusSessionDto {
  id: string;
  sessionDate: string;
  sessionType: string;
  durationMinutes: number;
  distractionCount: number;
  distractionNotes?: string | null;
  notes?: string | null;
  completedAtUtc: string;
}

export interface ScreenTimeLogDto {
  id: string;
  logDate: string;
  category: string;
  durationMinutes: number;
  notes?: string | null;
  createdAtUtc: string;
}

export interface FocusSummaryDto {
  dailyTargetMinutes: number;
  todayFocusMinutes: number;
  weekFocusMinutes: number;
  totalSessionsCount: number;
  deepWorkMinutes: number;
  totalDistractions: number;
  recentSessions: FocusSessionDto[];
}

// Module 5: Health & Lifestyle
export interface HealthDailyLogDto {
  id: string;
  logDate: string;
  sleepHours: number;
  sleepBedtime?: string | null;
  sleepWakeTime?: string | null;
  sleepQuality: number;
  waterIntakeMl: number;
  weightKg?: number | null;
  stepsCount: number;
  walkingDistanceKm?: number | null;
  bodyMeasurementsJson?: string | null;
  notes?: string | null;
  createdAtUtc: string;
}

export interface WorkoutLogDto {
  id: string;
  workoutDate: string;
  activityType: string;
  durationMinutes: number;
  intensity: string;
  caloriesBurned?: number | null;
  notes?: string | null;
  createdAtUtc: string;
}

export interface MealLogDto {
  id: string;
  mealDate: string;
  mealType: string;
  description: string;
  healthyRating: number;
  notes?: string | null;
  createdAtUtc: string;
}

export interface HealthSummaryDto {
  avgSleepHours: number;
  avgWaterIntakeMl: number;
  avgSteps: number;
  workoutsThisWeek: number;
  latestWeightKg?: number | null;
  recentLogs: HealthDailyLogDto[];
}

// Module 6: Knowledge Management
export interface BookDto {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  progressPercent: number;
  status: string;
  rating: number;
  coverImageUrl?: string | null;
  startedDate?: string | null;
  finishedDate?: string | null;
  keyLessons?: string | null;
  createdAtUtc: string;
}

export interface PersonalNoteDto {
  id: string;
  bookId?: string | null;
  bookTitle?: string | null;
  title: string;
  content: string;
  category: string;
  tags?: string | null;
  isFavorite: boolean;
  createdAtUtc: string;
}

export interface IdeaItemDto {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  createdAtUtc: string;
}

export interface SavedQuoteDto {
  id: string;
  bookId?: string | null;
  quoteText: string;
  author: string;
  source?: string | null;
  isFavorite: boolean;
  tags?: string | null;
  createdAtUtc: string;
}

// Module 7: Personal Finance
export interface FinancialTransactionDto {
  id: string;
  transactionDate: string;
  type: 'Income' | 'Expense' | string;
  amount: number;
  category: string;
  description: string;
  paymentMethod?: string | null;
  createdAtUtc: string;
}

export interface MonthlyBudgetDto {
  id: string;
  year: number;
  month: number;
  category: string;
  budgetAmount: number;
  actualSpent: number;
}

export interface SavingsGoalDto {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  targetDate?: string | null;
  isCompleted: boolean;
  createdAtUtc: string;
}

export interface DebtItemDto {
  id: string;
  creditorName: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number | null;
  minimumPayment?: number | null;
  dueDate?: string | null;
  notes?: string | null;
  createdAtUtc: string;
}

export interface SubscriptionItemDto {
  id: string;
  name: string;
  cost: number;
  billingCycle: string;
  nextBillingDate?: string | null;
  category?: string | null;
  isActive: boolean;
  createdAtUtc: string;
}

export interface FinancialSummaryDto {
  totalIncomeThisMonth: number;
  totalExpensesThisMonth: number;
  netSavingsThisMonth: number;
  savingsRatePercent: number;
  totalDebtRemaining: number;
  totalMonthlySubscriptions: number;
  recentTransactions: FinancialTransactionDto[];
}

// Module 8: Gamification
export interface UserAchievementDto {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlockedAtUtc: string;
}

export interface DailyMissionDto {
  id: string;
  missionDate: string;
  title: string;
  description?: string | null;
  category: string;
  targetCount: number;
  currentCount: number;
  xpReward: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface CustomRewardDto {
  id: string;
  title: string;
  xpCost: number;
  icon: string;
  description?: string | null;
  isRedeemed: boolean;
  redeemedAtUtc?: string | null;
}

export interface GamificationStatusDto {
  totalXp: number;
  level: number;
  tierTitle: string;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  achievements: UserAchievementDto[];
  dailyMissions: DailyMissionDto[];
  availableRewards: CustomRewardDto[];
}

// Module 11: Special Grandline Features
export interface LifeTimelineEventDto {
  id: string;
  eventDate: string;
  title: string;
  description?: string | null;
  category: string;
  imageUrl?: string | null;
  significanceLevel: number;
  createdAtUtc: string;
}

export interface FutureLetterDto {
  id: string;
  title: string;
  content: string;
  writtenDate: string;
  unlockDate: string;
  isUnlocked: boolean;
  isRead: boolean;
  createdAtUtc: string;
}

export interface NinetyDayChallengeLogDto {
  id: string;
  challengeId: string;
  dayNumber: number;
  logDate: string;
  isCompleted: boolean;
  notes?: string | null;
}

export interface NinetyDayChallengeDto {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  dailyAction: string;
  status: string;
  daysCompleted: number;
  totalDays: number;
  progressPercent: number;
  dayLogs: NinetyDayChallengeLogDto[];
  createdAtUtc: string;
}

export interface PersonalRuleDto {
  id: string;
  ruleText: string;
  category: string;
  isActive: boolean;
  currentStreak: number;
  bestStreak: number;
  compliedToday: boolean;
  createdAtUtc: string;
}

export interface DigitalDetoxDto {
  id: string;
  title: string;
  distractingApps: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  cleanDaysCount: number;
  createdAtUtc: string;
}

export interface MonthlyReflectionDto {
  id: string;
  year: number;
  month: number;
  expectations?: string | null;
  achievements?: string | null;
  biggestImprovements?: string | null;
  challengesFaced?: string | null;
  lessonsLearned?: string | null;
  nextMonthPriorities?: string | null;
  createdAtUtc: string;
}

export interface DisciplineScoreDto {
  overallScore: number;
  habitScore: number;
  taskScore: number;
  focusScore: number;
  ratingTitle: string;
  description: string;
  factorBreakdowns: string[];
}
