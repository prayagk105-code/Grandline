using Dayform.Application.Common;
using Dayform.Application.DTOs.Study;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/learning-paths")]
public class LearningPathsController : ControllerBase
{
    private readonly IStudyService _studyService;
    private readonly ICurrentUserService _currentUser;

    public LearningPathsController(IStudyService studyService, ICurrentUserService currentUser)
    {
        _studyService = studyService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<LearningPathDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] bool includeArchived = false, CancellationToken ct = default)
    {
        var data = await _studyService.GetLearningPathsAsync(_currentUser.UserId, includeArchived, ct);
        return Ok(ApiResponse<IReadOnlyList<LearningPathDto>>.Ok(data));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<LearningPathDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var data = await _studyService.GetLearningPathByIdAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<LearningPathDto>.Ok(data));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<LearningPathDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateLearningPathRequest request, CancellationToken ct)
    {
        var data = await _studyService.CreateLearningPathAsync(_currentUser.UserId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = data.Id }, ApiResponse<LearningPathDto>.Ok(data, "Learning path created."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<LearningPathDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLearningPathRequest request, CancellationToken ct)
    {
        var data = await _studyService.UpdateLearningPathAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<LearningPathDto>.Ok(data, "Learning path updated."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _studyService.DeleteLearningPathAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }
}

