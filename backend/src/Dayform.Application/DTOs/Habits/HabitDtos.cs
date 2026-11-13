namespace Dayform.Application.DTOs.Habits;

public class CreateHabitRequest
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Health";
    public string? Target { get; set; }
    public string Icon { get; set; } = "sun";
    public string? Color { get; set; }
}

public class UpdateHabitRequest
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Health";
    public string? Target { get; set; }
    public string Icon { get; set; } = "sun";
    public string? Color { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ToggleHabitLogRequest
{
    public bool IsCompleted { get; set; }
}

public class HabitDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Target { get; set; }
    public string Icon { get; set; } = "sun";
    public string? Color { get; set; }
    public bool IsActive { get; set; }
    public bool CompletedToday { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class HabitLogDto
{
    public Guid Id { get; set; }
    public Guid HabitId { get; set; }
    public DateOnly LogDate { get; set; }
    public bool IsCompleted { get; set; }
}

public class HabitSummaryDto
{
    public double WeeklyAveragePercent { get; set; }
    public int CurrentStreakDays { get; set; }
    public int BestStreakDays { get; set; }
    public int ActiveCount { get; set; }
}

public class HabitHeatmapDayDto
{
    public DateOnly Date { get; set; }
    public int CompletedCount { get; set; }
    public int TotalActiveCount { get; set; }
    public double CompletionPercent { get; set; }
    public int IntensityLevel { get; set; } // 0..4
}

