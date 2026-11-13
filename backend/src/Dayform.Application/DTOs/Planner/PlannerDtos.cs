using Dayform.Application.DTOs.Memories;
using Dayform.Application.DTOs.Study;
using Dayform.Domain.Enums;

namespace Dayform.Application.DTOs.Planner;

public class CreateReminderRequest
{
    public string Title { get; set; } = string.Empty;
    public DateOnly ReminderDate { get; set; }
    public TimeOnly? ReminderTime { get; set; }
    public RepeatFrequency RepeatFrequency { get; set; } = RepeatFrequency.Never;
}

public class UpdateReminderRequest
{
    public string Title { get; set; } = string.Empty;
    public DateOnly ReminderDate { get; set; }
    public TimeOnly? ReminderTime { get; set; }
    public RepeatFrequency RepeatFrequency { get; set; } = RepeatFrequency.Never;
    public bool IsActive { get; set; } = true;
}

public class ReminderDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly ReminderDate { get; set; }
    public TimeOnly? ReminderTime { get; set; }
    public RepeatFrequency RepeatFrequency { get; set; }
    public bool IsActive { get; set; }
}

public class ReminderOccurrenceDto
{
    public Guid ReminderId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly OccurrenceDate { get; set; }
    public TimeOnly? ReminderTime { get; set; }
    public RepeatFrequency RepeatFrequency { get; set; }
    public bool IsRecurringInstance { get; set; }
}

public class PlannerDayDto
{
    public DateOnly Date { get; set; }
    public double HabitCompletionPercent { get; set; }
    public int HabitIntensityLevel { get; set; }
    public int StudyMinutes { get; set; }
    public int StudySessionCount { get; set; }
    public IReadOnlyList<ReminderOccurrenceDto> Reminders { get; set; } = Array.Empty<ReminderOccurrenceDto>();
    public IReadOnlyList<StudySessionDto> StudySessions { get; set; } = Array.Empty<StudySessionDto>();
    public IReadOnlyList<MemoryDto> Memories { get; set; } = Array.Empty<MemoryDto>();
}

public class PlannerCalendarDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public IReadOnlyList<PlannerDayDto> Days { get; set; } = Array.Empty<PlannerDayDto>();
}

