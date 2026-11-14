namespace Dayform.Application.DTOs.Goals;

public record GoalDto(
    Guid Id,
    string Title,
    string? Description,
    string Category,
    string Timeframe,
    DateOnly StartDate,
    DateOnly TargetDate,
    int ProgressPercentage,
    string Status,
    Guid? ConnectedHabitId,
    IReadOnlyList<GoalMilestoneDto> Milestones,
    IReadOnlyList<GoalActionStepDto> ActionSteps,
    DateTime CreatedAtUtc
);

public record GoalMilestoneDto(
    Guid Id,
    Guid GoalId,
    string Title,
    DateOnly? TargetDate,
    bool IsCompleted,
    DateTime? CompletedAtUtc
);

public record GoalActionStepDto(
    Guid Id,
    Guid GoalId,
    string Title,
    bool IsCompleted,
    int OrderIndex
);

public record CreateGoalRequest(
    string Title,
    string? Description,
    string Category,
    string Timeframe,
    DateOnly StartDate,
    DateOnly TargetDate,
    Guid? ConnectedHabitId,
    List<string>? Milestones,
    List<string>? ActionSteps
);

public record UpdateGoalRequest(
    string Title,
    string? Description,
    string Category,
    string Timeframe,
    DateOnly StartDate,
    DateOnly TargetDate,
    int ProgressPercentage,
    string Status,
    Guid? ConnectedHabitId
);

public record VisionBoardItemDto(
    Guid Id,
    string Title,
    string? ImageUrl,
    string? Quote,
    string Category,
    int? TargetYear,
    DateTime CreatedAtUtc
);

public record CreateVisionBoardItemRequest(
    string Title,
    string? ImageUrl,
    string? Quote,
    string Category,
    int? TargetYear
);

