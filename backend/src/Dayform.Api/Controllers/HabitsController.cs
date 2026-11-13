using Dayform.Application.Common;
using Dayform.Application.DTOs.Habits;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/habits")]
public class HabitsController : ControllerBase
{
    private readonly IHabitService _habitService;
    private readonly ICurrentUserService _currentUser;

    public HabitsController(IHabitService habitService, ICurrentUserService currentUser)
    {
        _habitService = habitService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<HabitDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHabits([FromQuery] string? category, [FromQuery] bool includeArchived = false, [FromQuery] DateOnly? date = null, CancellationToken ct = default)
    {
        var data = await _habitService.GetHabitsAsync(_currentUser.UserId, category, includeArchived, date, ct);
        return Ok(ApiResponse<IReadOnlyList<HabitDto>>.Ok(data));
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<HabitSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary([FromQuery] DateOnly? date = null, CancellationToken ct = default)
    {
        var data = await _habitService.GetSummaryAsync(_currentUser.UserId, date, ct);
        return Ok(ApiResponse<HabitSummaryDto>.Ok(data));
    }

    [HttpGet("heatmap")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<HabitHeatmapDayDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHeatmap([FromQuery] int weeks = 21, [FromQuery] DateOnly? date = null, CancellationToken ct = default)
    {
        var data = await _habitService.GetHeatmapAsync(_currentUser.UserId, weeks, date, ct);
        return Ok(ApiResponse<IReadOnlyList<HabitHeatmapDayDto>>.Ok(data));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<HabitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHabit(Guid id, [FromQuery] DateOnly? date = null, CancellationToken ct = default)
    {
        var data = await _habitService.GetHabitByIdAsync(_currentUser.UserId, id, date, ct);
        return Ok(ApiResponse<HabitDto>.Ok(data));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<HabitDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateHabit([FromBody] CreateHabitRequest request, CancellationToken ct)
    {
        var data = await _habitService.CreateHabitAsync(_currentUser.UserId, request, ct);
        return CreatedAtAction(nameof(GetHabit), new { id = data.Id }, ApiResponse<HabitDto>.Ok(data, "Habit created successfully."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<HabitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateHabit(Guid id, [FromBody] UpdateHabitRequest request, CancellationToken ct)
    {
        var data = await _habitService.UpdateHabitAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<HabitDto>.Ok(data, "Habit updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteHabit(Guid id, CancellationToken ct)
    {
        await _habitService.DeleteHabitAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/logs")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<HabitLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHabitLogs(Guid id, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
    {
        var data = await _habitService.GetHabitLogsAsync(_currentUser.UserId, id, from, to, ct);
        return Ok(ApiResponse<IReadOnlyList<HabitLogDto>>.Ok(data));
    }

    [HttpPut("{id:guid}/logs/{date}")]
    [ProducesResponseType(typeof(ApiResponse<HabitLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetHabitLog(Guid id, DateOnly date, [FromBody] ToggleHabitLogRequest request, CancellationToken ct)
    {
        var data = await _habitService.SetHabitLogAsync(_currentUser.UserId, id, date, request.IsCompleted, ct);
        return Ok(ApiResponse<HabitLogDto>.Ok(data, request.IsCompleted ? "Habit checked in." : "Habit unchecked."));
    }
}

