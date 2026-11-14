namespace Dayform.Application.DTOs.Focus;

public record FocusSessionDto(
    Guid Id,
    DateOnly SessionDate,
    string SessionType,
    int DurationMinutes,
    int DistractionCount,
    string? DistractionNotes,
    string? Notes,
    DateTime CompletedAtUtc
);

public record CreateFocusSessionRequest(
    DateOnly SessionDate,
    string SessionType,
    int DurationMinutes,
    int DistractionCount,
    string? DistractionNotes,
    string? Notes
);

public record ScreenTimeLogDto(
    Guid Id,
    DateOnly LogDate,
    string Category,
    int DurationMinutes,
    string? Notes,
    DateTime CreatedAtUtc
);

public record CreateScreenTimeLogRequest(
    DateOnly LogDate,
    string Category,
    int DurationMinutes,
    string? Notes
);

public record FocusSummaryDto(
    int DailyTargetMinutes,
    int TodayFocusMinutes,
    int WeekFocusMinutes,
    int TotalSessionsCount,
    int DeepWorkMinutes,
    int TotalDistractions,
    IReadOnlyList<FocusSessionDto> RecentSessions
);

