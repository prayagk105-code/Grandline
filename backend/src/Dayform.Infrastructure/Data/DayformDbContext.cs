using Dayform.Application.Interfaces;
using Dayform.Domain.Common;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Infrastructure.Data;

public class DayformDbContext : DbContext, IDayformDbContext
{
    public DayformDbContext(DbContextOptions<DayformDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailOtp> EmailOtps => Set<EmailOtp>();
    public DbSet<Habit> Habits => Set<Habit>();
    public DbSet<HabitLog> HabitLogs => Set<HabitLog>();
    public DbSet<LearningPath> LearningPaths => Set<LearningPath>();
    public DbSet<StudySession> StudySessions => Set<StudySession>();
    public DbSet<Memory> Memories => Set<Memory>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<Reminder> Reminders => Set<Reminder>();

    // Grandline Feature Expansion
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<GoalMilestone> GoalMilestones => Set<GoalMilestone>();
    public DbSet<GoalActionStep> GoalActionSteps => Set<GoalActionStep>();
    public DbSet<VisionBoardItem> VisionBoardItems => Set<VisionBoardItem>();
    public DbSet<TodoTask> Tasks => Set<TodoTask>();
    public DbSet<TaskSubtask> TaskSubtasks => Set<TaskSubtask>();
    public DbSet<DailyMoodEnergyLog> MoodLogs => Set<DailyMoodEnergyLog>();
    public DbSet<BadHabit> BadHabits => Set<BadHabit>();
    public DbSet<PersonalStrengthWeakness> StrengthsWeaknesses => Set<PersonalStrengthWeakness>();
    public DbSet<FocusSession> FocusSessions => Set<FocusSession>();
    public DbSet<ScreenTimeLog> ScreenTimeLogs => Set<ScreenTimeLog>();
    public DbSet<HealthDailyLog> HealthLogs => Set<HealthDailyLog>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();
    public DbSet<MealLog> MealLogs => Set<MealLog>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<PersonalNote> Notes => Set<PersonalNote>();
    public DbSet<IdeaItem> Ideas => Set<IdeaItem>();
    public DbSet<SavedQuote> Quotes => Set<SavedQuote>();
    public DbSet<FinancialTransaction> Transactions => Set<FinancialTransaction>();
    public DbSet<MonthlyBudget> MonthlyBudgets => Set<MonthlyBudget>();
    public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();
    public DbSet<DebtItem> Debts => Set<DebtItem>();
    public DbSet<SubscriptionItem> Subscriptions => Set<SubscriptionItem>();
    public DbSet<GamificationProfile> GamificationProfiles => Set<GamificationProfile>();
    public DbSet<UserAchievement> Achievements => Set<UserAchievement>();
    public DbSet<DailyMission> DailyMissions => Set<DailyMission>();
    public DbSet<CustomReward> CustomRewards => Set<CustomReward>();
    public DbSet<LifeTimelineEvent> TimelineEvents => Set<LifeTimelineEvent>();
    public DbSet<FutureLetter> FutureLetters => Set<FutureLetter>();
    public DbSet<NinetyDayChallenge> Challenges => Set<NinetyDayChallenge>();
    public DbSet<NinetyDayChallengeLog> ChallengeLogs => Set<NinetyDayChallengeLog>();
    public DbSet<PersonalRule> PersonalRules => Set<PersonalRule>();
    public DbSet<PersonalRuleLog> PersonalRuleLogs => Set<PersonalRuleLog>();
    public DbSet<DigitalDetox> DigitalDetoxes => Set<DigitalDetox>();
    public DbSet<MonthlyReflection> MonthlyReflections => Set<MonthlyReflection>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DisplayName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(256).IsRequired();
            entity.Property(x => x.NormalizedEmail).HasMaxLength(256).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
            entity.Property(x => x.ThemePreference).HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.Property(x => x.TimeZoneId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.AppPinHash).HasMaxLength(256);
            entity.Property(x => x.DashboardConfigJson).HasMaxLength(4000);
            entity.Property(x => x.DailyFocusTargetMinutes).HasDefaultValue(120);
            entity.HasIndex(x => x.NormalizedEmail).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            entity.Property(x => x.ReplacedByTokenHash).HasMaxLength(128);
            entity.Property(x => x.UserAgent).HasMaxLength(300);
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => x.UserId);
            entity.HasOne(x => x.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.ToTable("password_reset_tokens");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => x.UserId);
            entity.HasOne(x => x.User)
                .WithMany(u => u.PasswordResetTokens)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmailOtp>(entity =>
        {
            entity.ToTable("email_otps");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(256).IsRequired();
            entity.Property(x => x.OtpHash).HasMaxLength(128).IsRequired();
            entity.HasIndex(x => x.Email);
            entity.HasIndex(x => x.ExpiresAtUtc);
        });

        modelBuilder.Entity<Habit>(entity =>
        {
            entity.ToTable("habits");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Target).HasMaxLength(160);
            entity.Property(x => x.Icon).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Color).HasMaxLength(32);
            entity.HasIndex(x => new { x.UserId, x.IsActive });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Habits)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HabitLog>(entity =>
        {
            entity.ToTable("habit_logs");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.UserId, x.HabitId, x.LogDate }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.LogDate });
            entity.HasOne(x => x.User)
                .WithMany(u => u.HabitLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Habit)
                .WithMany(h => h.Logs)
                .HasForeignKey(x => x.HabitId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LearningPath>(entity =>
        {
            entity.ToTable("learning_paths");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(140).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.Property(x => x.Icon).HasMaxLength(40).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.IsArchived });
            entity.HasOne(x => x.User)
                .WithMany(u => u.LearningPaths)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StudySession>(entity =>
        {
            entity.ToTable("study_sessions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Topic).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(1000);
            entity.Property(x => x.ClientSessionKey).HasMaxLength(100);
            entity.HasIndex(x => new { x.UserId, x.SessionDate });
            entity.HasIndex(x => new { x.UserId, x.LearningPathId });
            entity.HasIndex(x => new { x.UserId, x.ClientSessionKey })
                .IsUnique()
                .HasFilter("\"ClientSessionKey\" IS NOT NULL");
            entity.HasOne(x => x.User)
                .WithMany(u => u.StudySessions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.LearningPath)
                .WithMany(lp => lp.StudySessions)
                .HasForeignKey(x => x.LearningPathId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Memory>(entity =>
        {
            entity.ToTable("memories");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Category).HasConversion<string>().HasMaxLength(32).IsRequired();
            entity.Property(x => x.Note).HasMaxLength(2000);
            entity.Property(x => x.Icon).HasMaxLength(40);
            entity.HasIndex(x => new { x.UserId, x.MemoryDate });
            entity.HasIndex(x => new { x.UserId, x.Category });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Memories)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MediaAsset>(entity =>
        {
            entity.ToTable("media_assets");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Provider).HasMaxLength(40).IsRequired();
            entity.Property(x => x.PublicId).HasMaxLength(255).IsRequired();
            entity.Property(x => x.SecureUrl).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ResourceType).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Format).HasMaxLength(20).IsRequired();
            entity.HasIndex(x => x.MemoryId).IsUnique();
            entity.HasIndex(x => x.UserId);
            entity.HasOne(x => x.User)
                .WithMany(u => u.MediaAssets)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Memory)
                .WithOne(m => m.MediaAsset)
                .HasForeignKey<MediaAsset>(x => x.MemoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<JournalEntry>(entity =>
        {
            entity.ToTable("journal_entries");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Accomplishments).HasMaxLength(4000);
            entity.Property(x => x.Distractions).HasMaxLength(4000);
            entity.Property(x => x.Improvements).HasMaxLength(4000);
            entity.HasIndex(x => new { x.UserId, x.EntryDate }).IsUnique();
            entity.HasOne(x => x.User)
                .WithMany(u => u.JournalEntries)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Reminder>(entity =>
        {
            entity.ToTable("reminders");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.RepeatFrequency).HasConversion<string>().HasMaxLength(20).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.ReminderDate, x.IsActive });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Reminders)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ----------------- GRANDLINE EXPANSION ENTITIES -----------------

        modelBuilder.Entity<Goal>(entity =>
        {
            entity.ToTable("goals");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Timeframe).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.Status });
            entity.HasIndex(x => new { x.UserId, x.TargetDate });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Goals)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GoalMilestone>(entity =>
        {
            entity.ToTable("goal_milestones");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.HasIndex(x => x.GoalId);
            entity.HasOne(x => x.Goal)
                .WithMany(g => g.Milestones)
                .HasForeignKey(x => x.GoalId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GoalActionStep>(entity =>
        {
            entity.ToTable("goal_action_steps");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.HasIndex(x => x.GoalId);
            entity.HasOne(x => x.Goal)
                .WithMany(g => g.ActionSteps)
                .HasForeignKey(x => x.GoalId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VisionBoardItem>(entity =>
        {
            entity.ToTable("vision_board_items");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(150).IsRequired();
            entity.Property(x => x.ImageUrl).HasMaxLength(500);
            entity.Property(x => x.Quote).HasMaxLength(500);
            entity.Property(x => x.Category).HasMaxLength(50);
            entity.HasIndex(x => x.UserId);
            entity.HasOne(x => x.User)
                .WithMany(u => u.VisionBoardItems)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TodoTask>(entity =>
        {
            entity.ToTable("todo_tasks");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(250).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Priority).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Recurrence).HasMaxLength(30).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.DueDate, x.IsCompleted });
            entity.HasIndex(x => new { x.UserId, x.IsPinnedToDashboard });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Tasks)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TaskSubtask>(entity =>
        {
            entity.ToTable("task_subtasks");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.HasIndex(x => x.TaskId);
            entity.HasOne(x => x.Task)
                .WithMany(t => t.Subtasks)
                .HasForeignKey(x => x.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DailyMoodEnergyLog>(entity =>
        {
            entity.ToTable("daily_mood_energy_logs");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Gratitude).HasMaxLength(2000);
            entity.Property(x => x.Reflection).HasMaxLength(4000);
            entity.Property(x => x.LessonsLearned).HasMaxLength(2000);
            entity.Property(x => x.Notes).HasMaxLength(2000);
            entity.HasIndex(x => new { x.UserId, x.LogDate }).IsUnique();
            entity.HasOne(x => x.User)
                .WithMany(u => u.MoodLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BadHabit>(entity =>
        {
            entity.ToTable("bad_habits");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Trigger).HasMaxLength(250);
            entity.Property(x => x.ReplacementHabit).HasMaxLength(250);
            entity.HasIndex(x => new { x.UserId, x.IsActive });
            entity.HasOne(x => x.User)
                .WithMany(u => u.BadHabits)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PersonalStrengthWeakness>(entity =>
        {
            entity.ToTable("personal_strengths_weaknesses");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1000);
            entity.Property(x => x.ActionPlan).HasMaxLength(1000);
            entity.HasIndex(x => new { x.UserId, x.Type });
            entity.HasOne(x => x.User)
                .WithMany(u => u.StrengthsWeaknesses)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FocusSession>(entity =>
        {
            entity.ToTable("focus_sessions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SessionType).HasMaxLength(40).IsRequired();
            entity.Property(x => x.DistractionNotes).HasMaxLength(1000);
            entity.Property(x => x.Notes).HasMaxLength(1000);
            entity.HasIndex(x => new { x.UserId, x.SessionDate });
            entity.HasOne(x => x.User)
                .WithMany(u => u.FocusSessions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ScreenTimeLog>(entity =>
        {
            entity.ToTable("screen_time_logs");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.HasIndex(x => new { x.UserId, x.LogDate });
            entity.HasOne(x => x.User)
                .WithMany(u => u.ScreenTimeLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HealthDailyLog>(entity =>
        {
            entity.ToTable("health_daily_logs");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SleepBedtime).HasMaxLength(20);
            entity.Property(x => x.SleepWakeTime).HasMaxLength(20);
            entity.Property(x => x.BodyMeasurementsJson).HasMaxLength(2000);
            entity.Property(x => x.Notes).HasMaxLength(1000);
            entity.HasIndex(x => new { x.UserId, x.LogDate }).IsUnique();
            entity.HasOne(x => x.User)
                .WithMany(u => u.HealthLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorkoutLog>(entity =>
        {
            entity.ToTable("workout_logs");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ActivityType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Intensity).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(1000);
            entity.HasIndex(x => new { x.UserId, x.WorkoutDate });
            entity.HasOne(x => x.User)
                .WithMany(u => u.WorkoutLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MealLog>(entity =>
        {
            entity.ToTable("meal_logs");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.MealType).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.HasIndex(x => new { x.UserId, x.MealDate });
            entity.HasOne(x => x.User)
                .WithMany(u => u.MealLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Book>(entity =>
        {
            entity.ToTable("books");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Author).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.Property(x => x.CoverImageUrl).HasMaxLength(500);
            entity.Property(x => x.KeyLessons).HasMaxLength(4000);
            entity.HasIndex(x => new { x.UserId, x.Status });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Books)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PersonalNote>(entity =>
        {
            entity.ToTable("personal_notes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Tags).HasMaxLength(300);
            entity.HasIndex(x => new { x.UserId, x.Category });
            entity.HasIndex(x => x.BookId);
            entity.HasOne(x => x.User)
                .WithMany(u => u.Notes)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Book)
                .WithMany(b => b.Notes)
                .HasForeignKey(x => x.BookId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<IdeaItem>(entity =>
        {
            entity.ToTable("idea_items");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.Status });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Ideas)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SavedQuote>(entity =>
        {
            entity.ToTable("saved_quotes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.QuoteText).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.Author).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Source).HasMaxLength(250);
            entity.Property(x => x.Tags).HasMaxLength(300);
            entity.HasIndex(x => x.UserId);
            entity.HasOne(x => x.User)
                .WithMany(u => u.Quotes)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FinancialTransaction>(entity =>
        {
            entity.ToTable("financial_transactions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(250).IsRequired();
            entity.Property(x => x.PaymentMethod).HasMaxLength(50);
            entity.HasIndex(x => new { x.UserId, x.TransactionDate });
            entity.HasIndex(x => new { x.UserId, x.Category });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Transactions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MonthlyBudget>(entity =>
        {
            entity.ToTable("monthly_budgets");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.Year, x.Month, x.Category }).IsUnique();
            entity.HasOne(x => x.User)
                .WithMany(u => u.MonthlyBudgets)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SavingsGoal>(entity =>
        {
            entity.ToTable("savings_goals");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(150).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.IsCompleted });
            entity.HasOne(x => x.User)
                .WithMany(u => u.SavingsGoals)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DebtItem>(entity =>
        {
            entity.ToTable("debt_items");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CreditorName).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.HasIndex(x => x.UserId);
            entity.HasOne(x => x.User)
                .WithMany(u => u.Debts)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SubscriptionItem>(entity =>
        {
            entity.ToTable("subscription_items");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.BillingCycle).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(50);
            entity.HasIndex(x => new { x.UserId, x.IsActive });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Subscriptions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GamificationProfile>(entity =>
        {
            entity.ToTable("gamification_profiles");
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.TierTitle).HasMaxLength(80).IsRequired();
            entity.HasOne(x => x.User)
                .WithOne()
                .HasForeignKey<GamificationProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserAchievement>(entity =>
        {
            entity.ToTable("user_achievements");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.BadgeKey).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(300).IsRequired();
            entity.Property(x => x.Icon).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.BadgeKey }).IsUnique();
            entity.HasOne(x => x.User)
                .WithMany(u => u.Achievements)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DailyMission>(entity =>
        {
            entity.ToTable("daily_missions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.MissionDate });
            entity.HasOne(x => x.User)
                .WithMany(u => u.DailyMissions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CustomReward>(entity =>
        {
            entity.ToTable("custom_rewards");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Icon).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.HasIndex(x => x.UserId);
            entity.HasOne(x => x.User)
                .WithMany(u => u.CustomRewards)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LifeTimelineEvent>(entity =>
        {
            entity.ToTable("life_timeline_events");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ImageUrl).HasMaxLength(500);
            entity.HasIndex(x => new { x.UserId, x.EventDate });
            entity.HasOne(x => x.User)
                .WithMany(u => u.TimelineEvents)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FutureLetter>(entity =>
        {
            entity.ToTable("future_letters");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Content).HasMaxLength(10000).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.UnlockDate });
            entity.HasOne(x => x.User)
                .WithMany(u => u.FutureLetters)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NinetyDayChallenge>(entity =>
        {
            entity.ToTable("ninety_day_challenges");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.DailyAction).HasMaxLength(300).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.Status });
            entity.HasOne(x => x.User)
                .WithMany(u => u.Challenges)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NinetyDayChallengeLog>(entity =>
        {
            entity.ToTable("ninety_day_challenge_logs");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.HasIndex(x => new { x.ChallengeId, x.DayNumber }).IsUnique();
            entity.HasOne(x => x.Challenge)
                .WithMany(c => c.DayLogs)
                .HasForeignKey(x => x.ChallengeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PersonalRule>(entity =>
        {
            entity.ToTable("personal_rules");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RuleText).HasMaxLength(250).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.IsActive });
            entity.HasOne(x => x.User)
                .WithMany(u => u.PersonalRules)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PersonalRuleLog>(entity =>
        {
            entity.ToTable("personal_rule_logs");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.RuleId, x.LogDate }).IsUnique();
            entity.HasOne(x => x.Rule)
                .WithMany(r => r.Logs)
                .HasForeignKey(x => x.RuleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DigitalDetox>(entity =>
        {
            entity.ToTable("digital_detoxes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(150).IsRequired();
            entity.Property(x => x.DistractingApps).HasMaxLength(500).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.IsActive });
            entity.HasOne(x => x.User)
                .WithMany(u => u.DigitalDetoxes)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MonthlyReflection>(entity =>
        {
            entity.ToTable("monthly_reflections");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Expectations).HasMaxLength(2000);
            entity.Property(x => x.Achievements).HasMaxLength(2000);
            entity.Property(x => x.BiggestImprovements).HasMaxLength(2000);
            entity.Property(x => x.ChallengesFaced).HasMaxLength(2000);
            entity.Property(x => x.LessonsLearned).HasMaxLength(2000);
            entity.Property(x => x.NextMonthPriorities).HasMaxLength(2000);
            entity.HasIndex(x => new { x.UserId, x.Year, x.Month }).IsUnique();
            entity.HasOne(x => x.User)
                .WithMany(u => u.MonthlyReflections)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = now;
                entry.Entity.UpdatedAtUtc = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = now;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
