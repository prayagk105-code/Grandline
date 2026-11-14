using Dayform.Application.DTOs.PersonalDevelopment;

namespace Dayform.Application.Interfaces;

public interface IPersonalDevelopmentService
{
    Task<IReadOnlyList<MoodLogDto>> GetMoodLogsAsync(Guid userId, int limit = 30, CancellationToken ct = default);
    Task<MoodLogDto?> GetMoodLogByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default);
    Task<MoodLogDto> UpsertMoodLogAsync(Guid userId, UpsertMoodLogRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<BadHabitDto>> GetBadHabitsAsync(Guid userId, CancellationToken ct = default);
    Task<BadHabitDto> CreateBadHabitAsync(Guid userId, CreateBadHabitRequest request, CancellationToken ct = default);
    Task<BadHabitDto> LogBadHabitRelapseAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task DeleteBadHabitAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<StrengthWeaknessDto>> GetStrengthsWeaknessesAsync(Guid userId, string? type = null, CancellationToken ct = default);
    Task<StrengthWeaknessDto> CreateStrengthWeaknessAsync(Guid userId, CreateStrengthWeaknessRequest request, CancellationToken ct = default);
    Task DeleteStrengthWeaknessAsync(Guid userId, Guid id, CancellationToken ct = default);
}

