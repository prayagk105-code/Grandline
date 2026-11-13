using Dayform.Domain.Common;
using Dayform.Domain.Enums;

namespace Dayform.Domain.Entities;

public class JournalEntry : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly EntryDate { get; set; }
    public string? Accomplishments { get; set; }
    public string? Distractions { get; set; }
    public string? Improvements { get; set; }

    public User User { get; set; } = null!;
}

public class Reminder : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly ReminderDate { get; set; }
    public TimeOnly? ReminderTime { get; set; }
    public RepeatFrequency RepeatFrequency { get; set; } = RepeatFrequency.Never;
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
}

