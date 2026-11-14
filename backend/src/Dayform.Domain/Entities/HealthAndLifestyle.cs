using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class HealthDailyLog : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly LogDate { get; set; }
    public decimal SleepHours { get; set; } = 0;
    public string? SleepBedtime { get; set; }
    public string? SleepWakeTime { get; set; }
    public int SleepQuality { get; set; } = 3; // 1 to 5
    public int WaterIntakeMl { get; set; } = 0;
    public decimal? WeightKg { get; set; }
    public int StepsCount { get; set; } = 0;
    public decimal? WalkingDistanceKm { get; set; }
    public string? BodyMeasurementsJson { get; set; }
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
}

public class WorkoutLog : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly WorkoutDate { get; set; }
    public string ActivityType { get; set; } = "Cardio"; // Cardio, Strength, Yoga, Sports, Walk, Other
    public int DurationMinutes { get; set; } = 30;
    public string Intensity { get; set; } = "Medium"; // Low, Medium, High
    public int? CaloriesBurned { get; set; }
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
}

public class MealLog : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly MealDate { get; set; }
    public string MealType { get; set; } = "Lunch"; // Breakfast, Lunch, Dinner, Snack
    public string Description { get; set; } = string.Empty;
    public int HealthyRating { get; set; } = 3; // 1 to 5
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
}

