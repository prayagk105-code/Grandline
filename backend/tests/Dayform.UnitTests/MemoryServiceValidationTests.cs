using Dayform.Application.Common;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.Interfaces;
using Dayform.Application.Services;
using FluentValidation;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Dayform.UnitTests;

public class MemoryServiceValidationTests
{
    private static MemoryService CreateService(Mock<IImageStorageService>? storageMock = null)
    {
        var dbMock = new Mock<IDayformDbContext>();
        var imgMock = storageMock ?? new Mock<IImageStorageService>();
        var createValidatorMock = new Mock<IValidator<CreateMemoryRequest>>();
        var updateValidatorMock = new Mock<IValidator<UpdateMemoryRequest>>();

        return new MemoryService(
            dbMock.Object,
            imgMock.Object,
            createValidatorMock.Object,
            updateValidatorMock.Object,
            NullLogger<MemoryService>.Instance);
    }

    [Fact]
    public async Task UploadMemoryImageAsync_RejectsEmptyFile()
    {
        var service = CreateService();
        using var ms = new MemoryStream();

        var ex = await Assert.ThrowsAsync<BadRequestException>(() =>
            service.UploadMemoryImageAsync(Guid.NewGuid(), Guid.NewGuid(), ms, "empty.png", "image/png", 0));

        Assert.Equal("empty_file", ex.ErrorCode);
    }

    [Fact]
    public async Task UploadMemoryImageAsync_RejectsOversizedFile()
    {
        var service = CreateService();
        using var ms = new MemoryStream(new byte[16]);

        var ex = await Assert.ThrowsAsync<BadRequestException>(() =>
            service.UploadMemoryImageAsync(Guid.NewGuid(), Guid.NewGuid(), ms, "big.png", "image/png", MemoryService.MaxImageBytes + 1));

        Assert.Equal("file_too_large", ex.ErrorCode);
    }

    [Fact]
    public async Task UploadMemoryImageAsync_RejectsUnsupportedMimeType()
    {
        var service = CreateService();
        using var ms = new MemoryStream(new byte[16]);

        var ex = await Assert.ThrowsAsync<BadRequestException>(() =>
            service.UploadMemoryImageAsync(Guid.NewGuid(), Guid.NewGuid(), ms, "script.svg", "image/svg+xml", 16));

        Assert.Equal("unsupported_media_type", ex.ErrorCode);
    }
}

