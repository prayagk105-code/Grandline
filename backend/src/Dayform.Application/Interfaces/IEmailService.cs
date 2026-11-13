namespace Dayform.Application.Interfaces;

public class SendOtpResult
{
    public bool Success { get; set; }
    public bool Simulated { get; set; }
    public string? Error { get; set; }
    public string? SimulatedOtp { get; set; }
}

public interface IEmailService
{
    Task<SendOtpResult> SendOtpAsync(string toEmail, string displayName, string otp, CancellationToken ct = default);
}

