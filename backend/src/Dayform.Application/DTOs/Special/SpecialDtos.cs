namespace Dayform.Application.DTOs.Special;

public record LifeTimelineEventDto(
    Guid Id,
    DateOnly EventDate,
    string Title,
    string? Description,
    string Category,
    string? ImageUrl,
    int SignificanceLevel,
    DateTime CreatedAtUtc
);

public record CreateTimelineEventRequest(
    DateOnly EventDate,
    string Title,
    string? Description,
    string Category,
    string? ImageUrl,
    int SignificanceLevel
);

public record FutureLetterDto(
    Guid Id,
    string Title,
    string Content,
    DateOnly WrittenDate,
    DateOnly UnlockDate,
    bool IsUnlocked,
    bool IsRead,
    DateTime CreatedAtUtc
);

public record CreateFutureLetterRequest(
    string Title,
    string Content,
    DateOnly UnlockDate
);

public record NinetyDayChallengeDto(
    Guid Id,
    string Title,
    string? Description,
    DateOnly StartDate,
    DateOnly EndDate,
    string DailyAction,
    string Status,
    int DaysCompleted,
    int TotalDays,
    int ProgressPercent,
    IReadOnlyList<NinetyDayChallengeLogDto> DayLogs,
    DateTime CreatedAtUtc
);

public record NinetyDayChallengeLogDto(
    Guid Id,
    Guid ChallengeId,
    int DayNumber,
    DateOnly LogDate,
    bool IsCompleted,
    string? Notes
);

public record CreateNinetyDayChallengeRequest(
    string Title,
    string? Description,
    DateOnly StartDate,
    string DailyAction
);

public record LogChallengeDayRequest(
    int DayNumber,
    DateOnly LogDate,
    bool IsCompleted,
    string? Notes
);

public record PersonalRuleDto(
    Guid Id,
    string RuleText,
    string Category,
    bool IsActive,
    int CurrentStreak,
    int BestStreak,
    bool CompliedToday,
    DateTime CreatedAtUtc
);

public record CreatePersonalRuleRequest(
    string RuleText,
    string Category
);

public record LogRuleComplianceRequest(
    DateOnly LogDate,
    bool Complied
);

public record DigitalDetoxDto(
    Guid Id,
    string Title,
    string DistractingApps,
    DateOnly StartDate,
    DateOnly EndDate,
    bool IsActive,
    int CleanDaysCount,
    DateTime CreatedAtUtc
);

public record CreateDigitalDetoxRequest(
    string Title,
    string DistractingApps,
    DateOnly StartDate,
    DateOnly EndDate
);

public record MonthlyReflectionDto(
    Guid Id,
    int Year,
    int Month,
    string? Expectations,
    string? Achievements,
    string? BiggestImprovements,
    string? ChallengesFaced,
    string? LessonsLearned,
    string? NextMonthPriorities,
    DateTime CreatedAtUtc
);

public record UpsertMonthlyReflectionRequest(
    int Year,
    int Month,
    string? Expectations,
    string? Achievements,
    string? BiggestImprovements,
    string? ChallengesFaced,
    string? LessonsLearned,
    string? NextMonthPriorities
);

public record DisciplineScoreDto(
    int OverallScore, // 0-100
    int HabitScore,
    int TaskScore,
    int FocusScore,
    string RatingTitle,
    string Description,
    IReadOnlyList<string> FactorBreakdowns
);

