using Dayform.Application.Common;
using Dayform.Application.DTOs.PersonalDevelopment;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/personal-development")]
public class PersonalDevelopmentController : ControllerBase
{
    private readonly IPersonalDevelopmentService _pdService;
    private readonly ICurrentUserService _currentUser;

    public PersonalDevelopmentController(IPersonalDevelopmentService pdService, ICurrentUserService currentUser)
    {
        _pdService = pdService;
        _currentUser = currentUser;
    }

    [HttpGet("mood-logs")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MoodLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMoodLogs([FromQuery] int limit = 30, CancellationToken ct = default)
    {
        var data = await _pdService.GetMoodLogsAsync(_currentUser.UserId, limit, ct);
        return Ok(ApiResponse<IReadOnlyList<MoodLogDto>>.Ok(data));
    }

    [HttpGet("mood-logs/today")]
    [ProducesResponseType(typeof(ApiResponse<MoodLogDto?>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTodayMoodLog([FromQuery] DateOnly? date, CancellationToken ct = default)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var data = await _pdService.GetMoodLogByDateAsync(_currentUser.UserId, targetDate, ct);
        return Ok(ApiResponse<MoodLogDto?>.Ok(data));
    }

    [HttpPost("mood-logs")]
    [ProducesResponseType(typeof(ApiResponse<MoodLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpsertMoodLog([FromBody] UpsertMoodLogRequest request, CancellationToken ct)
    {
        var data = await _pdService.UpsertMoodLogAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<MoodLogDto>.Ok(data, "Mood & reflection saved."));
    }

    // Bad habits
    [HttpGet("bad-habits")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<BadHabitDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBadHabits(CancellationToken ct)
    {
        var data = await _pdService.GetBadHabitsAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<BadHabitDto>>.Ok(data));
    }

    [HttpPost("bad-habits")]
    [ProducesResponseType(typeof(ApiResponse<BadHabitDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateBadHabit([FromBody] CreateBadHabitRequest request, CancellationToken ct)
    {
        var data = await _pdService.CreateBadHabitAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<BadHabitDto>.Ok(data, "Bad habit tracking started."));
    }

    [HttpPost("bad-habits/{id:guid}/relapse")]
    [ProducesResponseType(typeof(ApiResponse<BadHabitDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LogRelapse(Guid id, CancellationToken ct)
    {
        var data = await _pdService.LogBadHabitRelapseAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<BadHabitDto>.Ok(data, "Relapse logged. Stay strong and reset."));
    }

    [HttpDelete("bad-habits/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteBadHabit(Guid id, CancellationToken ct)
    {
        await _pdService.DeleteBadHabitAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Strengths and weaknesses
    [HttpGet("strengths-weaknesses")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<StrengthWeaknessDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStrengthsWeaknesses([FromQuery] string? type, CancellationToken ct)
    {
        var data = await _pdService.GetStrengthsWeaknessesAsync(_currentUser.UserId, type, ct);
        return Ok(ApiResponse<IReadOnlyList<StrengthWeaknessDto>>.Ok(data));
    }

    [HttpPost("strengths-weaknesses")]
    [ProducesResponseType(typeof(ApiResponse<StrengthWeaknessDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateStrengthWeakness([FromBody] CreateStrengthWeaknessRequest request, CancellationToken ct)
    {
        var data = await _pdService.CreateStrengthWeaknessAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<StrengthWeaknessDto>.Ok(data, "Item created."));
    }

    [HttpDelete("strengths-weaknesses/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteStrengthWeakness(Guid id, CancellationToken ct)
    {
        await _pdService.DeleteStrengthWeaknessAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }
}

