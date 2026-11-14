using Dayform.Application.Common;
using Dayform.Application.DTOs.Profile;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/profile")]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly ICurrentUserService _currentUser;

    public ProfileController(IProfileService profileService, ICurrentUserService currentUser)
    {
        _profileService = profileService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<ProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var data = await _profileService.GetProfileAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<ProfileDto>.Ok(data));
    }

    [HttpPut]
    [ProducesResponseType(typeof(ApiResponse<ProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var data = await _profileService.UpdateProfileAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<ProfileDto>.Ok(data, "Profile updated."));
    }

    [HttpGet("export")]
    [ProducesResponseType(typeof(ApiResponse<UserExportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Export(CancellationToken ct)
    {
        var data = await _profileService.ExportDataAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<UserExportDto>.Ok(data));
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct)
    {
        var csv = await _profileService.ExportCsvAsync(_currentUser.UserId, ct);
        var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv", $"grandline_export_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpPost("backup/restore")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RestoreBackup([FromBody] UserExportDto request, CancellationToken ct)
    {
        await _profileService.RestoreDataAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<string>.Ok("Success", "Backup restored successfully."));
    }

    [HttpPost("pin")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetPin([FromBody] SetPinRequest request, CancellationToken ct)
    {
        await _profileService.SetPinAsync(_currentUser.UserId, request.Pin, ct);
        return Ok(ApiResponse<string>.Ok("Success", string.IsNullOrWhiteSpace(request.Pin) ? "PIN removed." : "PIN set successfully."));
    }

    [HttpPost("pin/verify")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> VerifyPin([FromBody] VerifyPinRequest request, CancellationToken ct)
    {
        var valid = await _profileService.VerifyPinAsync(_currentUser.UserId, request.Pin, ct);
        return Ok(ApiResponse<bool>.Ok(valid, valid ? "PIN verified." : "Incorrect PIN."));
    }

    [HttpDelete("account")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteAccount(CancellationToken ct)
    {
        await _profileService.DeleteAccountAsync(_currentUser.UserId, ct);
        return NoContent();
    }
}
