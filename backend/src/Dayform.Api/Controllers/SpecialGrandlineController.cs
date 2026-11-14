using Dayform.Application.Common;
using Dayform.Application.DTOs.Special;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/special")]
public class SpecialGrandlineController : ControllerBase
{
    private readonly ISpecialGrandlineService _specialService;
    private readonly ICurrentUserService _currentUser;

    public SpecialGrandlineController(ISpecialGrandlineService specialService, ICurrentUserService currentUser)
    {
        _specialService = specialService;
        _currentUser = currentUser;
    }

    // 11.1 Life Timeline
    [HttpGet("timeline")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<LifeTimelineEventDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTimeline(CancellationToken ct)
    {
        var data = await _specialService.GetTimelineEventsAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<LifeTimelineEventDto>>.Ok(data));
    }

    [HttpPost("timeline")]
    [ProducesResponseType(typeof(ApiResponse<LifeTimelineEventDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateTimelineEvent([FromBody] CreateTimelineEventRequest request, CancellationToken ct)
    {
        var data = await _specialService.CreateTimelineEventAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<LifeTimelineEventDto>.Ok(data, "Timeline event added."));
    }

    [HttpDelete("timeline/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteTimelineEvent(Guid id, CancellationToken ct)
    {
        await _specialService.DeleteTimelineEventAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // 11.2 Future Self
    [HttpGet("future-letters")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FutureLetterDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFutureLetters(CancellationToken ct)
    {
        var data = await _specialService.GetFutureLettersAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<FutureLetterDto>>.Ok(data));
    }

    [HttpPost("future-letters")]
    [ProducesResponseType(typeof(ApiResponse<FutureLetterDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateFutureLetter([FromBody] CreateFutureLetterRequest request, CancellationToken ct)
    {
        var data = await _specialService.CreateFutureLetterAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<FutureLetterDto>.Ok(data, "Letter sealed for your future self."));
    }

    [HttpPost("future-letters/{id:guid}/read")]
    [ProducesResponseType(typeof(ApiResponse<FutureLetterDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkFutureLetterRead(Guid id, CancellationToken ct)
    {
        var data = await _specialService.MarkFutureLetterReadAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<FutureLetterDto>.Ok(data));
    }

    // 11.3 90-Day Challenge
    [HttpGet("challenges")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<NinetyDayChallengeDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChallenges(CancellationToken ct)
    {
        var data = await _specialService.GetChallengesAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<NinetyDayChallengeDto>>.Ok(data));
    }

    [HttpPost("challenges")]
    [ProducesResponseType(typeof(ApiResponse<NinetyDayChallengeDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateChallenge([FromBody] CreateNinetyDayChallengeRequest request, CancellationToken ct)
    {
        var data = await _specialService.CreateChallengeAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<NinetyDayChallengeDto>.Ok(data, "90-Day Challenge launched!"));
    }

    [HttpPost("challenges/{id:guid}/day")]
    [ProducesResponseType(typeof(ApiResponse<NinetyDayChallengeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LogChallengeDay(Guid id, [FromBody] LogChallengeDayRequest request, CancellationToken ct)
    {
        var data = await _specialService.LogChallengeDayAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<NinetyDayChallengeDto>.Ok(data, "Day progress updated."));
    }

    // 11.5 Personal Rules
    [HttpGet("rules")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PersonalRuleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRules([FromQuery] DateOnly? date, CancellationToken ct)
    {
        var data = await _specialService.GetPersonalRulesAsync(_currentUser.UserId, date, ct);
        return Ok(ApiResponse<IReadOnlyList<PersonalRuleDto>>.Ok(data));
    }

    [HttpPost("rules")]
    [ProducesResponseType(typeof(ApiResponse<PersonalRuleDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateRule([FromBody] CreatePersonalRuleRequest request, CancellationToken ct)
    {
        var data = await _specialService.CreatePersonalRuleAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<PersonalRuleDto>.Ok(data, "Personal rule created."));
    }

    [HttpPost("rules/{id:guid}/compliance")]
    [ProducesResponseType(typeof(ApiResponse<PersonalRuleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LogRuleCompliance(Guid id, [FromBody] LogRuleComplianceRequest request, CancellationToken ct)
    {
        var data = await _specialService.LogRuleComplianceAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<PersonalRuleDto>.Ok(data));
    }

    [HttpDelete("rules/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteRule(Guid id, CancellationToken ct)
    {
        await _specialService.DeletePersonalRuleAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // 11.6 Digital Detox
    [HttpGet("detox")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<DigitalDetoxDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDetoxes(CancellationToken ct)
    {
        var data = await _specialService.GetDigitalDetoxesAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<DigitalDetoxDto>>.Ok(data));
    }

    [HttpPost("detox")]
    [ProducesResponseType(typeof(ApiResponse<DigitalDetoxDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateDetox([FromBody] CreateDigitalDetoxRequest request, CancellationToken ct)
    {
        var data = await _specialService.CreateDigitalDetoxAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<DigitalDetoxDto>.Ok(data, "Digital detox goal started."));
    }

    [HttpPost("detox/{id:guid}/clean-day")]
    [ProducesResponseType(typeof(ApiResponse<DigitalDetoxDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LogDetoxCleanDay(Guid id, CancellationToken ct)
    {
        var data = await _specialService.LogDetoxCleanDayAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<DigitalDetoxDto>.Ok(data, "Clean detox day recorded!"));
    }

    // 11.7 Monthly Reflection
    [HttpGet("reflections/monthly")]
    [ProducesResponseType(typeof(ApiResponse<MonthlyReflectionDto?>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMonthlyReflection([FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        var data = await _specialService.GetMonthlyReflectionAsync(_currentUser.UserId, year, month, ct);
        return Ok(ApiResponse<MonthlyReflectionDto?>.Ok(data));
    }

    [HttpPost("reflections/monthly")]
    [ProducesResponseType(typeof(ApiResponse<MonthlyReflectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpsertMonthlyReflection([FromBody] UpsertMonthlyReflectionRequest request, CancellationToken ct)
    {
        var data = await _specialService.UpsertMonthlyReflectionAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<MonthlyReflectionDto>.Ok(data, "Monthly reflection saved."));
    }

    // 11.10 Discipline Score
    [HttpGet("discipline-score")]
    [ProducesResponseType(typeof(ApiResponse<DisciplineScoreDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDisciplineScore(CancellationToken ct)
    {
        var data = await _specialService.GetDisciplineScoreAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<DisciplineScoreDto>.Ok(data));
    }
}

