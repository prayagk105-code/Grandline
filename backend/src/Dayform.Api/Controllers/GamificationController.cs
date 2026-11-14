using Dayform.Application.Common;
using Dayform.Application.DTOs.Gamification;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/gamification")]
public class GamificationController : ControllerBase
{
    private readonly IGamificationService _gamificationService;
    private readonly ICurrentUserService _currentUser;

    public GamificationController(IGamificationService gamificationService, ICurrentUserService currentUser)
    {
        _gamificationService = gamificationService;
        _currentUser = currentUser;
    }

    [HttpGet("status")]
    [ProducesResponseType(typeof(ApiResponse<GamificationStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus(CancellationToken ct)
    {
        var data = await _gamificationService.GetGamificationStatusAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<GamificationStatusDto>.Ok(data));
    }

    [HttpPost("award-xp")]
    [ProducesResponseType(typeof(ApiResponse<GamificationStatusDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AwardXp([FromQuery] int amount, [FromQuery] string reason, CancellationToken ct)
    {
        var data = await _gamificationService.AwardXpAsync(_currentUser.UserId, amount, reason, ct);
        return Ok(ApiResponse<GamificationStatusDto>.Ok(data, $"Awarded {amount} XP!"));
    }

    [HttpPost("missions/{id:guid}/claim")]
    [ProducesResponseType(typeof(ApiResponse<DailyMissionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ClaimMission(Guid id, CancellationToken ct)
    {
        var data = await _gamificationService.ClaimMissionRewardAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<DailyMissionDto>.Ok(data, "Mission reward claimed!"));
    }

    [HttpPost("rewards")]
    [ProducesResponseType(typeof(ApiResponse<CustomRewardDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateReward([FromBody] CreateCustomRewardRequest request, CancellationToken ct)
    {
        var data = await _gamificationService.CreateRewardAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<CustomRewardDto>.Ok(data, "Reward created."));
    }

    [HttpPost("rewards/{id:guid}/redeem")]
    [ProducesResponseType(typeof(ApiResponse<CustomRewardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RedeemReward(Guid id, CancellationToken ct)
    {
        var data = await _gamificationService.RedeemRewardAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<CustomRewardDto>.Ok(data, "Reward redeemed!"));
    }
}

