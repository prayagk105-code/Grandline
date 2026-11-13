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
}

