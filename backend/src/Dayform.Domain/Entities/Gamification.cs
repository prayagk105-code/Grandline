using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class GamificationProfile : AuditableEntity
{
    public Guid UserId { get; set; }
    public int TotalXp { get; set; } = 0;
    public int Level { get; set; } = 1;
    public string TierTitle { get; set; } = "Novice Mariner";

    public User User { get; set; } = null!;
}

public class UserAchievement : AuditableEntity
{
    public Guid UserId { get; set; }
    public string BadgeKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = "award";
    public string Category { get; set; } = "General";
    public DateTime UnlockedAtUtc { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class DailyMission : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly MissionDate { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "Habit"; // Habit, Focus, Task, Reflection, Health
    public int TargetCount { get; set; } = 1;
    public int CurrentCount { get; set; } = 0;
    public int XpReward { get; set; } = 50;
    public bool IsCompleted { get; set; } = false;
    public bool IsClaimed { get; set; } = false;

    public User User { get; set; } = null!;
}

public class CustomReward : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int XpCost { get; set; } = 100;
    public string Icon { get; set; } = "gift";
    public string? Description { get; set; }
    public bool IsRedeemed { get; set; } = false;
    public DateTime? RedeemedAtUtc { get; set; }

    public User User { get; set; } = null!;
}

