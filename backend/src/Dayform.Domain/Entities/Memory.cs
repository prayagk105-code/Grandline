using Dayform.Domain.Common;
using Dayform.Domain.Enums;

namespace Dayform.Domain.Entities;

public class Memory : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly MemoryDate { get; set; }
    public MemoryCategory Category { get; set; } = MemoryCategory.Everyday;
    public string? Note { get; set; }
    public string? Icon { get; set; }
    public int GradientIndex { get; set; }

    public User User { get; set; } = null!;
    public MediaAsset? MediaAsset { get; set; }
}

public class MediaAsset
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid? MemoryId { get; set; }
    public string Provider { get; set; } = "Cloudinary";
    public string PublicId { get; set; } = string.Empty;
    public string SecureUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "image";
    public string Format { get; set; } = string.Empty;
    public long Bytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Memory? Memory { get; set; }
}

