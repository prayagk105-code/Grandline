using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class Goal : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "Personal"; // Personal, Health, Career, Finance, Learning
    public string Timeframe { get; set; } = "Yearly"; // Weekly, Monthly, Yearly, 1 Year, 3 Years, 5 Years
    public DateOnly StartDate { get; set; }
    public DateOnly TargetDate { get; set; }
    public int ProgressPercentage { get; set; } = 0;
    public string Status { get; set; } = "Active"; // Active, Completed, Archived, OnHold
    public Guid? ConnectedHabitId { get; set; }

    public User User { get; set; } = null!;
    public ICollection<GoalMilestone> Milestones { get; set; } = new List<GoalMilestone>();
    public ICollection<GoalActionStep> ActionSteps { get; set; } = new List<GoalActionStep>();
}

public class GoalMilestone : AuditableEntity
{
    public Guid GoalId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly? TargetDate { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAtUtc { get; set; }

    public Goal Goal { get; set; } = null!;
}

public class GoalActionStep : AuditableEntity
{
    public Guid GoalId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; } = false;
    public int OrderIndex { get; set; } = 0;

    public Goal Goal { get; set; } = null!;
}

public class VisionBoardItem : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? Quote { get; set; }
    public string Category { get; set; } = "General";
    public int? TargetYear { get; set; }

    public User User { get; set; } = null!;
}

public class TodoTask : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "Medium"; // High, Medium, Low
    public DateOnly? DueDate { get; set; }
    public TimeOnly? DueTime { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAtUtc { get; set; }
    public bool IsPinnedToDashboard { get; set; } = false;
    public string Recurrence { get; set; } = "None"; // None, Daily, Weekly, Monthly
    public Guid? GoalId { get; set; }
    public int OrderIndex { get; set; } = 0;

    public User User { get; set; } = null!;
    public ICollection<TaskSubtask> Subtasks { get; set; } = new List<TaskSubtask>();
}

public class TaskSubtask : AuditableEntity
{
    public Guid TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; } = false;
    public int OrderIndex { get; set; } = 0;

    public TodoTask Task { get; set; } = null!;
}

