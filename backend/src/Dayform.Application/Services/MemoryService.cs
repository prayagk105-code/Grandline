using Dayform.Application.Common;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Dayform.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Dayform.Application.Services;

public class MemoryService : IMemoryService
{
    public const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB
    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif"
    };

    private readonly IDayformDbContext _db;
    private readonly IImageStorageService _imageStorage;
    private readonly IValidator<CreateMemoryRequest> _createValidator;
    private readonly IValidator<UpdateMemoryRequest> _updateValidator;
    private readonly ILogger<MemoryService> _logger;

    public MemoryService(
        IDayformDbContext db,
        IImageStorageService imageStorage,
        IValidator<CreateMemoryRequest> createValidator,
        IValidator<UpdateMemoryRequest> updateValidator,
        ILogger<MemoryService> logger)
    {
        _db = db;
        _imageStorage = imageStorage;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _logger = logger;
    }

    public async Task<PagedResult<MemoryDto>> GetMemoriesAsync(
        Guid userId,
        MemoryCategory? category,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Memories.AsNoTracking()
            .Include(m => m.MediaAsset)
            .Where(m => m.UserId == userId);

        if (category.HasValue)
            query = query.Where(m => m.Category == category.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(m => m.MemoryDate)
            .ThenByDescending(m => m.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<MemoryDto>
        {
            Items = items.Select(MapToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<MemoryDto> GetMemoryByIdAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var memory = await _db.Memories.AsNoTracking()
            .Include(m => m.MediaAsset)
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId, ct)
            ?? throw new NotFoundAppException("Memory not found.");

        return MapToDto(memory);
    }

    public async Task<MemoryDto> CreateMemoryAsync(Guid userId, CreateMemoryRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_createValidator, request, ct);

        var count = await _db.Memories.CountAsync(m => m.UserId == userId, ct);

        var memory = new Memory
        {
            UserId = userId,
            Title = request.Title.Trim(),
            MemoryDate = request.MemoryDate,
            Category = request.Category,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Icon = string.IsNullOrWhiteSpace(request.Icon) ? "star" : request.Icon.Trim(),
            GradientIndex = count % 6
        };

        _db.Memories.Add(memory);
        await _db.SaveChangesAsync(ct);

        return MapToDto(memory);
    }

    public async Task<MemoryDto> UpdateMemoryAsync(Guid userId, Guid id, UpdateMemoryRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_updateValidator, request, ct);

        var memory = await _db.Memories
            .Include(m => m.MediaAsset)
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId, ct)
            ?? throw new NotFoundAppException("Memory not found.");

        memory.Title = request.Title.Trim();
        memory.MemoryDate = request.MemoryDate;
        memory.Category = request.Category;
        memory.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        if (!string.IsNullOrWhiteSpace(request.Icon))
            memory.Icon = request.Icon.Trim();

        await _db.SaveChangesAsync(ct);
        return MapToDto(memory);
    }

    public async Task DeleteMemoryAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var memory = await _db.Memories
            .Include(m => m.MediaAsset)
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId, ct)
            ?? throw new NotFoundAppException("Memory not found.");

        if (memory.MediaAsset is not null)
        {
            if (_imageStorage.IsConfigured)
            {
                try
                {
                    await _imageStorage.DeleteImageAsync(memory.MediaAsset.PublicId, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete Cloudinary asset {PublicId} for memory {MemoryId}", memory.MediaAsset.PublicId, id);
                }
            }

            _db.MediaAssets.Remove(memory.MediaAsset);
        }

        _db.Memories.Remove(memory);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<MemoryDto> UploadMemoryImageAsync(
        Guid userId,
        Guid memoryId,
        Stream fileStream,
        string fileName,
        string contentType,
        long fileSize,
        CancellationToken ct = default)
    {
        if (fileSize <= 0)
            throw new BadRequestException("Image file is empty.", "empty_file");

        if (fileSize > MaxImageBytes)
            throw new BadRequestException("Image file exceeds the 5 MB limit.", "file_too_large");

        if (!AllowedMimeTypes.Contains(contentType))
            throw new BadRequestException("Only JPEG, PNG, WebP, and GIF images are allowed.", "unsupported_media_type");

        var memory = await _db.Memories
            .Include(m => m.MediaAsset)
            .FirstOrDefaultAsync(m => m.Id == memoryId && m.UserId == userId, ct)
            ?? throw new NotFoundAppException("Memory not found.");

        if (!_imageStorage.IsConfigured)
            throw new BadRequestException("Cloudinary image storage is not configured on the server.", "storage_not_configured");

        await using var buffer = new MemoryStream();
        await fileStream.CopyToAsync(buffer, ct);
        buffer.Position = 0;

        if (!HasValidImageSignature(buffer, contentType))
            throw new BadRequestException("File contents do not match an allowed image format.", "invalid_image_signature");

        buffer.Position = 0;

        var uploadResult = await _imageStorage.UploadImageAsync(new ImageUploadRequest
        {
            Content = buffer,
            FileName = Path.GetFileName(fileName),
            ContentType = contentType,
            Length = buffer.Length,
            Folder = $"dayform/users/{userId}/memories/{memoryId}",
            PublicIdPrefix = "photo"
        }, ct);

        var oldAsset = memory.MediaAsset;

        try
        {
            if (oldAsset is not null)
            {
                _db.MediaAssets.Remove(oldAsset);
            }

            var newAsset = new MediaAsset
            {
                UserId = userId,
                MemoryId = memory.Id,
                Provider = uploadResult.Provider,
                PublicId = uploadResult.PublicId,
                SecureUrl = uploadResult.SecureUrl,
                ResourceType = uploadResult.ResourceType,
                Format = uploadResult.Format,
                Bytes = uploadResult.Bytes,
                Width = uploadResult.Width,
                Height = uploadResult.Height
            };

            _db.MediaAssets.Add(newAsset);
            memory.MediaAsset = newAsset;
            await _db.SaveChangesAsync(ct);
        }
        catch
        {
            // Clean up newly uploaded asset if database persistence failed
            try
            {
                await _imageStorage.DeleteImageAsync(uploadResult.PublicId, CancellationToken.None);
            }
            catch (Exception cleanupEx)
            {
                _logger.LogError(cleanupEx, "Failed to roll back Cloudinary upload {PublicId} after DB save error", uploadResult.PublicId);
            }
            throw;
        }

        if (oldAsset is not null)
        {
            try
            {
                await _imageStorage.DeleteImageAsync(oldAsset.PublicId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete replaced Cloudinary asset {PublicId}", oldAsset.PublicId);
            }
        }

        return MapToDto(memory);
    }

    public async Task<MemoryDto> DeleteMemoryImageAsync(Guid userId, Guid memoryId, CancellationToken ct = default)
    {
        var memory = await _db.Memories
            .Include(m => m.MediaAsset)
            .FirstOrDefaultAsync(m => m.Id == memoryId && m.UserId == userId, ct)
            ?? throw new NotFoundAppException("Memory not found.");

        if (memory.MediaAsset is null)
            return MapToDto(memory);

        if (_imageStorage.IsConfigured)
        {
            await _imageStorage.DeleteImageAsync(memory.MediaAsset.PublicId, ct);
        }

        _db.MediaAssets.Remove(memory.MediaAsset);
        memory.MediaAsset = null;
        await _db.SaveChangesAsync(ct);

        return MapToDto(memory);
    }

    private static bool HasValidImageSignature(Stream stream, string contentType)
    {
        if (stream.Length < 12) return false;
        Span<byte> header = stackalloc byte[12];
        var read = stream.Read(header);
        if (read < 12) return false;

        // JPEG: FF D8 FF
        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return true;
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47)
            return true;
        // GIF: GIF87a or GIF89a
        if (header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38)
            return true;
        // WebP: RIFF....WEBP
        if (header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46 &&
            header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50)
            return true;

        return false;
    }

    internal static MemoryDto MapToDto(Memory m) => new()
    {
        Id = m.Id,
        Title = m.Title,
        MemoryDate = m.MemoryDate,
        Category = m.Category,
        Note = m.Note,
        Icon = m.Icon,
        GradientIndex = m.GradientIndex,
        CreatedAtUtc = m.CreatedAtUtc,
        Image = m.MediaAsset is null ? null : new MediaAssetDto
        {
            Id = m.MediaAsset.Id,
            Provider = m.MediaAsset.Provider,
            PublicId = m.MediaAsset.PublicId,
            SecureUrl = m.MediaAsset.SecureUrl,
            ResourceType = m.MediaAsset.ResourceType,
            Format = m.MediaAsset.Format,
            Bytes = m.MediaAsset.Bytes,
            Width = m.MediaAsset.Width,
            Height = m.MediaAsset.Height
        }
    };
}

