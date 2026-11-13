using Dayform.Application.Interfaces;
using Dayform.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Dayform.IntegrationTests;

public class FakeImageStorageService : IImageStorageService
{
    public bool IsConfigured => true;
    public List<string> DeletedPublicIds { get; } = [];

    public Task<ImageUploadResult> UploadImageAsync(ImageUploadRequest request, CancellationToken ct = default)
    {
        var ext = Path.GetExtension(request.FileName).TrimStart('.');
        if (string.IsNullOrWhiteSpace(ext)) ext = "png";

        var id = $"{request.Folder}/{request.PublicIdPrefix}-{Guid.NewGuid():N}";
        return Task.FromResult(new ImageUploadResult
        {
            Provider = "Cloudinary",
            PublicId = id,
            SecureUrl = $"https://res.cloudinary.com/demo/image/upload/{id}.{ext}",
            ResourceType = "image",
            Format = ext,
            Bytes = request.Length,
            Width = 800,
            Height = 600
        });
    }

    public Task DeleteImageAsync(string publicId, CancellationToken ct = default)
    {
        DeletedPublicIds.Add(publicId);
        return Task.CompletedTask;
    }
}

public class FakeEmailService : IEmailService
{
    public Task<SendOtpResult> SendOtpAsync(string toEmail, string displayName, string otp, CancellationToken ct = default)
    {
        return Task.FromResult(new SendOtpResult
        {
            Success = true,
            Simulated = true,
            SimulatedOtp = otp
        });
    }
}

public class DayformWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"dayform_test_{Guid.NewGuid():N}";
    public FakeImageStorageService FakeImageStorage { get; } = new();
    public FakeEmailService FakeEmailStorage { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = string.Empty,
                ["Jwt:Issuer"] = "Dayform.Api",
                ["Jwt:Audience"] = "Dayform.Client",
                ["Jwt:SigningKey"] = "DAYFORM_LOCAL_DEV_ONLY_FALLBACK_KEY_CHANGE_IN_PRODUCTION_123456",
                ["Jwt:AccessTokenMinutes"] = "15",
                ["Jwt:RefreshTokenDays"] = "7",
                ["Frontend:AllowedOrigins"] = "http://localhost:5173",
                ["Demo:Enabled"] = "false"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<DayformDbContext>>();
            services.RemoveAll<DayformDbContext>();
            services.RemoveAll<IDayformDbContext>();
            services.RemoveAll<IImageStorageService>();
            services.RemoveAll<IEmailService>();

            services.AddDbContext<DayformDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            services.AddScoped<IDayformDbContext>(sp => sp.GetRequiredService<DayformDbContext>());
            services.AddSingleton<IImageStorageService>(FakeImageStorage);
            services.AddSingleton<IEmailService>(FakeEmailStorage);
        });
    }
}

