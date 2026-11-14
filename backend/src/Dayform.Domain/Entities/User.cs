using Dayform.Domain.Common;
using Dayform.Domain.Enums;

namespace Dayform.Domain.Entities;

public class User : AuditableEntity
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public ThemePreference ThemePreference { get; set; } = ThemePreference.Auto;
    public DateOnly JourneyStartDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public string TimeZoneId { get; set; } = "UTC";
    public bool IsActive { get; set; } = true;
    public bool IsDemoUser { get; set; } = false;

    // Grandline Feature Expansion additions
    public string? AppPinHash { get; set; }
    public string? DashboardConfigJson { get; set; }
    public int DailyFocusTargetMinutes { get; set; } = 120;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
    public ICollection<Habit> Habits { get; set; } = new List<Habit>();
    public ICollection<HabitLog> HabitLogs { get; set; } = new List<HabitLog>();
    public ICollection<LearningPath> LearningPaths { get; set; } = new List<LearningPath>();
    public ICollection<StudySession> StudySessions { get; set; } = new List<StudySession>();
    public ICollection<Memory> Memories { get; set; } = new List<Memory>();
    public ICollection<MediaAsset> MediaAssets { get; set; } = new List<MediaAsset>();
    public ICollection<JournalEntry> JournalEntries { get; set; } = new List<JournalEntry>();
    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();

    // Expansion Collections
    public ICollection<Goal> Goals { get; set; } = new List<Goal>();
    public ICollection<VisionBoardItem> VisionBoardItems { get; set; } = new List<VisionBoardItem>();
    public ICollection<TodoTask> Tasks { get; set; } = new List<TodoTask>();
    public ICollection<DailyMoodEnergyLog> MoodLogs { get; set; } = new List<DailyMoodEnergyLog>();
    public ICollection<BadHabit> BadHabits { get; set; } = new List<BadHabit>();
    public ICollection<PersonalStrengthWeakness> StrengthsWeaknesses { get; set; } = new List<PersonalStrengthWeakness>();
    public ICollection<FocusSession> FocusSessions { get; set; } = new List<FocusSession>();
    public ICollection<ScreenTimeLog> ScreenTimeLogs { get; set; } = new List<ScreenTimeLog>();
    public ICollection<HealthDailyLog> HealthLogs { get; set; } = new List<HealthDailyLog>();
    public ICollection<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();
    public ICollection<MealLog> MealLogs { get; set; } = new List<MealLog>();
    public ICollection<Book> Books { get; set; } = new List<Book>();
    public ICollection<PersonalNote> Notes { get; set; } = new List<PersonalNote>();
    public ICollection<IdeaItem> Ideas { get; set; } = new List<IdeaItem>();
    public ICollection<SavedQuote> Quotes { get; set; } = new List<SavedQuote>();
    public ICollection<FinancialTransaction> Transactions { get; set; } = new List<FinancialTransaction>();
    public ICollection<MonthlyBudget> MonthlyBudgets { get; set; } = new List<MonthlyBudget>();
    public ICollection<SavingsGoal> SavingsGoals { get; set; } = new List<SavingsGoal>();
    public ICollection<DebtItem> Debts { get; set; } = new List<DebtItem>();
    public ICollection<SubscriptionItem> Subscriptions { get; set; } = new List<SubscriptionItem>();
    public ICollection<UserAchievement> Achievements { get; set; } = new List<UserAchievement>();
    public ICollection<DailyMission> DailyMissions { get; set; } = new List<DailyMission>();
    public ICollection<CustomReward> CustomRewards { get; set; } = new List<CustomReward>();
    public ICollection<LifeTimelineEvent> TimelineEvents { get; set; } = new List<LifeTimelineEvent>();
    public ICollection<FutureLetter> FutureLetters { get; set; } = new List<FutureLetter>();
    public ICollection<NinetyDayChallenge> Challenges { get; set; } = new List<NinetyDayChallenge>();
    public ICollection<PersonalRule> PersonalRules { get; set; } = new List<PersonalRule>();
    public ICollection<DigitalDetox> DigitalDetoxes { get; set; } = new List<DigitalDetox>();
    public ICollection<MonthlyReflection> MonthlyReflections { get; set; } = new List<MonthlyReflection>();
}
