using Dayform.Application.DTOs.Knowledge;

namespace Dayform.Application.Interfaces;

public interface IKnowledgeService
{
    Task<IReadOnlyList<BookDto>> GetBooksAsync(Guid userId, string? status = null, CancellationToken ct = default);
    Task<BookDto> GetBookByIdAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<BookDto> CreateBookAsync(Guid userId, CreateBookRequest request, CancellationToken ct = default);
    Task<BookDto> UpdateBookProgressAsync(Guid userId, Guid id, UpdateBookProgressRequest request, CancellationToken ct = default);
    Task DeleteBookAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<PersonalNoteDto>> GetNotesAsync(Guid userId, string? category = null, Guid? bookId = null, string? search = null, CancellationToken ct = default);
    Task<PersonalNoteDto> CreateNoteAsync(Guid userId, CreatePersonalNoteRequest request, CancellationToken ct = default);
    Task DeleteNoteAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<IdeaItemDto>> GetIdeasAsync(Guid userId, string? status = null, CancellationToken ct = default);
    Task<IdeaItemDto> CreateIdeaAsync(Guid userId, CreateIdeaRequest request, CancellationToken ct = default);
    Task<IdeaItemDto> UpdateIdeaStatusAsync(Guid userId, Guid id, string status, CancellationToken ct = default);
    Task DeleteIdeaAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<SavedQuoteDto>> GetQuotesAsync(Guid userId, CancellationToken ct = default);
    Task<SavedQuoteDto> CreateQuoteAsync(Guid userId, CreateQuoteRequest request, CancellationToken ct = default);
    Task DeleteQuoteAsync(Guid userId, Guid id, CancellationToken ct = default);
}

