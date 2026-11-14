using Dayform.Application.DTOs.Health;

namespace Dayform.Application.Interfaces;

public interface IHealthService
{
    Task<IReadOnlyList<HealthDailyLogDto>> GetDailyLogsAsync(Guid userId, int limit = 30, CancellationToken ct = default);
    Task<HealthDailyLogDto?> GetDailyLogByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default);
    Task<HealthDailyLogDto> UpsertDailyLogAsync(Guid userId, UpsertHealthDailyLogRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<WorkoutLogDto>> GetWorkoutLogsAsync(Guid userId, int limit = 30, CancellationToken ct = default);
    Task<WorkoutLogDto> CreateWorkoutLogAsync(Guid userId, CreateWorkoutLogRequest request, CancellationToken ct = default);
    Task DeleteWorkoutLogAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<MealLogDto>> GetMealLogsAsync(Guid userId, DateOnly? date = null, CancellationToken ct = default);
    Task<MealLogDto> CreateMealLogAsync(Guid userId, CreateMealLogRequest request, CancellationToken ct = default);
    Task DeleteMealLogAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<HealthSummaryDto> GetHealthSummaryAsync(Guid userId, CancellationToken ct = default);
}

