namespace Dayform.Infrastructure.Configuration;

public class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "Dayform.Api";
    public string Audience { get; set; } = "Dayform.Client";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 14;
}

public class CloudinaryOptions
{
    public const string SectionName = "Cloudinary";
    public string CloudName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
}

public class DemoOptions
{
    public const string SectionName = "Demo";
    public bool Enabled { get; set; } = false;
    public bool SeedOnStartup { get; set; } = false;
    public string Email { get; set; } = "alex@example.com";
    public string Password { get; set; } = "DayformDemo123!";
}

public class FrontendOptions
{
    public const string SectionName = "Frontend";
    public string AllowedOrigins { get; set; } = "http://localhost:5173";
}

