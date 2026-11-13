namespace Dayform.Application.DTOs.Study;

public class CreateLearningPathRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "book";
    public int? TargetMinutes { get; set; }
    public int Progress { get; set; }
}

public class UpdateLearningPathRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "book";
    public int? TargetMinutes { get; set; }
    public int Progress { get; set; }
    public bool IsArchived { get; set; }
}

public class LearningPathDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "book";
    public int? TargetMinutes { get; set; }
    public int Progress { get; set; }
    public bool IsArchived { get; set; }
    public int TotalMinutesLogged { get; set; }
    public int SessionCount { get; set; }
    public DateOnly? LastSessionDate { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateStudySessionRequest
{
    public Guid? LearningPathId { get; set; }
    public string Topic { get; set; } = string.Empty;
    public int Minutes { get; set; }
    public DateOnly SessionDate { get; set; }
    public string? Notes { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? ClientSessionKey { get; set; }
}

public class UpdateStudySessionRequest
{
    public Guid? LearningPathId { get; set; }
    public string Topic { get; set; } = string.Empty;
    public int Minutes { get; set; }
    public DateOnly SessionDate { get; set; }
    public string? Notes { get; set; }
}

public class StudySessionDto
{
    public Guid Id { get; set; }
    public Guid? LearningPathId { get; set; }
    public string LearningPathName { get; set; } = "General study";
    public string Topic { get; set; } = string.Empty;
    public int Minutes { get; set; }
    public DateOnly SessionDate { get; set; }
    public string? Notes { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class StudySummaryDto
{
    public int TotalMinutesAllTime { get; set; }
    public int TotalSessionsAllTime { get; set; }
    public int MinutesThisWeek { get; set; }
}

