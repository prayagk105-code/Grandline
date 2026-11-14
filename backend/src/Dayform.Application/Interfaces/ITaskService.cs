using Dayform.Application.DTOs.Tasks;

namespace Dayform.Application.Interfaces;

public interface ITaskService
{
    Task<IReadOnlyList<TaskDto>> GetTasksAsync(Guid userId, DateOnly? date = null, string? priority = null, bool? isCompleted = null, bool? isPinned = null, CancellationToken ct = default);
    Task<TaskDto> GetTaskByIdAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken ct = default);
    Task<TaskDto> UpdateTaskAsync(Guid userId, Guid id, UpdateTaskRequest request, CancellationToken ct = default);
    Task DeleteTaskAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<TaskDto> ToggleTaskCompletionAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<TaskSubtaskDto> ToggleSubtaskAsync(Guid userId, Guid taskId, Guid subtaskId, CancellationToken ct = default);
}

