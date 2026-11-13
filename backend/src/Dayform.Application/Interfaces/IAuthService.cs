using Dayform.Application.DTOs.Auth;

namespace Dayform.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResultWithRefresh> RegisterAsync(RegisterRequest request, string? userAgent, CancellationToken ct = default);
    Task<SendOtpResponse> SendOtpAsync(SendOtpRequest request, bool isDevelopment, CancellationToken ct = default);
    Task<AuthResultWithRefresh> VerifyOtpAndRegisterAsync(VerifyOtpAndRegisterRequest request, string? userAgent, CancellationToken ct = default);
    Task<AuthResultWithRefresh> LoginAsync(LoginRequest request, string? userAgent, CancellationToken ct = default);
    Task<AuthResultWithRefresh> RefreshAsync(string rawRefreshToken, string? userAgent, CancellationToken ct = default);
    Task LogoutAsync(string? rawRefreshToken, CancellationToken ct = default);
    Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request, bool isDevelopment, CancellationToken ct = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
    Task<AuthResultWithRefresh> DemoLoginAsync(string? userAgent, CancellationToken ct = default);
}

public class AuthResultWithRefresh
{
    public AuthResponse Response { get; set; } = null!;
    public string RawRefreshToken { get; set; } = string.Empty;
    public DateTime RefreshExpiresAtUtc { get; set; }
}

