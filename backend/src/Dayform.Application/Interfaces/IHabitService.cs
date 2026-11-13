using Dayform.Application.DTOs.Habits;

namespace Dayform.Application.Interfaces;

public interface IHabitService
{
    Task<IReadOnlyList<HabitDto>> GetHabitsAsync(Guid userId, string? category, bool includeArchived, DateOnly? date, CancellationToken ct = default);
    Task<HabitDto> GetHabitByIdAsync(Guid userId, Guid habitId, DateOnly? date, CancellationToken ct = default);
    Task<HabitDto> CreateHabitAsync(Guid userId, CreateHabitRequest request, CancellationToken ct = default);
    Task<HabitDto> UpdateHabitAsync(Guid userId, Guid habitId, UpdateHabitRequest request, CancellationToken ct = default);
    Task DeleteHabitAsync(Guid userId, Guid habitId, CancellationToken ct = default);
    Task<IReadOnlyList<HabitLogDto>> GetHabitLogsAsync(Guid userId, Guid habitId, DateOnly? from, DateOnly? to, CancellationToken ct = default);
    Task<HabitLogDto> SetHabitLogAsync(Guid userId, Guid habitId, DateOnly logDate, bool isCompleted, CancellationToken ct = default);
    Task<HabitSummaryDto> GetSummaryAsync(Guid userId, DateOnly? clientDate, CancellationToken ct = default);
    Task<IReadOnlyList<HabitHeatmapDayDto>> GetHeatmapAsync(Guid userId, int weeks, DateOnly? clientDate, CancellationToken ct = default);
}

