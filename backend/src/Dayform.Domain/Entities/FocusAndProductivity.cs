using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class FocusSession : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly SessionDate { get; set; }
    public string SessionType { get; set; } = "Pomodoro"; // Pomodoro, DeepWork, Custom, Stopwatch
    public int DurationMinutes { get; set; }
    public int DistractionCount { get; set; } = 0;
    public string? DistractionNotes { get; set; }
    public string? Notes { get; set; }
    public DateTime CompletedAtUtc { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class ScreenTimeLog : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly LogDate { get; set; }
    public string Category { get; set; } = "Work"; // Social, Work, Entertainment, Browsing, Other
    public int DurationMinutes { get; set; }
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
}

