using Dayform.Domain.Enums;

namespace Dayform.Application.DTOs.Auth;

public class RegisterRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? TimeZoneId { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class UserDto
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public ThemePreference ThemePreference { get; set; }
    public DateOnly JourneyStartDate { get; set; }
    public string TimeZoneId { get; set; } = "UTC";
    public bool IsDemoUser { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public UserDto User { get; set; } = null!;
}

public class RefreshRequest
{
    public string? RefreshToken { get; set; }
}

public class LogoutRequest
{
    public string? RefreshToken { get; set; }
}

public class ForgotPasswordResponse
{
    public string Message { get; set; } = string.Empty;
    public string? DevelopmentResetToken { get; set; }
}

public class SendOtpRequest
{
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
}

public class SendOtpResponse
{
    public string Message { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public string? DevelopmentOtp { get; set; }
}

public class VerifyOtpAndRegisterRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
    public string? TimeZoneId { get; set; }
}


