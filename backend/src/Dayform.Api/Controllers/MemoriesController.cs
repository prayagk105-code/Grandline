using Dayform.Application.Common;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.Interfaces;
using Dayform.Application.Services;
using Dayform.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/memories")]
public class MemoriesController : ControllerBase
{
    private readonly IMemoryService _memoryService;
    private readonly ICurrentUserService _currentUser;

    public MemoriesController(IMemoryService memoryService, ICurrentUserService currentUser)
    {
        _memoryService = memoryService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MemoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] MemoryCategory? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var data = await _memoryService.GetMemoriesAsync(_currentUser.UserId, category, page, pageSize, ct);
        return Ok(ApiResponse<PagedResult<MemoryDto>>.Ok(data));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MemoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var data = await _memoryService.GetMemoryByIdAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<MemoryDto>.Ok(data));
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<MemoryDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateMemoryRequest request, CancellationToken ct)
    {
        var data = await _memoryService.CreateMemoryAsync(_currentUser.UserId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = data.Id }, ApiResponse<MemoryDto>.Ok(data, "Memory saved."));
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<MemoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMemoryRequest request, CancellationToken ct)
    {
        var data = await _memoryService.UpdateMemoryAsync(_currentUser.UserId, id, request, ct);
        return Ok(ApiResponse<MemoryDto>.Ok(data, "Memory updated."));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _memoryService.DeleteMemoryAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/image")]
    [RequestSizeLimit(MemoryService.MaxImageBytes + 1024 * 64)]
    [ProducesResponseType(typeof(ApiResponse<MemoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UploadImage(Guid id, IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new BadRequestException("Please select an image file to upload.", "missing_file");

        await using var stream = file.OpenReadStream();
        var data = await _memoryService.UploadMemoryImageAsync(
            _currentUser.UserId,
            id,
            stream,
            file.FileName,
            file.ContentType,
            file.Length,
            ct);

        return Ok(ApiResponse<MemoryDto>.Ok(data, "Image uploaded."));
    }

    [HttpDelete("{id:guid}/image")]
    [ProducesResponseType(typeof(ApiResponse<MemoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteImage(Guid id, CancellationToken ct)
    {
        var data = await _memoryService.DeleteMemoryImageAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<MemoryDto>.Ok(data, "Image removed."));
    }
}

