namespace Dayform.Application.DTOs.Health;

public record HealthDailyLogDto(
    Guid Id,
    DateOnly LogDate,
    decimal SleepHours,
    string? SleepBedtime,
    string? SleepWakeTime,
    int SleepQuality,
    int WaterIntakeMl,
    decimal? WeightKg,
    int StepsCount,
    decimal? WalkingDistanceKm,
    string? BodyMeasurementsJson,
    string? Notes,
    DateTime CreatedAtUtc
);

public record UpsertHealthDailyLogRequest(
    DateOnly LogDate,
    decimal SleepHours,
    string? SleepBedtime,
    string? SleepWakeTime,
    int SleepQuality,
    int WaterIntakeMl,
    decimal? WeightKg,
    int StepsCount,
    decimal? WalkingDistanceKm,
    string? BodyMeasurementsJson,
    string? Notes
);

public record WorkoutLogDto(
    Guid Id,
    DateOnly WorkoutDate,
    string ActivityType,
    int DurationMinutes,
    string Intensity,
    int? CaloriesBurned,
    string? Notes,
    DateTime CreatedAtUtc
);

public record CreateWorkoutLogRequest(
    DateOnly WorkoutDate,
    string ActivityType,
    int DurationMinutes,
    string Intensity,
    int? CaloriesBurned,
    string? Notes
);

public record MealLogDto(
    Guid Id,
    DateOnly MealDate,
    string MealType,
    string Description,
    int HealthyRating,
    string? Notes,
    DateTime CreatedAtUtc
);

public record CreateMealLogRequest(
    DateOnly MealDate,
    string MealType,
    string Description,
    int HealthyRating,
    string? Notes
);

public record HealthSummaryDto(
    decimal AvgSleepHours,
    int AvgWaterIntakeMl,
    int AvgSteps,
    int WorkoutsThisWeek,
    decimal? LatestWeightKg,
    IReadOnlyList<HealthDailyLogDto> RecentLogs
);

