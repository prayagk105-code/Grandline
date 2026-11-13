using Dayform.Domain.Enums;

namespace Dayform.Application.DTOs.Memories;

public class CreateMemoryRequest
{
    public string Title { get; set; } = string.Empty;
    public DateOnly MemoryDate { get; set; }
    public MemoryCategory Category { get; set; } = MemoryCategory.Everyday;
    public string? Note { get; set; }
    public string? Icon { get; set; }
}

public class UpdateMemoryRequest
{
    public string Title { get; set; } = string.Empty;
    public DateOnly MemoryDate { get; set; }
    public MemoryCategory Category { get; set; } = MemoryCategory.Everyday;
    public string? Note { get; set; }
    public string? Icon { get; set; }
}

public class MediaAssetDto
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = "Cloudinary";
    public string PublicId { get; set; } = string.Empty;
    public string SecureUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "image";
    public string Format { get; set; } = string.Empty;
    public long Bytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
}

public class MemoryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly MemoryDate { get; set; }
    public MemoryCategory Category { get; set; }
    public string? Note { get; set; }
    public string? Icon { get; set; }
    public int GradientIndex { get; set; }
    public MediaAssetDto? Image { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

