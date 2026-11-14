using Dayform.Application.Common;
using Dayform.Application.DTOs.Health;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/health-logs")]
public class HealthController : ControllerBase
{
    private readonly IHealthService _healthService;
    private readonly ICurrentUserService _currentUser;

    public HealthController(IHealthService healthService, ICurrentUserService currentUser)
    {
        _healthService = healthService;
        _currentUser = currentUser;
    }

    [HttpGet("daily")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<HealthDailyLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDailyLogs([FromQuery] int limit = 30, CancellationToken ct = default)
    {
        var data = await _healthService.GetDailyLogsAsync(_currentUser.UserId, limit, ct);
        return Ok(ApiResponse<IReadOnlyList<HealthDailyLogDto>>.Ok(data));
    }

    [HttpGet("daily/today")]
    [ProducesResponseType(typeof(ApiResponse<HealthDailyLogDto?>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTodayDailyLog([FromQuery] DateOnly? date, CancellationToken ct = default)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var data = await _healthService.GetDailyLogByDateAsync(_currentUser.UserId, targetDate, ct);
        return Ok(ApiResponse<HealthDailyLogDto?>.Ok(data));
    }

    [HttpPost("daily")]
    [ProducesResponseType(typeof(ApiResponse<HealthDailyLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpsertDailyLog([FromBody] UpsertHealthDailyLogRequest request, CancellationToken ct)
    {
        var data = await _healthService.UpsertDailyLogAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<HealthDailyLogDto>.Ok(data, "Daily health log saved."));
    }

    // Workouts
    [HttpGet("workouts")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<WorkoutLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWorkouts([FromQuery] int limit = 30, CancellationToken ct = default)
    {
        var data = await _healthService.GetWorkoutLogsAsync(_currentUser.UserId, limit, ct);
        return Ok(ApiResponse<IReadOnlyList<WorkoutLogDto>>.Ok(data));
    }

    [HttpPost("workouts")]
    [ProducesResponseType(typeof(ApiResponse<WorkoutLogDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateWorkout([FromBody] CreateWorkoutLogRequest request, CancellationToken ct)
    {
        var data = await _healthService.CreateWorkoutLogAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<WorkoutLogDto>.Ok(data, "Workout logged."));
    }

    [HttpDelete("workouts/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteWorkout(Guid id, CancellationToken ct)
    {
        await _healthService.DeleteWorkoutLogAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Meals
    [HttpGet("meals")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MealLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMeals([FromQuery] DateOnly? date, CancellationToken ct)
    {
        var data = await _healthService.GetMealLogsAsync(_currentUser.UserId, date, ct);
        return Ok(ApiResponse<IReadOnlyList<MealLogDto>>.Ok(data));
    }

    [HttpPost("meals")]
    [ProducesResponseType(typeof(ApiResponse<MealLogDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateMeal([FromBody] CreateMealLogRequest request, CancellationToken ct)
    {
        var data = await _healthService.CreateMealLogAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<MealLogDto>.Ok(data, "Meal logged."));
    }

    [HttpDelete("meals/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteMeal(Guid id, CancellationToken ct)
    {
        await _healthService.DeleteMealLogAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Summary
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<HealthSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken ct)
    {
        var data = await _healthService.GetHealthSummaryAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<HealthSummaryDto>.Ok(data));
    }
}

