namespace Dayform.Application.DTOs.PersonalDevelopment;

public record MoodLogDto(
    Guid Id,
    DateOnly LogDate,
    int MoodScore,
    int EnergyScore,
    int StressScore,
    string? Gratitude,
    string? Reflection,
    string? LessonsLearned,
    string? Notes,
    DateTime CreatedAtUtc
);

public record UpsertMoodLogRequest(
    DateOnly LogDate,
    int MoodScore,
    int EnergyScore,
    int StressScore,
    string? Gratitude,
    string? Reflection,
    string? LessonsLearned,
    string? Notes
);

public record BadHabitDto(
    Guid Id,
    string Name,
    string? Trigger,
    string? ReplacementHabit,
    DateOnly CleanDaysStartDate,
    int CleanStreakDays,
    int RelapseCount,
    bool IsActive,
    DateTime CreatedAtUtc
);

public record CreateBadHabitRequest(
    string Name,
    string? Trigger,
    string? ReplacementHabit,
    DateOnly CleanDaysStartDate
);

public record StrengthWeaknessDto(
    Guid Id,
    string Type,
    string Title,
    string? Description,
    string? ActionPlan,
    DateTime CreatedAtUtc
);

public record CreateStrengthWeaknessRequest(
    string Type,
    string Title,
    string? Description,
    string? ActionPlan
);

