using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class Book : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public int TotalPages { get; set; } = 0;
    public int CurrentPage { get; set; } = 0;
    public string Status { get; set; } = "Reading"; // ToRead, Reading, Completed
    public int Rating { get; set; } = 5; // 1 to 5
    public string? CoverImageUrl { get; set; }
    public DateOnly? StartedDate { get; set; }
    public DateOnly? FinishedDate { get; set; }
    public string? KeyLessons { get; set; }

    public User User { get; set; } = null!;
    public ICollection<PersonalNote> Notes { get; set; } = new List<PersonalNote>();
}

public class PersonalNote : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid? BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = "Personal"; // Personal, BookNotes, Idea, Quote, Commonplace, Reflection
    public string? Tags { get; set; } // Comma separated
    public bool IsFavorite { get; set; } = false;

    public User User { get; set; } = null!;
    public Book? Book { get; set; }
}

public class IdeaItem : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "General";
    public string Status { get; set; } = "Raw"; // Raw, Developing, Implemented, Archived

    public User User { get; set; } = null!;
}

public class SavedQuote : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid? BookId { get; set; }
    public string QuoteText { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? Source { get; set; }
    public bool IsFavorite { get; set; } = false;
    public string? Tags { get; set; }

    public User User { get; set; } = null!;
}

