using Dayform.Application.DTOs.Planner;

namespace Dayform.Application.Interfaces;

public interface IPlannerService
{
    Task<IReadOnlyList<ReminderDto>> GetRemindersAsync(Guid userId, bool activeOnly, CancellationToken ct = default);
    Task<ReminderDto> GetReminderByIdAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<ReminderDto> CreateReminderAsync(Guid userId, CreateReminderRequest request, CancellationToken ct = default);
    Task<ReminderDto> UpdateReminderAsync(Guid userId, Guid id, UpdateReminderRequest request, CancellationToken ct = default);
    Task DeleteReminderAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<PlannerCalendarDto> GetCalendarAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default);
}

