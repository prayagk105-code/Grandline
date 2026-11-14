using Dayform.Application.Common;
using Dayform.Application.DTOs.Knowledge;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class KnowledgeService : IKnowledgeService
{
    private readonly IDayformDbContext _db;

    public KnowledgeService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<BookDto>> GetBooksAsync(Guid userId, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Books.AsNoTracking().Where(b => b.UserId == userId);
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(b => b.Status == status);

        var list = await query.OrderByDescending(b => b.CreatedAtUtc).ToListAsync(ct);
        return list.Select(MapToDto).ToList();
    }

    public async Task<BookDto> GetBookByIdAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var b = await _db.Books.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId && x.Id == id, ct);
        if (b == null) throw new NotFoundAppException("Book not found.");
        return MapToDto(b);
    }

    public async Task<BookDto> CreateBookAsync(Guid userId, CreateBookRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Book title is required.");

        var book = new Book
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Author = string.IsNullOrWhiteSpace(request.Author) ? "Unknown" : request.Author.Trim(),
            TotalPages = Math.Max(0, request.TotalPages),
            CurrentPage = Math.Clamp(request.CurrentPage, 0, Math.Max(1, request.TotalPages)),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Reading" : request.Status.Trim(),
            Rating = Math.Clamp(request.Rating, 1, 5),
            CoverImageUrl = request.CoverImageUrl?.Trim(),
            StartedDate = request.StartedDate,
            FinishedDate = request.FinishedDate,
            KeyLessons = request.KeyLessons?.Trim()
        };

        _db.Books.Add(book);
        await _db.SaveChangesAsync(ct);
        return MapToDto(book);
    }

    public async Task<BookDto> UpdateBookProgressAsync(Guid userId, Guid id, UpdateBookProgressRequest request, CancellationToken ct = default)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.UserId == userId && b.Id == id, ct);
        if (book == null) throw new NotFoundAppException("Book not found.");

        book.CurrentPage = Math.Clamp(request.CurrentPage, 0, book.TotalPages > 0 ? book.TotalPages : 9999);
        if (request.KeyLessons != null)
            book.KeyLessons = request.KeyLessons.Trim();

        if (!string.IsNullOrWhiteSpace(request.Status))
            book.Status = request.Status.Trim();
        else if (book.TotalPages > 0 && book.CurrentPage >= book.TotalPages)
        {
            book.Status = "Completed";
            book.FinishedDate = DateOnly.FromDateTime(DateTime.UtcNow);
        }

        await _db.SaveChangesAsync(ct);
        return MapToDto(book);
    }

    public async Task DeleteBookAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var book = await _db.Books.FirstOrDefaultAsync(b => b.UserId == userId && b.Id == id, ct);
        if (book == null) throw new NotFoundAppException("Book not found.");

        _db.Books.Remove(book);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<PersonalNoteDto>> GetNotesAsync(Guid userId, string? category = null, Guid? bookId = null, string? search = null, CancellationToken ct = default)
    {
        var query = _db.Notes.AsNoTracking()
            .Include(n => n.Book)
            .Where(n => n.UserId == userId);

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(n => n.Category == category);

        if (bookId.HasValue)
            query = query.Where(n => n.BookId == bookId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(n => n.Title.ToLower().Contains(s) || n.Content.ToLower().Contains(s) || (n.Tags != null && n.Tags.ToLower().Contains(s)));
        }

        var list = await query.OrderByDescending(n => n.IsFavorite).ThenByDescending(n => n.CreatedAtUtc).ToListAsync(ct);
        return list.Select(n => new PersonalNoteDto(n.Id, n.BookId, n.Book?.Title, n.Title, n.Content, n.Category, n.Tags, n.IsFavorite, n.CreatedAtUtc)).ToList();
    }

    public async Task<PersonalNoteDto> CreateNoteAsync(Guid userId, CreatePersonalNoteRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Note title is required.");

        var note = new PersonalNote
        {
            UserId = userId,
            BookId = request.BookId,
            Title = request.Title.Trim(),
            Content = request.Content ?? string.Empty,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Personal" : request.Category.Trim(),
            Tags = request.Tags?.Trim(),
            IsFavorite = request.IsFavorite
        };

        _db.Notes.Add(note);
        await _db.SaveChangesAsync(ct);

        string? bookTitle = null;
        if (note.BookId.HasValue)
        {
            var b = await _db.Books.AsNoTracking().FirstOrDefaultAsync(x => x.Id == note.BookId.Value, ct);
            bookTitle = b?.Title;
        }

        return new PersonalNoteDto(note.Id, note.BookId, bookTitle, note.Title, note.Content, note.Category, note.Tags, note.IsFavorite, note.CreatedAtUtc);
    }

    public async Task DeleteNoteAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var note = await _db.Notes.FirstOrDefaultAsync(n => n.UserId == userId && n.Id == id, ct);
        if (note == null) throw new NotFoundAppException("Note not found.");

        _db.Notes.Remove(note);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<IdeaItemDto>> GetIdeasAsync(Guid userId, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Ideas.AsNoTracking().Where(i => i.UserId == userId);
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(i => i.Status == status);

        var list = await query.OrderByDescending(i => i.CreatedAtUtc).ToListAsync(ct);
        return list.Select(i => new IdeaItemDto(i.Id, i.Title, i.Description, i.Category, i.Status, i.CreatedAtUtc)).ToList();
    }

    public async Task<IdeaItemDto> CreateIdeaAsync(Guid userId, CreateIdeaRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Idea title is required.");

        var idea = new IdeaItem
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
            Status = string.IsNullOrWhiteSpace(request.Status) ? "Raw" : request.Status.Trim()
        };

        _db.Ideas.Add(idea);
        await _db.SaveChangesAsync(ct);

        return new IdeaItemDto(idea.Id, idea.Title, idea.Description, idea.Category, idea.Status, idea.CreatedAtUtc);
    }

    public async Task<IdeaItemDto> UpdateIdeaStatusAsync(Guid userId, Guid id, string status, CancellationToken ct = default)
    {
        var idea = await _db.Ideas.FirstOrDefaultAsync(i => i.UserId == userId && i.Id == id, ct);
        if (idea == null) throw new NotFoundAppException("Idea not found.");

        idea.Status = status.Trim();
        await _db.SaveChangesAsync(ct);

        return new IdeaItemDto(idea.Id, idea.Title, idea.Description, idea.Category, idea.Status, idea.CreatedAtUtc);
    }

    public async Task DeleteIdeaAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var idea = await _db.Ideas.FirstOrDefaultAsync(i => i.UserId == userId && i.Id == id, ct);
        if (idea == null) throw new NotFoundAppException("Idea not found.");

        _db.Ideas.Remove(idea);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<SavedQuoteDto>> GetQuotesAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.Quotes.AsNoTracking()
            .Where(q => q.UserId == userId)
            .OrderByDescending(q => q.IsFavorite)
            .ThenByDescending(q => q.CreatedAtUtc)
            .ToListAsync(ct);

        return list.Select(q => new SavedQuoteDto(q.Id, q.BookId, q.QuoteText, q.Author, q.Source, q.IsFavorite, q.Tags, q.CreatedAtUtc)).ToList();
    }

    public async Task<SavedQuoteDto> CreateQuoteAsync(Guid userId, CreateQuoteRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.QuoteText))
            throw new BadRequestException("Quote text is required.");

        var quote = new SavedQuote
        {
            UserId = userId,
            BookId = request.BookId,
            QuoteText = request.QuoteText.Trim(),
            Author = string.IsNullOrWhiteSpace(request.Author) ? "Unknown" : request.Author.Trim(),
            Source = request.Source?.Trim(),
            IsFavorite = request.IsFavorite,
            Tags = request.Tags?.Trim()
        };

        _db.Quotes.Add(quote);
        await _db.SaveChangesAsync(ct);

        return new SavedQuoteDto(quote.Id, quote.BookId, quote.QuoteText, quote.Author, quote.Source, quote.IsFavorite, quote.Tags, quote.CreatedAtUtc);
    }

    public async Task DeleteQuoteAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var quote = await _db.Quotes.FirstOrDefaultAsync(q => q.UserId == userId && q.Id == id, ct);
        if (quote == null) throw new NotFoundAppException("Quote not found.");

        _db.Quotes.Remove(quote);
        await _db.SaveChangesAsync(ct);
    }

    private static BookDto MapToDto(Book b)
    {
        var pct = b.TotalPages > 0 ? (int)Math.Round((double)b.CurrentPage / b.TotalPages * 100) : 0;
        return new BookDto(
            b.Id,
            b.Title,
            b.Author,
            b.TotalPages,
            b.CurrentPage,
            Math.Clamp(pct, 0, 100),
            b.Status,
            b.Rating,
            b.CoverImageUrl,
            b.StartedDate,
            b.FinishedDate,
            b.KeyLessons,
            b.CreatedAtUtc
        );
    }
}

