using Dayform.Application.Common;
using Dayform.Application.DTOs.Study;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/study-sessions")]
public class StudySessionsController : ControllerBase
{
    private readonly IStudyService _studyService;
    private readonly ICurrentUserService _currentUser;

    public StudySessionsController(IStudyService studyService, ICurrentUserService currentUser)
    {
        _studyService = studyService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<StudySessionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? learningPathId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var data = await _studyService.GetSessionsAsync(_currentUser.UserId, learningPathId, from, to, page, pageSize, ct);
        return Ok(ApiResponse<PagedResult<StudySessionDto>>.Ok(data));
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<StudySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary([FromQuery] DateOnly? date, CancellationToken ct)
    {
        var data = await _studyService.GetSummaryAsync(_currentUser.UserId, date, ct);
        return Ok(ApiResponse<StudySummaryDto>.Ok(data));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<StudySessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var data = await _studyService.GetSessionByIdAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<StudySessionDto>.Ok(data));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<StudySessionDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateStudySessionRequest request, CancellationToken ct)
    {
        var data = await _studyService.CreateSessionAsync(_currentUser.UserId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = data.Id }, ApiResponse<StudySessionDto>.Ok(data, "Study session logged."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<StudySessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStudySessionRequest request, CancellationToken ct)
    {
        var data = await _studyService.UpdateSessionAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<StudySessionDto>.Ok(data, "Study session updated."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _studyService.DeleteSessionAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }
}

