using Dayform.Application.DTOs.Progress;

namespace Dayform.Application.Interfaces;

public interface IProgressService
{
    Task<ProgressSummaryDto> GetSummaryAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<ProgressHabitAnalyticsDto> GetHabitAnalyticsAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<ProgressStudyAnalyticsDto> GetStudyAnalyticsAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<IReadOnlyList<MonthlySummaryDto>> GetMonthlySummaryAsync(Guid userId, int months, DateOnly? clientDate, CancellationToken ct = default);
}

