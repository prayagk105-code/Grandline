using Dayform.Application.Common;
using Dayform.Application.DTOs.Progress;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/progress")]
public class ProgressController : ControllerBase
{
    private readonly IProgressService _progressService;
    private readonly ICurrentUserService _currentUser;

    public ProgressController(IProgressService progressService, ICurrentUserService currentUser)
    {
        _progressService = progressService;
        _currentUser = currentUser;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<ProgressSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary([FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        var data = await _progressService.GetSummaryAsync(_currentUser.UserId, from, to, ct);
        return Ok(ApiResponse<ProgressSummaryDto>.Ok(data));
    }

    [HttpGet("habits")]
    [ProducesResponseType(typeof(ApiResponse<ProgressHabitAnalyticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHabits([FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        var data = await _progressService.GetHabitAnalyticsAsync(_currentUser.UserId, from, to, ct);
        return Ok(ApiResponse<ProgressHabitAnalyticsDto>.Ok(data));
    }

    [HttpGet("study")]
    [ProducesResponseType(typeof(ApiResponse<ProgressStudyAnalyticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStudy([FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        var data = await _progressService.GetStudyAnalyticsAsync(_currentUser.UserId, from, to, ct);
        return Ok(ApiResponse<ProgressStudyAnalyticsDto>.Ok(data));
    }

    [HttpGet("monthly")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MonthlySummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMonthly([FromQuery] int months = 5, [FromQuery] DateOnly? date = null, CancellationToken ct = default)
    {
        var data = await _progressService.GetMonthlySummaryAsync(_currentUser.UserId, months, date, ct);
        return Ok(ApiResponse<IReadOnlyList<MonthlySummaryDto>>.Ok(data));
    }
}

