using Dayform.Application.Common;
using Dayform.Application.DTOs.Journal;

namespace Dayform.Application.Interfaces;

public interface IJournalService
{
    Task<PagedResult<JournalEntryDto>> GetEntriesAsync(Guid userId, int page, int pageSize, CancellationToken ct = default);
    Task<JournalEntryDto?> GetByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default);
    Task<JournalEntryDto> UpsertByDateAsync(Guid userId, DateOnly date, UpsertJournalRequest request, CancellationToken ct = default);
    Task DeleteByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default);
}

