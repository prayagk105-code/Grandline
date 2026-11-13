namespace Dayform.Application.DTOs.Journal;

public class UpsertJournalRequest
{
    public string? Accomplishments { get; set; }
    public string? Distractions { get; set; }
    public string? Improvements { get; set; }
}

public class JournalEntryDto
{
    public Guid Id { get; set; }
    public DateOnly EntryDate { get; set; }
    public string? Accomplishments { get; set; }
    public string? Distractions { get; set; }
    public string? Improvements { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}

