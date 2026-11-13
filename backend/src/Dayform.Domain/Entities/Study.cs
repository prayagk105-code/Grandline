using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class LearningPath : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Icon { get; set; } = "book";
    public int? TargetMinutes { get; set; }
    public int Progress { get; set; }
    public bool IsArchived { get; set; }

    public User User { get; set; } = null!;
    public ICollection<StudySession> StudySessions { get; set; } = new List<StudySession>();
}

public class StudySession : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid? LearningPathId { get; set; }
    public string Topic { get; set; } = string.Empty;
    public int Minutes { get; set; }
    public DateOnly SessionDate { get; set; }
    public string? Notes { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? ClientSessionKey { get; set; }

    public User User { get; set; } = null!;
    public LearningPath? LearningPath { get; set; }
}

