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
}

