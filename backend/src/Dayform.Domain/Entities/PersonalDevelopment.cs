using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class DailyMoodEnergyLog : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly LogDate { get; set; }
    public int MoodScore { get; set; } = 3; // 1 to 5
    public int EnergyScore { get; set; } = 3; // 1 to 5
    public int StressScore { get; set; } = 3; // 1 to 5
    public string? Gratitude { get; set; }
    public string? Reflection { get; set; }
    public string? LessonsLearned { get; set; }
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
}

public class BadHabit : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Trigger { get; set; }
    public string? ReplacementHabit { get; set; }
    public DateOnly CleanDaysStartDate { get; set; }
    public int CleanStreakDays { get; set; } = 0;
    public int RelapseCount { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
}

public class PersonalStrengthWeakness : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Type { get; set; } = "Strength"; // Strength or Weakness
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ActionPlan { get; set; }

    public User User { get; set; } = null!;
}

