using Dayform.Application.Common;
using Dayform.Application.DTOs.Goals;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/goals")]
public class GoalsController : ControllerBase
{
    private readonly IGoalService _goalService;
    private readonly ICurrentUserService _currentUser;

    public GoalsController(IGoalService goalService, ICurrentUserService currentUser)
    {
        _goalService = goalService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<GoalDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGoals([FromQuery] string? category, [FromQuery] string? status, CancellationToken ct)
    {
        var data = await _goalService.GetGoalsAsync(_currentUser.UserId, category, status, ct);
        return Ok(ApiResponse<IReadOnlyList<GoalDto>>.Ok(data));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<GoalDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetGoal(Guid id, CancellationToken ct)
    {
        var data = await _goalService.GetGoalByIdAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<GoalDto>.Ok(data));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<GoalDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateGoal([FromBody] CreateGoalRequest request, CancellationToken ct)
    {
        var data = await _goalService.CreateGoalAsync(_currentUser.UserId, request, ct);
        return CreatedAtAction(nameof(GetGoal), new { id = data.Id }, ApiResponse<GoalDto>.Ok(data, "Goal created."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<GoalDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateGoal(Guid id, [FromBody] UpdateGoalRequest request, CancellationToken ct)
    {
        var data = await _goalService.UpdateGoalAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<GoalDto>.Ok(data, "Goal updated."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteGoal(Guid id, CancellationToken ct)
    {
        await _goalService.DeleteGoalAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpPost("{goalId:guid}/milestones/{milestoneId:guid}/toggle")]
    [ProducesResponseType(typeof(ApiResponse<GoalMilestoneDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleMilestone(Guid goalId, Guid milestoneId, CancellationToken ct)
    {
        var data = await _goalService.ToggleMilestoneAsync(_currentUser.UserId, goalId, milestoneId, ct);
        return Ok(ApiResponse<GoalMilestoneDto>.Ok(data));
    }

    [HttpPost("{goalId:guid}/steps/{stepId:guid}/toggle")]
    [ProducesResponseType(typeof(ApiResponse<GoalActionStepDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleActionStep(Guid goalId, Guid stepId, CancellationToken ct)
    {
        var data = await _goalService.ToggleActionStepAsync(_currentUser.UserId, goalId, stepId, ct);
        return Ok(ApiResponse<GoalActionStepDto>.Ok(data));
    }

    // Vision Board
    [HttpGet("vision-board")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<VisionBoardItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisionBoard(CancellationToken ct)
    {
        var data = await _goalService.GetVisionBoardAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<VisionBoardItemDto>>.Ok(data));
    }

    [HttpPost("vision-board")]
    [ProducesResponseType(typeof(ApiResponse<VisionBoardItemDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddVisionBoardItem([FromBody] CreateVisionBoardItemRequest request, CancellationToken ct)
    {
        var data = await _goalService.AddVisionBoardItemAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<VisionBoardItemDto>.Ok(data, "Vision board item added."));
    }

    [HttpDelete("vision-board/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteVisionBoardItem(Guid id, CancellationToken ct)
    {
        await _goalService.DeleteVisionBoardItemAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }
}

