using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class LifeTimelineEvent : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly EventDate { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "Milestone"; // Milestone, Career, Health, Personal, Travel
    public string? ImageUrl { get; set; }
    public int SignificanceLevel { get; set; } = 3; // 1 to 5

    public User User { get; set; } = null!;
}

public class FutureLetter : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateOnly WrittenDate { get; set; }
    public DateOnly UnlockDate { get; set; }
    public bool IsRead { get; set; } = false;

    public User User { get; set; } = null!;
}

public class NinetyDayChallenge : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string DailyAction { get; set; } = string.Empty;
    public string Status { get; set; } = "Active"; // Active, Completed, Abandoned

    public User User { get; set; } = null!;
    public ICollection<NinetyDayChallengeLog> DayLogs { get; set; } = new List<NinetyDayChallengeLog>();
}

public class NinetyDayChallengeLog : AuditableEntity
{
    public Guid ChallengeId { get; set; }
    public int DayNumber { get; set; } // 1 to 90
    public DateOnly LogDate { get; set; }
    public bool IsCompleted { get; set; } = false;
    public string? Notes { get; set; }

    public NinetyDayChallenge Challenge { get; set; } = null!;
}

public class PersonalRule : AuditableEntity
{
    public Guid UserId { get; set; }
    public string RuleText { get; set; } = string.Empty;
    public string Category { get; set; } = "General";
    public bool IsActive { get; set; } = true;
    public int CurrentStreak { get; set; } = 0;
    public int BestStreak { get; set; } = 0;

    public User User { get; set; } = null!;
    public ICollection<PersonalRuleLog> Logs { get; set; } = new List<PersonalRuleLog>();
}

public class PersonalRuleLog : AuditableEntity
{
    public Guid RuleId { get; set; }
    public DateOnly LogDate { get; set; }
    public bool Complied { get; set; } = true;

    public PersonalRule Rule { get; set; } = null!;
}

public class DigitalDetox : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string DistractingApps { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public int CleanDaysCount { get; set; } = 0;

    public User User { get; set; } = null!;
}

public class MonthlyReflection : AuditableEntity
{
    public Guid UserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public string? Expectations { get; set; }
    public string? Achievements { get; set; }
    public string? BiggestImprovements { get; set; }
    public string? ChallengesFaced { get; set; }
    public string? LessonsLearned { get; set; }
    public string? NextMonthPriorities { get; set; }

    public User User { get; set; } = null!;
}

