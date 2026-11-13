using Dayform.Application.Common;
using Dayform.Application.DTOs.Dashboard;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ICurrentUserService _currentUser;

    public DashboardController(IDashboardService dashboardService, ICurrentUserService currentUser)
    {
        _dashboardService = dashboardService;
        _currentUser = currentUser;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<DashboardSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary([FromQuery] DateOnly? date, CancellationToken ct)
    {
        var data = await _dashboardService.GetSummaryAsync(_currentUser.UserId, date, ct);
        return Ok(ApiResponse<DashboardSummaryDto>.Ok(data));
    }

    [HttpGet("weekly-activity")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<WeeklyActivityDayDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWeeklyActivity([FromQuery] DateOnly? date, CancellationToken ct)
    {
        var data = await _dashboardService.GetWeeklyActivityAsync(_currentUser.UserId, date, ct);
        return Ok(ApiResponse<IReadOnlyList<WeeklyActivityDayDto>>.Ok(data));
    }

    [HttpGet("recent-memories")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MemoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecentMemories([FromQuery] int limit = 5, CancellationToken ct = default)
    {
        var data = await _dashboardService.GetRecentMemoriesAsync(_currentUser.UserId, limit, ct);
        return Ok(ApiResponse<IReadOnlyList<MemoryDto>>.Ok(data));
    }
}

