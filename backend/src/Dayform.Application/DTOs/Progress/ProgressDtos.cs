namespace Dayform.Application.DTOs.Progress;

public class ProgressSummaryDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public double HabitAveragePercent { get; set; }
    public double? PreviousPeriodHabitAveragePercent { get; set; }
    public double? HabitTrendDeltaPoints { get; set; }
    public int StudyMinutes { get; set; }
    public int StudySessionsCount { get; set; }
    public int MemoriesCount { get; set; }
    public IReadOnlyList<ProgressInsightDto> Insights { get; set; } = Array.Empty<ProgressInsightDto>();
    public JourneyProgressDto Journey { get; set; } = new();
}

public class ProgressHabitPointDto
{
    public string Label { get; set; } = string.Empty;
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public double CompletionPercent { get; set; }
}

public class ProgressHabitAnalyticsDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public string Granularity { get; set; } = "day";
    public IReadOnlyList<ProgressHabitPointDto> Points { get; set; } = Array.Empty<ProgressHabitPointDto>();
}

public class ProgressStudyPointDto
{
    public string Label { get; set; } = string.Empty;
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public int Minutes { get; set; }
    public int Sessions { get; set; }
}

public class ProgressStudyAnalyticsDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public int TotalMinutes { get; set; }
    public int TotalSessions { get; set; }
    public string? BestWeekday { get; set; }
    public IReadOnlyList<ProgressStudyPointDto> Points { get; set; } = Array.Empty<ProgressStudyPointDto>();
}

public class MonthlySummaryDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string MonthLabel { get; set; } = string.Empty;
    public double HabitCompletionPercent { get; set; }
    public int StudyMinutes { get; set; }
    public int StudySessions { get; set; }
    public int MemoriesCount { get; set; }
}

public class ProgressInsightDto
{
    public string Icon { get; set; } = "chart";
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class JourneyProgressDto
{
    public DateOnly JourneyStartDate { get; set; }
    public int CurrentDay { get; set; }
    public int TotalDays { get; set; } = 180;
    public int RemainingDays { get; set; }
    public double PercentComplete { get; set; }
    public string PhaseName { get; set; } = "Foundation";
    public int TotalPhases { get; set; } = 3;
}

