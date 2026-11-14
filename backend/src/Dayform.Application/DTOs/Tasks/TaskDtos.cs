namespace Dayform.Application.DTOs.Tasks;

public record TaskDto(
    Guid Id,
    string Title,
    string? Description,
    string Priority,
    DateOnly? DueDate,
    string? DueTime,
    bool IsCompleted,
    DateTime? CompletedAtUtc,
    bool IsPinnedToDashboard,
    string Recurrence,
    Guid? GoalId,
    int OrderIndex,
    IReadOnlyList<TaskSubtaskDto> Subtasks,
    DateTime CreatedAtUtc
);

public record TaskSubtaskDto(
    Guid Id,
    Guid TaskId,
    string Title,
    bool IsCompleted,
    int OrderIndex
);

public record CreateTaskRequest(
    string Title,
    string? Description,
    string Priority,
    DateOnly? DueDate,
    string? DueTime,
    bool IsPinnedToDashboard,
    string Recurrence,
    Guid? GoalId,
    List<string>? Subtasks
);

public record UpdateTaskRequest(
    string Title,
    string? Description,
    string Priority,
    DateOnly? DueDate,
    string? DueTime,
    bool IsCompleted,
    bool IsPinnedToDashboard,
    string Recurrence,
    Guid? GoalId
);

