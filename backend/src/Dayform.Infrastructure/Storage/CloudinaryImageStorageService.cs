using System.Net;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Dayform.Application.Common;
using Dayform.Application.Interfaces;
using Dayform.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Dayform.Infrastructure.Storage;

public class CloudinaryImageStorageService : IImageStorageService
{
    private readonly CloudinaryOptions _options;
    private readonly ILogger<CloudinaryImageStorageService> _logger;
    private readonly Cloudinary? _client;

    public CloudinaryImageStorageService(
        IOptions<CloudinaryOptions> options,
        ILogger<CloudinaryImageStorageService> logger)
    {
        _options = options.Value;
        _logger = logger;

        if (IsConfigured)
        {
            var account = new Account(_options.CloudName, _options.ApiKey, _options.ApiSecret);
            _client = new Cloudinary(account) { Api = { Secure = true } };
        }
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.CloudName) &&
        !string.IsNullOrWhiteSpace(_options.ApiKey) &&
        !string.IsNullOrWhiteSpace(_options.ApiSecret) &&
        !_options.CloudName.StartsWith('<') &&
        !_options.ApiKey.StartsWith('<') &&
        !_options.ApiSecret.StartsWith('<');

    public async Task<Dayform.Application.Interfaces.ImageUploadResult> UploadImageAsync(ImageUploadRequest request, CancellationToken ct = default)
    {
        if (!IsConfigured || _client is null)
            throw new BadRequestException("Cloudinary image storage is not configured.", "storage_not_configured");

        var safeFileName = Path.GetFileNameWithoutExtension(request.FileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
            safeFileName = "image";

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(request.FileName, request.Content),
            Folder = request.Folder,
            PublicId = $"{request.PublicIdPrefix}_{Guid.NewGuid():N}",
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false
        };

        var result = await _client.UploadAsync(uploadParams, ct);
        if (result.Error is not null || result.StatusCode != HttpStatusCode.OK || result.SecureUrl is null)
        {
            _logger.LogError("Cloudinary upload failed: {ErrorMessage}", result.Error?.Message ?? "Unknown error");
            throw new BadRequestException("Failed to upload image to Cloudinary.", "cloudinary_upload_failed");
        }

        return new Dayform.Application.Interfaces.ImageUploadResult
        {
            Provider = "Cloudinary",
            PublicId = result.PublicId,
            SecureUrl = result.SecureUrl.ToString(),
            ResourceType = result.ResourceType ?? "image",
            Format = result.Format ?? string.Empty,
            Bytes = result.Bytes,
            Width = result.Width,
            Height = result.Height
        };
    }

    public async Task DeleteImageAsync(string publicId, CancellationToken ct = default)
    {
        if (!IsConfigured || _client is null || string.IsNullOrWhiteSpace(publicId))
            return;

        var deletionParams = new DeletionParams(publicId)
        {
            ResourceType = ResourceType.Image
        };

        var result = await _client.DestroyAsync(deletionParams);
        if (result.Error is not null)
        {
            _logger.LogWarning("Cloudinary deletion error for {PublicId}: {Error}", publicId, result.Error.Message);
        }
    }
}
