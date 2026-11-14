using Dayform.Application.Common;
using Dayform.Application.DTOs.Tasks;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class TasksService : ITaskService
{
    private readonly IDayformDbContext _db;

    public TasksService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<TaskDto>> GetTasksAsync(
        Guid userId,
        DateOnly? date = null,
        string? priority = null,
        bool? isCompleted = null,
        bool? isPinned = null,
        CancellationToken ct = default)
    {
        var query = _db.Tasks.AsNoTracking()
            .Include(t => t.Subtasks)
            .Where(t => t.UserId == userId);

        if (date.HasValue)
            query = query.Where(t => t.DueDate == date.Value);

        if (!string.IsNullOrWhiteSpace(priority) && !priority.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(t => t.Priority == priority);

        if (isCompleted.HasValue)
            query = query.Where(t => t.IsCompleted == isCompleted.Value);

        if (isPinned.HasValue)
            query = query.Where(t => t.IsPinnedToDashboard == isPinned.Value);

        var list = await query
            .OrderBy(t => t.IsCompleted)
            .ThenByDescending(t => t.Priority == "High")
            .ThenByDescending(t => t.Priority == "Medium")
            .ThenBy(t => t.DueDate)
            .ThenBy(t => t.OrderIndex)
            .ToListAsync(ct);

        return list.Select(MapToDto).ToList();
    }

    public async Task<TaskDto> GetTaskByIdAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var task = await _db.Tasks.AsNoTracking()
            .Include(t => t.Subtasks)
            .FirstOrDefaultAsync(t => t.UserId == userId && t.Id == id, ct);

        if (task == null)
            throw new NotFoundAppException("Task not found.");

        return MapToDto(task);
    }

    public async Task<TaskDto> CreateTaskAsync(Guid userId, CreateTaskRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Task title is required.");

        TimeOnly? dueTime = null;
        if (!string.IsNullOrWhiteSpace(request.DueTime) && TimeOnly.TryParse(request.DueTime, out var dt))
        {
            dueTime = dt;
        }

        var task = new TodoTask
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? "Medium" : request.Priority.Trim(),
            DueDate = request.DueDate,
            DueTime = dueTime,
            IsPinnedToDashboard = request.IsPinnedToDashboard,
            Recurrence = string.IsNullOrWhiteSpace(request.Recurrence) ? "None" : request.Recurrence.Trim(),
            GoalId = request.GoalId
        };

        if (request.Subtasks != null && request.Subtasks.Count > 0)
        {
            int idx = 0;
            foreach (var st in request.Subtasks)
            {
                if (!string.IsNullOrWhiteSpace(st))
                {
                    task.Subtasks.Add(new TaskSubtask
                    {
                        TaskId = task.Id,
                        Title = st.Trim(),
                        OrderIndex = idx++
                    });
                }
            }
        }

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync(ct);

        return MapToDto(task);
    }

    public async Task<TaskDto> UpdateTaskAsync(Guid userId, Guid id, UpdateTaskRequest request, CancellationToken ct = default)
    {
        var task = await _db.Tasks
            .Include(t => t.Subtasks)
            .FirstOrDefaultAsync(t => t.UserId == userId && t.Id == id, ct);

        if (task == null)
            throw new NotFoundAppException("Task not found.");

        TimeOnly? dueTime = null;
        if (!string.IsNullOrWhiteSpace(request.DueTime) && TimeOnly.TryParse(request.DueTime, out var dt))
        {
            dueTime = dt;
        }

        task.Title = request.Title.Trim();
        task.Description = request.Description?.Trim();
        task.Priority = request.Priority.Trim();
        task.DueDate = request.DueDate;
        task.DueTime = dueTime;
        task.IsCompleted = request.IsCompleted;
        task.CompletedAtUtc = request.IsCompleted ? (task.CompletedAtUtc ?? DateTime.UtcNow) : null;
        task.IsPinnedToDashboard = request.IsPinnedToDashboard;
        task.Recurrence = request.Recurrence.Trim();
        task.GoalId = request.GoalId;

        await _db.SaveChangesAsync(ct);
        return MapToDto(task);
    }

    public async Task DeleteTaskAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.UserId == userId && t.Id == id, ct);
        if (task == null)
            throw new NotFoundAppException("Task not found.");

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<TaskDto> ToggleTaskCompletionAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var task = await _db.Tasks
            .Include(t => t.Subtasks)
            .FirstOrDefaultAsync(t => t.UserId == userId && t.Id == id, ct);

        if (task == null)
            throw new NotFoundAppException("Task not found.");

        task.IsCompleted = !task.IsCompleted;
        task.CompletedAtUtc = task.IsCompleted ? DateTime.UtcNow : null;

        await _db.SaveChangesAsync(ct);
        return MapToDto(task);
    }

    public async Task<TaskSubtaskDto> ToggleSubtaskAsync(Guid userId, Guid taskId, Guid subtaskId, CancellationToken ct = default)
    {
        var subtask = await _db.TaskSubtasks
            .Include(s => s.Task)
            .FirstOrDefaultAsync(s => s.Id == subtaskId && s.TaskId == taskId && s.Task.UserId == userId, ct);

        if (subtask == null)
            throw new NotFoundAppException("Subtask not found.");

        subtask.IsCompleted = !subtask.IsCompleted;
        await _db.SaveChangesAsync(ct);

        return new TaskSubtaskDto(subtask.Id, subtask.TaskId, subtask.Title, subtask.IsCompleted, subtask.OrderIndex);
    }

    private static TaskDto MapToDto(TodoTask t)
    {
        return new TaskDto(
            t.Id,
            t.Title,
            t.Description,
            t.Priority,
            t.DueDate,
            t.DueTime?.ToString("HH:mm"),
            t.IsCompleted,
            t.CompletedAtUtc,
            t.IsPinnedToDashboard,
            t.Recurrence,
            t.GoalId,
            t.OrderIndex,
            t.Subtasks.OrderBy(s => s.OrderIndex).Select(s => new TaskSubtaskDto(s.Id, s.TaskId, s.Title, s.IsCompleted, s.OrderIndex)).ToList(),
            t.CreatedAtUtc
        );
    }
}

