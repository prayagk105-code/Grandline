using Dayform.Application.Common;
using Dayform.Application.DTOs.Journal;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class JournalService : IJournalService
{
    private readonly IDayformDbContext _db;
    private readonly IValidator<UpsertJournalRequest> _validator;

    public JournalService(IDayformDbContext db, IValidator<UpsertJournalRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<PagedResult<JournalEntryDto>> GetEntriesAsync(Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.JournalEntries.AsNoTracking()
            .Where(j => j.UserId == userId);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(j => j.EntryDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(j => new JournalEntryDto
            {
                Id = j.Id,
                EntryDate = j.EntryDate,
                Accomplishments = j.Accomplishments,
                Distractions = j.Distractions,
                Improvements = j.Improvements,
                CreatedAtUtc = j.CreatedAtUtc,
                UpdatedAtUtc = j.UpdatedAtUtc
            })
            .ToListAsync(ct);

        return new PagedResult<JournalEntryDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<JournalEntryDto?> GetByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default)
    {
        var entry = await _db.JournalEntries.AsNoTracking()
            .FirstOrDefaultAsync(j => j.UserId == userId && j.EntryDate == date, ct);

        return entry is null ? null : MapToDto(entry);
    }

    public async Task<JournalEntryDto> UpsertByDateAsync(Guid userId, DateOnly date, UpsertJournalRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_validator, request, ct);

        var entry = await _db.JournalEntries
            .FirstOrDefaultAsync(j => j.UserId == userId && j.EntryDate == date, ct);

        if (entry is null)
        {
            entry = new JournalEntry
            {
                UserId = userId,
                EntryDate = date,
                Accomplishments = request.Accomplishments?.Trim(),
                Distractions = request.Distractions?.Trim(),
                Improvements = request.Improvements?.Trim()
            };
            _db.JournalEntries.Add(entry);
        }
        else
        {
            entry.Accomplishments = request.Accomplishments?.Trim();
            entry.Distractions = request.Distractions?.Trim();
            entry.Improvements = request.Improvements?.Trim();
        }

        await _db.SaveChangesAsync(ct);
        return MapToDto(entry);
    }

    public async Task DeleteByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default)
    {
        var entry = await _db.JournalEntries
            .FirstOrDefaultAsync(j => j.UserId == userId && j.EntryDate == date, ct)
            ?? throw new NotFoundAppException("Journal entry not found.");

        _db.JournalEntries.Remove(entry);
        await _db.SaveChangesAsync(ct);
    }

    private static JournalEntryDto MapToDto(JournalEntry j) => new()
    {
        Id = j.Id,
        EntryDate = j.EntryDate,
        Accomplishments = j.Accomplishments,
        Distractions = j.Distractions,
        Improvements = j.Improvements,
        CreatedAtUtc = j.CreatedAtUtc,
        UpdatedAtUtc = j.UpdatedAtUtc
    };
}

