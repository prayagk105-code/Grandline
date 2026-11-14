namespace Dayform.Application.DTOs.Knowledge;

public record BookDto(
    Guid Id,
    string Title,
    string Author,
    int TotalPages,
    int CurrentPage,
    int ProgressPercent,
    string Status,
    int Rating,
    string? CoverImageUrl,
    DateOnly? StartedDate,
    DateOnly? FinishedDate,
    string? KeyLessons,
    DateTime CreatedAtUtc
);

public record CreateBookRequest(
    string Title,
    string Author,
    int TotalPages,
    int CurrentPage,
    string Status,
    int Rating,
    string? CoverImageUrl,
    DateOnly? StartedDate,
    DateOnly? FinishedDate,
    string? KeyLessons
);

public record UpdateBookProgressRequest(
    int CurrentPage,
    string? KeyLessons,
    string? Status
);

public record PersonalNoteDto(
    Guid Id,
    Guid? BookId,
    string? BookTitle,
    string Title,
    string Content,
    string Category,
    string? Tags,
    bool IsFavorite,
    DateTime CreatedAtUtc
);

public record CreatePersonalNoteRequest(
    Guid? BookId,
    string Title,
    string Content,
    string Category,
    string? Tags,
    bool IsFavorite
);

public record IdeaItemDto(
    Guid Id,
    string Title,
    string? Description,
    string Category,
    string Status,
    DateTime CreatedAtUtc
);

public record CreateIdeaRequest(
    string Title,
    string? Description,
    string Category,
    string Status
);

public record SavedQuoteDto(
    Guid Id,
    Guid? BookId,
    string QuoteText,
    string Author,
    string? Source,
    bool IsFavorite,
    string? Tags,
    DateTime CreatedAtUtc
);

public record CreateQuoteRequest(
    Guid? BookId,
    string QuoteText,
    string Author,
    string? Source,
    bool IsFavorite,
    string? Tags
);

