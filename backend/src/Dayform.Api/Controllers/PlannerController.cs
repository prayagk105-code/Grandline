using Dayform.Application.Common;
using Dayform.Application.DTOs.Planner;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/reminders")]
public class RemindersController : ControllerBase
{
    private readonly IPlannerService _plannerService;
    private readonly ICurrentUserService _currentUser;

    public RemindersController(IPlannerService plannerService, ICurrentUserService currentUser)
    {
        _plannerService = plannerService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ReminderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false, CancellationToken ct = default)
    {
        var data = await _plannerService.GetRemindersAsync(_currentUser.UserId, activeOnly, ct);
        return Ok(ApiResponse<IReadOnlyList<ReminderDto>>.Ok(data));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ReminderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var data = await _plannerService.GetReminderByIdAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<ReminderDto>.Ok(data));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ReminderDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateReminderRequest request, CancellationToken ct)
    {
        var data = await _plannerService.CreateReminderAsync(_currentUser.UserId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = data.Id }, ApiResponse<ReminderDto>.Ok(data, "Reminder saved."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ReminderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateReminderRequest request, CancellationToken ct)
    {
        var data = await _plannerService.UpdateReminderAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<ReminderDto>.Ok(data, "Reminder updated."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _plannerService.DeleteReminderAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }
}

[ApiController]
[Authorize]
[Route("api/v1/planner")]
public class PlannerController : ControllerBase
{
    private readonly IPlannerService _plannerService;
    private readonly ICurrentUserService _currentUser;

    public PlannerController(IPlannerService plannerService, ICurrentUserService currentUser)
    {
        _plannerService = plannerService;
        _currentUser = currentUser;
    }

    [HttpGet("calendar")]
    [ProducesResponseType(typeof(ApiResponse<PlannerCalendarDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCalendar([FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        var data = await _plannerService.GetCalendarAsync(_currentUser.UserId, from, to, ct);
        return Ok(ApiResponse<PlannerCalendarDto>.Ok(data));
    }
}

