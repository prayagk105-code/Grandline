using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Interfaces;

public interface IDayformDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }
    DbSet<EmailOtp> EmailOtps { get; }
    DbSet<Habit> Habits { get; }
    DbSet<HabitLog> HabitLogs { get; }
    DbSet<LearningPath> LearningPaths { get; }
    DbSet<StudySession> StudySessions { get; }
    DbSet<Memory> Memories { get; }
    DbSet<MediaAsset> MediaAssets { get; }
    DbSet<JournalEntry> JournalEntries { get; }
    DbSet<Reminder> Reminders { get; }

    // Grandline Feature Expansion
    DbSet<Goal> Goals { get; }
    DbSet<GoalMilestone> GoalMilestones { get; }
    DbSet<GoalActionStep> GoalActionSteps { get; }
    DbSet<VisionBoardItem> VisionBoardItems { get; }
    DbSet<TodoTask> Tasks { get; }
    DbSet<TaskSubtask> TaskSubtasks { get; }
    DbSet<DailyMoodEnergyLog> MoodLogs { get; }
    DbSet<BadHabit> BadHabits { get; }
    DbSet<PersonalStrengthWeakness> StrengthsWeaknesses { get; }
    DbSet<FocusSession> FocusSessions { get; }
    DbSet<ScreenTimeLog> ScreenTimeLogs { get; }
    DbSet<HealthDailyLog> HealthLogs { get; }
    DbSet<WorkoutLog> WorkoutLogs { get; }
    DbSet<MealLog> MealLogs { get; }
    DbSet<Book> Books { get; }
    DbSet<PersonalNote> Notes { get; }
    DbSet<IdeaItem> Ideas { get; }
    DbSet<SavedQuote> Quotes { get; }
    DbSet<FinancialTransaction> Transactions { get; }
    DbSet<MonthlyBudget> MonthlyBudgets { get; }
    DbSet<SavingsGoal> SavingsGoals { get; }
    DbSet<DebtItem> Debts { get; }
    DbSet<SubscriptionItem> Subscriptions { get; }
    DbSet<GamificationProfile> GamificationProfiles { get; }
    DbSet<UserAchievement> Achievements { get; }
    DbSet<DailyMission> DailyMissions { get; }
    DbSet<CustomReward> CustomRewards { get; }
    DbSet<LifeTimelineEvent> TimelineEvents { get; }
    DbSet<FutureLetter> FutureLetters { get; }
    DbSet<NinetyDayChallenge> Challenges { get; }
    DbSet<NinetyDayChallengeLog> ChallengeLogs { get; }
    DbSet<PersonalRule> PersonalRules { get; }
    DbSet<PersonalRuleLog> PersonalRuleLogs { get; }
    DbSet<DigitalDetox> DigitalDetoxes { get; }
    DbSet<MonthlyReflection> MonthlyReflections { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
