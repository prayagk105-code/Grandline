using Dayform.Application.DTOs.Habits;
using Dayform.Application.DTOs.Memories;

namespace Dayform.Application.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public DateOnly TodayDate { get; set; }
    public int JourneyDay { get; set; }
    public int JourneyTotalDays { get; set; } = 180;
    public int CompletedHabitsToday { get; set; }
    public int TotalActiveHabits { get; set; }
    public int CompletionPercentToday { get; set; }
    public string? NextIncompleteHabitName { get; set; }
    public int CurrentStreakDays { get; set; }
    public int BestStreakDays { get; set; }
    public int FocusMinutesLast7Days { get; set; }
    public double HabitAverageLast7Days { get; set; }
    public IReadOnlyList<WeeklyActivityDayDto> Last7Days { get; set; } = Array.Empty<WeeklyActivityDayDto>();
    public IReadOnlyList<HabitDto> TodayHabits { get; set; } = Array.Empty<HabitDto>();
    public IReadOnlyList<MemoryDto> RecentMemories { get; set; } = Array.Empty<MemoryDto>();
}

public class WeeklyActivityDayDto
{
    public DateOnly Date { get; set; }
    public string WeekdayShort { get; set; } = string.Empty;
    public int CompletedCount { get; set; }
    public int TotalCount { get; set; }
    public double CompletionPercent { get; set; }
    public int StudyMinutes { get; set; }
}

