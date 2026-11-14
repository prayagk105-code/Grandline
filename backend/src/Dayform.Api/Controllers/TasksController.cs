using Dayform.Application.Common;
using Dayform.Application.DTOs.Tasks;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tasks")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ICurrentUserService _currentUser;

    public TasksController(ITaskService taskService, ICurrentUserService currentUser)
    {
        _taskService = taskService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<TaskDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTasks(
        [FromQuery] DateOnly? date,
        [FromQuery] string? priority,
        [FromQuery] bool? isCompleted,
        [FromQuery] bool? isPinned,
        CancellationToken ct)
    {
        var data = await _taskService.GetTasksAsync(_currentUser.UserId, date, priority, isCompleted, isPinned, ct);
        return Ok(ApiResponse<IReadOnlyList<TaskDto>>.Ok(data));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTask(Guid id, CancellationToken ct)
    {
        var data = await _taskService.GetTaskByIdAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<TaskDto>.Ok(data));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request, CancellationToken ct)
    {
        var data = await _taskService.CreateTaskAsync(_currentUser.UserId, request, ct);
        return CreatedAtAction(nameof(GetTask), new { id = data.Id }, ApiResponse<TaskDto>.Ok(data, "Task created."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskRequest request, CancellationToken ct)
    {
        var data = await _taskService.UpdateTaskAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<TaskDto>.Ok(data, "Task updated."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteTask(Guid id, CancellationToken ct)
    {
        await _taskService.DeleteTaskAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/toggle")]
    [ProducesResponseType(typeof(ApiResponse<TaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleTask(Guid id, CancellationToken ct)
    {
        var data = await _taskService.ToggleTaskCompletionAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<TaskDto>.Ok(data));
    }

    [HttpPost("{taskId:guid}/subtasks/{subtaskId:guid}/toggle")]
    [ProducesResponseType(typeof(ApiResponse<TaskSubtaskDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleSubtask(Guid taskId, Guid subtaskId, CancellationToken ct)
    {
        var data = await _taskService.ToggleSubtaskAsync(_currentUser.UserId, taskId, subtaskId, ct);
        return Ok(ApiResponse<TaskSubtaskDto>.Ok(data));
    }
}

