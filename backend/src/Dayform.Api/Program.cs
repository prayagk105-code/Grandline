using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Dayform.Api.Middleware;
using Dayform.Api.Services;
using Dayform.Application;
using Dayform.Application.Interfaces;
using Dayform.Infrastructure;
using Dayform.Infrastructure.Configuration;
using Dayform.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DAYFORM API",
        Version = "v1",
        Description = "API for DAYFORM — Habits, study, memories, planner, journal, and progress."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var signingKey = jwtOptions.SigningKey;

if (string.IsNullOrWhiteSpace(signingKey) || signingKey.Length < 32)
{
    if (builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Testing"))
    {
        signingKey = "DAYFORM_LOCAL_DEV_ONLY_FALLBACK_KEY_CHANGE_IN_PRODUCTION_123456";
        builder.Configuration["Jwt:SigningKey"] = signingKey;
    }
    else
    {
        throw new InvalidOperationException("Jwt:SigningKey must be configured with at least 32 characters in non-development environments.");
    }
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

var allowedOriginsRaw = builder.Configuration["Frontend:AllowedOrigins"] ?? "http://localhost:5173";
var allowedOrigins = allowedOriginsRaw
    .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.PermitLimit = builder.Environment.IsEnvironment("Testing") ? 1000 : 20;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 0;
    });
});

var app = builder.Build();

// Handle explicit CLI seed commands: --seed, --reset-demo, --remove-demo
if (args.Contains("--seed") || args.Contains("--reset-demo") || args.Contains("--remove-demo"))
{
    if (!app.Environment.IsDevelopment())
    {
        throw new InvalidOperationException("Demo seed commands can only run in Development environment.");
    }

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DayformDbContext>();
    await db.Database.MigrateAsync();

    var seeder = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();
    if (args.Contains("--remove-demo"))
    {
        await seeder.RemoveDemoDataAsync();
    }
    else
    {
        await seeder.SeedDemoDataAsync(resetExisting: args.Contains("--reset-demo"));
    }
    return;
}

if (app.Environment.IsDevelopment())
{
    var demoOptions = app.Configuration.GetSection(DemoOptions.SectionName).Get<DemoOptions>();
    if (demoOptions is { Enabled: true, SeedOnStartup: true } &&
        !string.IsNullOrWhiteSpace(app.Configuration.GetConnectionString("DefaultConnection")))
    {
        using var scope = app.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<IDemoSeedService>();
        await seeder.SeedDemoDataAsync(resetExisting: false);
    }

    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "DAYFORM API v1");
    });
}
else
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("FrontendPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/v1/health", () => Results.Ok(new { status = "healthy", service = "DAYFORM.Api" }))
    .AllowAnonymous();

app.MapControllers();

app.Run();

public partial class Program { }
