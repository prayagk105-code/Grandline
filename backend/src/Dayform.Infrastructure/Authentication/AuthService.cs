using System.Security.Cryptography;
using Dayform.Application.Common;
using Dayform.Application.DTOs.Auth;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Dayform.Infrastructure.Configuration;
using Dayform.Infrastructure.Data;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Dayform.Infrastructure.Authentication;

public class AuthService : IAuthService
{
    private readonly DayformDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly JwtOptions _jwtOptions;
    private readonly DemoOptions _demoOptions;
    private readonly IDemoSeedService _demoSeedService;
    private readonly IEmailService _emailService;
    private readonly EmailOptions _emailOptions;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<ForgotPasswordRequest> _forgotValidator;
    private readonly IValidator<ResetPasswordRequest> _resetValidator;
    private readonly IValidator<SendOtpRequest> _sendOtpValidator;
    private readonly IValidator<VerifyOtpAndRegisterRequest> _verifyOtpValidator;

    public AuthService(
        DayformDbContext db,
        ITokenService tokenService,
        IPasswordHasher<User> passwordHasher,
        IOptions<JwtOptions> jwtOptions,
        IOptions<DemoOptions> demoOptions,
        IDemoSeedService demoSeedService,
        IEmailService emailService,
        IOptions<EmailOptions> emailOptions,
        IValidator<RegisterRequest> registerValidator,
        IValidator<LoginRequest> loginValidator,
        IValidator<ForgotPasswordRequest> forgotValidator,
        IValidator<ResetPasswordRequest> resetValidator,
        IValidator<SendOtpRequest> sendOtpValidator,
        IValidator<VerifyOtpAndRegisterRequest> verifyOtpValidator)
    {
        _db = db;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _jwtOptions = jwtOptions.Value;
        _demoOptions = demoOptions.Value;
        _demoSeedService = demoSeedService;
        _emailService = emailService;
        _emailOptions = emailOptions.Value;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
        _forgotValidator = forgotValidator;
        _resetValidator = resetValidator;
        _sendOtpValidator = sendOtpValidator;
        _verifyOtpValidator = verifyOtpValidator;
    }

    public async Task<AuthResultWithRefresh> RegisterAsync(RegisterRequest request, string? userAgent, CancellationToken ct = default)
    {
        await ValidateAsync(_registerValidator, request, ct);

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var exists = await _db.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmail, ct);
        if (exists)
            throw new ConflictAppException("An account with this email already exists.", "email_in_use");

        var user = new User
        {
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? request.Email.Split('@')[0] : request.DisplayName.Trim(),
            Email = request.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            TimeZoneId = string.IsNullOrWhiteSpace(request.TimeZoneId) ? "UTC" : request.TimeZoneId.Trim(),
            JourneyStartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            IsActive = true,
            IsDemoUser = false
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return await IssueSessionTokensAsync(user, userAgent, ct);
    }

    public async Task<SendOtpResponse> SendOtpAsync(SendOtpRequest request, bool isDevelopment, CancellationToken ct = default)
    {
        await ValidateAsync(_sendOtpValidator, request, ct);

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var exists = await _db.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmail && u.IsActive, ct);
        if (exists)
            throw new ConflictAppException("An account with this email already exists.", "email_in_use");

        // Invalidate prior pending OTPs for this email
        var pendingOtps = await _db.EmailOtps
            .Where(o => o.Email == normalizedEmail && o.UsedAtUtc == null && o.ExpiresAtUtc > DateTime.UtcNow)
            .ToListAsync(ct);
        foreach (var p in pendingOtps)
        {
            p.UsedAtUtc = DateTime.UtcNow;
        }

        var rawOtp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        var otpHash = _tokenService.HashToken(rawOtp);
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(10);

        _db.EmailOtps.Add(new EmailOtp
        {
            Email = normalizedEmail,
            OtpHash = otpHash,
            ExpiresAtUtc = expiresAtUtc,
            Attempts = 0
        });

        await _db.SaveChangesAsync(ct);

        var displayName = !string.IsNullOrWhiteSpace(request.DisplayName) ? request.DisplayName.Trim() : "there";
        var emailResult = await _emailService.SendOtpAsync(request.Email.Trim(), displayName, rawOtp, ct);

        if (!emailResult.Success)
        {
            throw new BadRequestException(emailResult.Error ?? "Could not send verification email. Please check your email configuration.", "email_send_failed");
        }

        return new SendOtpResponse
        {
            Message = "Verification code sent to your email.",
            ExpiresAtUtc = expiresAtUtc,
            DevelopmentOtp = isDevelopment && emailResult.Simulated ? rawOtp : null
        };
    }

    public async Task<AuthResultWithRefresh> VerifyOtpAndRegisterAsync(VerifyOtpAndRegisterRequest request, string? userAgent, CancellationToken ct = default)
    {
        await ValidateAsync(_verifyOtpValidator, request, ct);

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var exists = await _db.Users.AnyAsync(u => u.NormalizedEmail == normalizedEmail, ct);
        if (exists)
            throw new ConflictAppException("An account with this email already exists.", "email_in_use");

        var otpRecord = await _db.EmailOtps
            .Where(o => o.Email == normalizedEmail && o.UsedAtUtc == null)
            .OrderByDescending(o => o.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

        if (otpRecord is null || DateTime.UtcNow >= otpRecord.ExpiresAtUtc)
        {
            throw new BadRequestException("Verification code has expired or is invalid. Please request a new code.", "invalid_otp");
        }

        if (otpRecord.Attempts >= 5)
        {
            throw new BadRequestException("Too many invalid attempts. Please request a new verification code.", "otp_attempts_exceeded");
        }

        var expectedHash = _tokenService.HashToken(request.Otp.Trim());
        if (otpRecord.OtpHash != expectedHash)
        {
            otpRecord.Attempts++;
            await _db.SaveChangesAsync(ct);
            throw new BadRequestException("Incorrect verification code. Please check and try again.", "incorrect_otp");
        }

        otpRecord.UsedAtUtc = DateTime.UtcNow;

        var user = new User
        {
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? request.Email.Split('@')[0] : request.DisplayName.Trim(),
            Email = request.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            TimeZoneId = string.IsNullOrWhiteSpace(request.TimeZoneId) ? "UTC" : request.TimeZoneId.Trim(),
            JourneyStartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            IsActive = true,
            IsDemoUser = false
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        return await IssueSessionTokensAsync(user, userAgent, ct);
    }

    public async Task<AuthResultWithRefresh> LoginAsync(LoginRequest request, string? userAgent, CancellationToken ct = default)
    {
        await ValidateAsync(_loginValidator, request, ct);

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail && u.IsActive, ct);
        if (user is null)
            throw new UnauthorizedAppException("Invalid email or password.", "invalid_credentials");

        var verify = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verify == PasswordVerificationResult.Failed)
            throw new UnauthorizedAppException("Invalid email or password.", "invalid_credentials");

        if (verify == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
            await _db.SaveChangesAsync(ct);
        }

        return await IssueSessionTokensAsync(user, userAgent, ct);
    }

    public async Task<AuthResultWithRefresh> RefreshAsync(string rawRefreshToken, string? userAgent, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
            throw new UnauthorizedAppException("Refresh token is missing.", "missing_refresh_token");

        var hash = _tokenService.HashToken(rawRefreshToken);
        var existing = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == hash, ct);

        if (existing is null)
            throw new UnauthorizedAppException("Invalid refresh token.", "invalid_refresh_token");

        if (existing.RevokedAtUtc is not null)
        {
            // Token reuse detected — revoke all active tokens for this user
            var activeTokens = await _db.RefreshTokens
                .Where(rt => rt.UserId == existing.UserId && rt.RevokedAtUtc == null)
                .ToListAsync(ct);
            foreach (var t in activeTokens)
                t.RevokedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            throw new UnauthorizedAppException("Refresh token has already been used or revoked.", "refresh_token_reused");
        }

        if (DateTime.UtcNow >= existing.ExpiresAtUtc || !existing.User.IsActive)
            throw new UnauthorizedAppException("Refresh token has expired.", "refresh_token_expired");

        var newRaw = _tokenService.GenerateRefreshToken();
        var newHash = _tokenService.HashToken(newRaw);
        var refreshDays = _jwtOptions.RefreshTokenDays > 0 ? _jwtOptions.RefreshTokenDays : 14;
        var refreshExpires = DateTime.UtcNow.AddDays(refreshDays);

        existing.RevokedAtUtc = DateTime.UtcNow;
        existing.ReplacedByTokenHash = newHash;

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = existing.UserId,
            TokenHash = newHash,
            ExpiresAtUtc = refreshExpires,
            UserAgent = Truncate(userAgent, 300)
        });

        await _db.SaveChangesAsync(ct);

        var (accessToken, expiresAtUtc) = _tokenService.GenerateAccessToken(existing.User);
        return new AuthResultWithRefresh
        {
            RawRefreshToken = newRaw,
            RefreshExpiresAtUtc = refreshExpires,
            Response = new AuthResponse
            {
                AccessToken = accessToken,
                ExpiresAtUtc = expiresAtUtc,
                User = MapUserDto(existing.User)
            }
        };
    }

    public async Task LogoutAsync(string? rawRefreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
            return;

        var hash = _tokenService.HashToken(rawRefreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == hash, ct);
        if (token is not null && token.RevokedAtUtc is null)
        {
            token.RevokedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request, bool isDevelopment, CancellationToken ct = default)
    {
        await ValidateAsync(_forgotValidator, request, ct);

        const string genericMsg = "If an account with that email exists, password reset instructions have been prepared.";
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail && u.IsActive, ct);

        if (user is null)
        {
            return new ForgotPasswordResponse { Message = genericMsg };
        }

        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var hash = _tokenService.HashToken(rawToken);

        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = hash,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(1)
        });

        await _db.SaveChangesAsync(ct);

        return new ForgotPasswordResponse
        {
            Message = genericMsg,
            DevelopmentResetToken = isDevelopment ? rawToken : null
        };
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        await ValidateAsync(_resetValidator, request, ct);

        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail && u.IsActive, ct)
            ?? throw new BadRequestException("Invalid or expired password reset token.", "invalid_reset_token");

        var hash = _tokenService.HashToken(request.Token.Trim());
        var tokenRecord = await _db.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.UserId == user.Id && t.TokenHash == hash, ct);

        if (tokenRecord is null || !tokenRecord.IsValid)
            throw new BadRequestException("Invalid or expired password reset token.", "invalid_reset_token");

        tokenRecord.UsedAtUtc = DateTime.UtcNow;
        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);

        // Revoke all refresh tokens after password reset
        var activeRefreshTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAtUtc == null)
            .ToListAsync(ct);
        foreach (var rt in activeRefreshTokens)
            rt.RevokedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct)
            ?? throw new NotFoundAppException("User not found.");

        return MapUserDto(user);
    }

    public async Task<AuthResultWithRefresh> DemoLoginAsync(string? userAgent, CancellationToken ct = default)
    {
        if (!_demoOptions.Enabled)
            throw new ForbiddenAppException("Demo sign-in is disabled in this environment.", "demo_disabled");

        await _demoSeedService.SeedDemoDataAsync(resetExisting: false, ct);

        var normalizedEmail = _demoOptions.Email.Trim().ToUpperInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail && u.IsDemoUser && u.IsActive, ct)
            ?? throw new NotFoundAppException("Demo user account is not available.");

        return await IssueSessionTokensAsync(user, userAgent, ct);
    }

    private async Task<AuthResultWithRefresh> IssueSessionTokensAsync(User user, string? userAgent, CancellationToken ct)
    {
        var (accessToken, expiresAtUtc) = _tokenService.GenerateAccessToken(user);
        var rawRefresh = _tokenService.GenerateRefreshToken();
        var refreshHash = _tokenService.HashToken(rawRefresh);
        var refreshDays = _jwtOptions.RefreshTokenDays > 0 ? _jwtOptions.RefreshTokenDays : 14;
        var refreshExpires = DateTime.UtcNow.AddDays(refreshDays);

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAtUtc = refreshExpires,
            UserAgent = Truncate(userAgent, 300)
        });
        await _db.SaveChangesAsync(ct);

        return new AuthResultWithRefresh
        {
            RawRefreshToken = rawRefresh,
            RefreshExpiresAtUtc = refreshExpires,
            Response = new AuthResponse
            {
                AccessToken = accessToken,
                ExpiresAtUtc = expiresAtUtc,
                User = MapUserDto(user)
            }
        };
    }

    private static async Task ValidateAsync<T>(IValidator<T> validator, T instance, CancellationToken ct)
    {
        var res = await validator.ValidateAsync(instance, ct);
        if (!res.IsValid)
        {
            var errors = res.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationAppException(errors);
        }
    }

    private static UserDto MapUserDto(User u) => new()
    {
        Id = u.Id,
        DisplayName = u.DisplayName,
        Email = u.Email,
        ThemePreference = u.ThemePreference,
        JourneyStartDate = u.JourneyStartDate,
        TimeZoneId = u.TimeZoneId,
        IsDemoUser = u.IsDemoUser,
        CreatedAtUtc = u.CreatedAtUtc
    };

    private static string? Truncate(string? value, int maxLen) =>
        string.IsNullOrWhiteSpace(value) ? null : (value.Length <= maxLen ? value : value[..maxLen]);
}

