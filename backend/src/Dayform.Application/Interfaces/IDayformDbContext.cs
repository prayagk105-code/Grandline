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

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

