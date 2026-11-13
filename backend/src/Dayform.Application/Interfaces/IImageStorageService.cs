namespace Dayform.Application.Interfaces;

public class ImageUploadRequest
{
    public Stream Content { get; set; } = Stream.Null;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Length { get; set; }
    public string Folder { get; set; } = string.Empty;
    public string PublicIdPrefix { get; set; } = string.Empty;
}

public class ImageUploadResult
{
    public string Provider { get; set; } = "Cloudinary";
    public string PublicId { get; set; } = string.Empty;
    public string SecureUrl { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "image";
    public string Format { get; set; } = string.Empty;
    public long Bytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
}

public interface IImageStorageService
{
    bool IsConfigured { get; }
    Task<ImageUploadResult> UploadImageAsync(ImageUploadRequest request, CancellationToken ct = default);
    Task DeleteImageAsync(string publicId, CancellationToken ct = default);
}

