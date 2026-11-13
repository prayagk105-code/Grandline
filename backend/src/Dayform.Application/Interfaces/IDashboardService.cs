using Dayform.Application.DTOs.Dashboard;
using Dayform.Application.DTOs.Memories;

namespace Dayform.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(Guid userId, DateOnly? clientDate, CancellationToken ct = default);
    Task<IReadOnlyList<WeeklyActivityDayDto>> GetWeeklyActivityAsync(Guid userId, DateOnly? clientDate, CancellationToken ct = default);
    Task<IReadOnlyList<MemoryDto>> GetRecentMemoriesAsync(Guid userId, int limit = 5, CancellationToken ct = default);
}

