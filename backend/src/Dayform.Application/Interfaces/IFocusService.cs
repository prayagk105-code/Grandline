using Dayform.Application.DTOs.Focus;

namespace Dayform.Application.Interfaces;

public interface IFocusService
{
    Task<IReadOnlyList<FocusSessionDto>> GetFocusSessionsAsync(Guid userId, DateOnly? date = null, int limit = 50, CancellationToken ct = default);
    Task<FocusSessionDto> CreateFocusSessionAsync(Guid userId, CreateFocusSessionRequest request, CancellationToken ct = default);
    Task<FocusSummaryDto> GetFocusSummaryAsync(Guid userId, CancellationToken ct = default);

    Task<IReadOnlyList<ScreenTimeLogDto>> GetScreenTimeLogsAsync(Guid userId, DateOnly? date = null, CancellationToken ct = default);
    Task<ScreenTimeLogDto> CreateScreenTimeLogAsync(Guid userId, CreateScreenTimeLogRequest request, CancellationToken ct = default);
}

