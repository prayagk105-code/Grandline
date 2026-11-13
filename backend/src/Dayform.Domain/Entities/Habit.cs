using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class Habit : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Health";
    public string? Target { get; set; }
    public string Icon { get; set; } = "sun";
    public string? Color { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public User User { get; set; } = null!;
    public ICollection<HabitLog> Logs { get; set; } = new List<HabitLog>();
}

public class HabitLog : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid HabitId { get; set; }
    public DateOnly LogDate { get; set; }
    public bool IsCompleted { get; set; }

    public User User { get; set; } = null!;
    public Habit Habit { get; set; } = null!;
}

