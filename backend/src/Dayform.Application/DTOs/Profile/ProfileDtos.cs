using Dayform.Application.DTOs.Habits;
using Dayform.Application.DTOs.Journal;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.DTOs.Planner;
using Dayform.Application.DTOs.Study;
using Dayform.Domain.Enums;

namespace Dayform.Application.DTOs.Profile;

public class UpdateProfileRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public ThemePreference ThemePreference { get; set; } = ThemePreference.Auto;
    public string TimeZoneId { get; set; } = "UTC";
    public DateOnly? JourneyStartDate { get; set; }
    public string? DashboardConfigJson { get; set; }
    public int? DailyFocusTargetMinutes { get; set; }
}

public class ProfileDto
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public ThemePreference ThemePreference { get; set; }
    public DateOnly JourneyStartDate { get; set; }
    public string TimeZoneId { get; set; } = "UTC";
    public bool IsDemoUser { get; set; }
    public bool HasAppPin { get; set; }
    public string? DashboardConfigJson { get; set; }
    public int DailyFocusTargetMinutes { get; set; } = 120;
    public DateTime CreatedAtUtc { get; set; }
}

public class SetPinRequest
{
    public string? Pin { get; set; } // 4-digit PIN or empty/null to remove
}

public class VerifyPinRequest
{
    public string Pin { get; set; } = string.Empty;
}

public class UserExportDto
{
    public DateTime ExportedAtUtc { get; set; }
    public ProfileDto Profile { get; set; } = null!;
    public IReadOnlyList<HabitDto> Habits { get; set; } = Array.Empty<HabitDto>();
    public IReadOnlyList<HabitLogDto> HabitLogs { get; set; } = Array.Empty<HabitLogDto>();
    public IReadOnlyList<LearningPathDto> LearningPaths { get; set; } = Array.Empty<LearningPathDto>();
    public IReadOnlyList<StudySessionDto> StudySessions { get; set; } = Array.Empty<StudySessionDto>();
    public IReadOnlyList<MemoryDto> Memories { get; set; } = Array.Empty<MemoryDto>();
    public IReadOnlyList<JournalEntryDto> JournalEntries { get; set; } = Array.Empty<JournalEntryDto>();
    public IReadOnlyList<ReminderDto> Reminders { get; set; } = Array.Empty<ReminderDto>();
}
