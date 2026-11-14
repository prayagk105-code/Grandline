using Dayform.Application.Common;
using Dayform.Application.DTOs.Knowledge;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/knowledge")]
public class KnowledgeController : ControllerBase
{
    private readonly IKnowledgeService _knowledgeService;
    private readonly ICurrentUserService _currentUser;

    public KnowledgeController(IKnowledgeService knowledgeService, ICurrentUserService currentUser)
    {
        _knowledgeService = knowledgeService;
        _currentUser = currentUser;
    }

    // Books
    [HttpGet("books")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<BookDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBooks([FromQuery] string? status, CancellationToken ct)
    {
        var data = await _knowledgeService.GetBooksAsync(_currentUser.UserId, status, ct);
        return Ok(ApiResponse<IReadOnlyList<BookDto>>.Ok(data));
    }

    [HttpGet("books/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<BookDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBook(Guid id, CancellationToken ct)
    {
        var data = await _knowledgeService.GetBookByIdAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<BookDto>.Ok(data));
    }

    [HttpPost("books")]
    [ProducesResponseType(typeof(ApiResponse<BookDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateBook([FromBody] CreateBookRequest request, CancellationToken ct)
    {
        var data = await _knowledgeService.CreateBookAsync(_currentUser.UserId, request, ct);
        return CreatedAtAction(nameof(GetBook), new { id = data.Id }, ApiResponse<BookDto>.Ok(data, "Book added."));
    }

    [HttpPut("books/{id:guid}/progress")]
    [ProducesResponseType(typeof(ApiResponse<BookDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateBookProgress(Guid id, [FromBody] UpdateBookProgressRequest request, CancellationToken ct)
    {
        var data = await _knowledgeService.UpdateBookProgressAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<BookDto>.Ok(data, "Reading progress updated."));
    }

    [HttpDelete("books/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteBook(Guid id, CancellationToken ct)
    {
        await _knowledgeService.DeleteBookAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Notes
    [HttpGet("notes")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PersonalNoteDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotes([FromQuery] string? category, [FromQuery] Guid? bookId, [FromQuery] string? search, CancellationToken ct)
    {
        var data = await _knowledgeService.GetNotesAsync(_currentUser.UserId, category, bookId, search, ct);
        return Ok(ApiResponse<IReadOnlyList<PersonalNoteDto>>.Ok(data));
    }

    [HttpPost("notes")]
    [ProducesResponseType(typeof(ApiResponse<PersonalNoteDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateNote([FromBody] CreatePersonalNoteRequest request, CancellationToken ct)
    {
        var data = await _knowledgeService.CreateNoteAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<PersonalNoteDto>.Ok(data, "Note saved."));
    }

    [HttpDelete("notes/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteNote(Guid id, CancellationToken ct)
    {
        await _knowledgeService.DeleteNoteAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Ideas
    [HttpGet("ideas")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<IdeaItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIdeas([FromQuery] string? status, CancellationToken ct)
    {
        var data = await _knowledgeService.GetIdeasAsync(_currentUser.UserId, status, ct);
        return Ok(ApiResponse<IReadOnlyList<IdeaItemDto>>.Ok(data));
    }

    [HttpPost("ideas")]
    [ProducesResponseType(typeof(ApiResponse<IdeaItemDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateIdea([FromBody] CreateIdeaRequest request, CancellationToken ct)
    {
        var data = await _knowledgeService.CreateIdeaAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<IdeaItemDto>.Ok(data, "Idea captured."));
    }

    [HttpPut("ideas/{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<IdeaItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateIdeaStatus(Guid id, [FromQuery] string status, CancellationToken ct)
    {
        var data = await _knowledgeService.UpdateIdeaStatusAsync(_currentUser.UserId, id, status, ct);
        return Ok(ApiResponse<IdeaItemDto>.Ok(data));
    }

    [HttpDelete("ideas/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteIdea(Guid id, CancellationToken ct)
    {
        await _knowledgeService.DeleteIdeaAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Quotes
    [HttpGet("quotes")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SavedQuoteDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuotes(CancellationToken ct)
    {
        var data = await _knowledgeService.GetQuotesAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<SavedQuoteDto>>.Ok(data));
    }

    [HttpPost("quotes")]
    [ProducesResponseType(typeof(ApiResponse<SavedQuoteDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateQuote([FromBody] CreateQuoteRequest request, CancellationToken ct)
    {
        var data = await _knowledgeService.CreateQuoteAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<SavedQuoteDto>.Ok(data, "Quote saved."));
    }

    [HttpDelete("quotes/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteQuote(Guid id, CancellationToken ct)
    {
        await _knowledgeService.DeleteQuoteAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }
}

