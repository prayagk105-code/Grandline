using Dayform.Application.Common;
using Dayform.Application.DTOs.Focus;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/focus")]
public class FocusController : ControllerBase
{
    private readonly IFocusService _focusService;
    private readonly ICurrentUserService _currentUser;

    public FocusController(IFocusService focusService, ICurrentUserService currentUser)
    {
        _focusService = focusService;
        _currentUser = currentUser;
    }

    [HttpGet("sessions")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FocusSessionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions([FromQuery] DateOnly? date, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var data = await _focusService.GetFocusSessionsAsync(_currentUser.UserId, date, limit, ct);
        return Ok(ApiResponse<IReadOnlyList<FocusSessionDto>>.Ok(data));
    }

    [HttpPost("sessions")]
    [ProducesResponseType(typeof(ApiResponse<FocusSessionDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateSession([FromBody] CreateFocusSessionRequest request, CancellationToken ct)
    {
        var data = await _focusService.CreateFocusSessionAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<FocusSessionDto>.Ok(data, "Focus session saved."));
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<FocusSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken ct)
    {
        var data = await _focusService.GetFocusSummaryAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<FocusSummaryDto>.Ok(data));
    }

    [HttpGet("screen-time")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ScreenTimeLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetScreenTime([FromQuery] DateOnly? date, CancellationToken ct)
    {
        var data = await _focusService.GetScreenTimeLogsAsync(_currentUser.UserId, date, ct);
        return Ok(ApiResponse<IReadOnlyList<ScreenTimeLogDto>>.Ok(data));
    }

    [HttpPost("screen-time")]
    [ProducesResponseType(typeof(ApiResponse<ScreenTimeLogDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateScreenTime([FromBody] CreateScreenTimeLogRequest request, CancellationToken ct)
    {
        var data = await _focusService.CreateScreenTimeLogAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<ScreenTimeLogDto>.Ok(data, "Screen time logged."));
    }
}

