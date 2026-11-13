using System.Diagnostics;
using System.Text.Json;
using Dayform.Application.Interfaces;
using Dayform.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Dayform.Infrastructure.Services;

public class NodeMailerEmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<NodeMailerEmailService> _logger;

    public NodeMailerEmailService(
        IOptions<EmailOptions> options,
        ILogger<NodeMailerEmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<SendOtpResult> SendOtpAsync(string toEmail, string displayName, string otp, CancellationToken ct = default)
    {
        var scriptPath = FindMailerScriptPath();
        if (string.IsNullOrWhiteSpace(scriptPath) || !File.Exists(scriptPath))
        {
            _logger.LogWarning("[NodeMailer] sendOtp.mjs not found. Fallback simulated OTP for {Email}: {Otp}", toEmail, otp);
            return new SendOtpResult
            {
                Success = true,
                Simulated = true,
                SimulatedOtp = otp
            };
        }

        try
        {
            var sender = !string.IsNullOrWhiteSpace(_options.SenderEmail) ? _options.SenderEmail : "prayagk806@gmail.com";
            var pass = (_options.AppPassword ?? Environment.GetEnvironmentVariable("GMAIL_APP_PASSWORD") ?? Environment.GetEnvironmentVariable("SMTP_PASS") ?? string.Empty).Replace(" ", "");

            if (string.IsNullOrWhiteSpace(pass))
            {
                return new SendOtpResult
                {
                    Success = false,
                    Error = "Gmail App Password is not configured for prayagk806@gmail.com. Please provide your 16-character Google App Password in backend/.env (GMAIL_APP_PASSWORD) so emails can be sent."
                };
            }

            var psi = new ProcessStartInfo
            {
                FileName = "node",
                Arguments = $"\"{scriptPath}\" --to \"{EscapeArg(toEmail)}\" --otp \"{EscapeArg(otp)}\" --name \"{EscapeArg(displayName)}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            psi.Environment["SMTP_USER"] = sender;
            psi.Environment["GMAIL_USER"] = sender;
            if (!string.IsNullOrWhiteSpace(pass))
            {
                psi.Environment["SMTP_PASS"] = pass;
                psi.Environment["GMAIL_APP_PASSWORD"] = pass;
            }

            using var process = new Process { StartInfo = psi };
            process.Start();

            var stdoutTask = process.StandardOutput.ReadToEndAsync(ct);
            var stderrTask = process.StandardError.ReadToEndAsync(ct);

            await process.WaitForExitAsync(ct);
            var stdout = await stdoutTask;
            var stderr = await stderrTask;

            var rawJson = !string.IsNullOrWhiteSpace(stdout) ? stdout.Trim() : stderr.Trim();
            if (!string.IsNullOrWhiteSpace(rawJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(rawJson);
                    var root = doc.RootElement;
                    var success = root.TryGetProperty("success", out var sProp) && sProp.GetBoolean();
                    var simulated = root.TryGetProperty("simulated", out var simProp) && simProp.GetBoolean();
                    var error = root.TryGetProperty("error", out var errProp) ? errProp.GetString() : null;

                    if (success)
                    {
                        if (simulated)
                        {
                            _logger.LogInformation("[NodeMailer] Simulated OTP for {Email}: {Otp} (GMAIL_APP_PASSWORD not set)", toEmail, otp);
                        }
                        else
                        {
                            _logger.LogInformation("[NodeMailer] Real OTP email dispatched from {Sender} to {Email}", sender, toEmail);
                        }

                        return new SendOtpResult
                        {
                            Success = true,
                            Simulated = simulated,
                            SimulatedOtp = simulated ? otp : null
                        };
                    }

                    _logger.LogWarning("[NodeMailer] Dispatch returned error: {Error}", error);
                    return new SendOtpResult
                    {
                        Success = false,
                        Error = error ?? "Failed to send verification email."
                    };
                }
                catch (JsonException)
                {
                    _logger.LogWarning("[NodeMailer] Could not parse node output: {Output}", rawJson);
                }
            }

            _logger.LogInformation("[NodeMailer] Fallback OTP for {Email}: {Otp}", toEmail, otp);
            return new SendOtpResult
            {
                Success = true,
                Simulated = true,
                SimulatedOtp = otp
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[NodeMailer] Exception while running mailer script. Falling back to simulated OTP for {Email}: {Otp}", toEmail, otp);
            return new SendOtpResult
            {
                Success = true,
                Simulated = true,
                SimulatedOtp = otp
            };
        }
    }

    private static string EscapeArg(string arg)
    {
        return arg.Replace("\"", "\\\"");
    }

    private static string? FindMailerScriptPath()
    {
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "backend", "mailer", "sendOtp.mjs"),
            Path.Combine(Directory.GetCurrentDirectory(), "mailer", "sendOtp.mjs"),
            Path.Combine(AppContext.BaseDirectory, "mailer", "sendOtp.mjs"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "mailer", "sendOtp.mjs"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "backend", "mailer", "sendOtp.mjs"),
            Path.Combine("D:", "Daily Tracker", "backend", "mailer", "sendOtp.mjs")
        };

        foreach (var path in candidates)
        {
            if (File.Exists(path))
            {
                return Path.GetFullPath(path);
            }
        }

        return null;
    }
}

