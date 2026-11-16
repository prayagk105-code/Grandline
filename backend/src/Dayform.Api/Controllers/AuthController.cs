using Dayform.Application.Common;
using Dayform.Application.DTOs.Auth;
using Dayform.Application.Interfaces;
using Dayform.Infrastructure.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Dayform.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private const string RefreshCookieName = "dayform_refresh_token";
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUser;
    private readonly IHostEnvironment _env;
    private readonly DemoOptions _demoOptions;
    private readonly IDemoSeedService _demoSeedService;

    public AuthController(
        IAuthService authService,
        ICurrentUserService currentUser,
        IHostEnvironment env,
        IOptions<DemoOptions> demoOptions,
        IDemoSeedService demoSeedService)
    {
        _authService = authService;
        _currentUser = currentUser;
        _env = env;
        _demoOptions = demoOptions.Value;
        _demoSeedService = demoSeedService;
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await _authService.RegisterAsync(request, Request.Headers.UserAgent.ToString(), ct);
        SetRefreshCookie(result.RawRefreshToken, result.RefreshExpiresAtUtc);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<AuthResponse>.Ok(result.Response, "Account created successfully."));
    }

    [HttpPost("send-otp")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<SendOtpResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request, CancellationToken ct)
    {
        var isTestEnv = _env.IsEnvironment("Testing");
        var result = await _authService.SendOtpAsync(request, isTestEnv, ct);
        return Ok(ApiResponse<SendOtpResponse>.Ok(result, result.Message));
    }

    [HttpPost("verify-otp-and-register")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    public async Task<IActionResult> VerifyOtpAndRegister([FromBody] VerifyOtpAndRegisterRequest request, CancellationToken ct)
    {
        var result = await _authService.VerifyOtpAndRegisterAsync(request, Request.Headers.UserAgent.ToString(), ct);
        SetRefreshCookie(result.RawRefreshToken, result.RefreshExpiresAtUtc);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<AuthResponse>.Ok(result.Response, "Account verified and created successfully."));
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _authService.LoginAsync(request, Request.Headers.UserAgent.ToString(), ct);
        SetRefreshCookie(result.RawRefreshToken, result.RefreshExpiresAtUtc);
        return Ok(ApiResponse<AuthResponse>.Ok(result.Response, "Signed in successfully."));
    }

    [HttpPost("demo-login")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DemoLogin(CancellationToken ct)
    {
        if (!_env.IsDevelopment() || !_demoOptions.Enabled)
            return NotFound();

        var result = await _authService.DemoLoginAsync(Request.Headers.UserAgent.ToString(), ct);
        SetRefreshCookie(result.RawRefreshToken, result.RefreshExpiresAtUtc);
        return Ok(ApiResponse<AuthResponse>.Ok(result.Response, "Signed into development demo account."));
    }

    [HttpPost("demo-reset")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetDemoData(CancellationToken ct)
    {
        if (!_env.IsDevelopment() || !_demoOptions.Enabled)
            return NotFound();

        var current = await _authService.GetCurrentUserAsync(_currentUser.UserId, ct);
        if (!current.IsDemoUser)
            return Forbid();

        await _demoSeedService.SeedDemoDataAsync(resetExisting: true, ct);
        return Ok(ApiResponse<object>.Ok(new { reset = true }, "Demo data reset successfully."));
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest? request, CancellationToken ct)
    {
        var rawToken = request?.RefreshToken;
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            rawToken = Request.Cookies[RefreshCookieName];
        }

        if (string.IsNullOrWhiteSpace(rawToken))
            throw new UnauthorizedAppException("Refresh token is missing.", "missing_refresh_token");

        var result = await _authService.RefreshAsync(rawToken, Request.Headers.UserAgent.ToString(), ct);
        SetRefreshCookie(result.RawRefreshToken, result.RefreshExpiresAtUtc);
        return Ok(ApiResponse<AuthResponse>.Ok(result.Response, "Session refreshed."));
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest? request, CancellationToken ct)
    {
        var rawToken = request?.RefreshToken;
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            rawToken = Request.Cookies[RefreshCookieName];
        }
        await _authService.LogoutAsync(rawToken, ct);
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Secure = Request.IsHttps,
            Path = "/api/v1/auth"
        });
        return NoContent();
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<ForgotPasswordResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        var res = await _authService.ForgotPasswordAsync(request, _env.IsDevelopment(), ct);
        return Ok(ApiResponse<ForgotPasswordResponse>.Ok(res, res.Message));
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        await _authService.ResetPasswordAsync(request, ct);
        return Ok(ApiResponse<object>.Ok(new { reset = true }, "Password updated successfully."));
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var user = await _authService.GetCurrentUserAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<UserDto>.Ok(user));
    }

    private void SetRefreshCookie(string rawRefreshToken, DateTime expiresAtUtc)
    {
        Response.Cookies.Append(RefreshCookieName, rawRefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Expires = expiresAtUtc,
            Path = "/api/v1/auth"
        });
    }
}

