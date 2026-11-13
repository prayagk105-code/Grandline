using Dayform.Application.Common;
using Dayform.Application.DTOs.Memories;
using Dayform.Domain.Enums;

namespace Dayform.Application.Interfaces;

public interface IMemoryService
{
    Task<PagedResult<MemoryDto>> GetMemoriesAsync(Guid userId, MemoryCategory? category, int page, int pageSize, CancellationToken ct = default);
    Task<MemoryDto> GetMemoryByIdAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<MemoryDto> CreateMemoryAsync(Guid userId, CreateMemoryRequest request, CancellationToken ct = default);
    Task<MemoryDto> UpdateMemoryAsync(Guid userId, Guid id, UpdateMemoryRequest request, CancellationToken ct = default);
    Task DeleteMemoryAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<MemoryDto> UploadMemoryImageAsync(Guid userId, Guid memoryId, Stream fileStream, string fileName, string contentType, long fileSize, CancellationToken ct = default);
    Task<MemoryDto> DeleteMemoryImageAsync(Guid userId, Guid memoryId, CancellationToken ct = default);
}

