using Dayform.Application.Common;
using Dayform.Application.DTOs.Journal;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/journals")]
public class JournalsController : ControllerBase
{
    private readonly IJournalService _journalService;
    private readonly ICurrentUserService _currentUser;

    public JournalsController(IJournalService journalService, ICurrentUserService currentUser)
    {
        _journalService = journalService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<JournalEntryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var data = await _journalService.GetEntriesAsync(_currentUser.UserId, page, pageSize, ct);
        return Ok(ApiResponse<PagedResult<JournalEntryDto>>.Ok(data));
    }

    [HttpGet("{date}")]
    [ProducesResponseType(typeof(ApiResponse<JournalEntryDto?>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByDate(DateOnly date, CancellationToken ct)
    {
        var data = await _journalService.GetByDateAsync(_currentUser.UserId, date, ct);
        return Ok(ApiResponse<JournalEntryDto?>.Ok(data));
    }

    [HttpPut("{date}")]
    [ProducesResponseType(typeof(ApiResponse<JournalEntryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Upsert(DateOnly date, [FromBody] UpsertJournalRequest request, CancellationToken ct)
    {
        var data = await _journalService.UpsertByDateAsync(_currentUser.UserId, date, request, ct);
        return Ok(ApiResponse<JournalEntryDto>.Ok(data, "Reflection saved."));
    }

    [HttpDelete("{date}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(DateOnly date, CancellationToken ct)
    {
        await _journalService.DeleteByDateAsync(_currentUser.UserId, date, ct);
        return NoContent();
    }
}

