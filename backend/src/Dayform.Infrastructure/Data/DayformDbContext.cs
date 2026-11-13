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

