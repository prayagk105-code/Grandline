using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Dayform.Infrastructure.Data;

public class DayformDbContextFactory : IDesignTimeDbContextFactory<DayformDbContext>
{
    public DayformDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<DayformDbContext>();
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings:DefaultConnection")
            ?? FindConnectionStringFromAppSettings()
            ?? "Host=localhost;Port=5432;Database=dayform_design;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString, npgsql =>
            npgsql.MigrationsAssembly(typeof(DayformDbContext).Assembly.FullName));

        return new DayformDbContext(optionsBuilder.Options);
    }

    private static string? FindConnectionStringFromAppSettings()
    {
        var searchDirs = new[]
        {
            Directory.GetCurrentDirectory(),
            Path.Combine(Directory.GetCurrentDirectory(), "backend", "src", "Dayform.Api"),
            Path.Combine(Directory.GetCurrentDirectory(), "src", "Dayform.Api"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "Dayform.Api"),
            AppContext.BaseDirectory
        };

        foreach (var dir in searchDirs)
        {
            var files = new[] { "appsettings.Development.json", "appsettings.json" };
            foreach (var file in files)
            {
                var fullPath = Path.Combine(dir, file);
                if (File.Exists(fullPath))
                {
                    try
                    {
                        var json = File.ReadAllText(fullPath);
                        using var doc = JsonDocument.Parse(json);
                        if (doc.RootElement.TryGetProperty("ConnectionStrings", out var csSection) &&
                            csSection.TryGetProperty("DefaultConnection", out var csProp))
                        {
                            var connStr = csProp.GetString();
                            if (!string.IsNullOrWhiteSpace(connStr))
                            {
                                return connStr;
                            }
                        }
                    }
                    catch
                    {
                        // ignore parse errors and continue
                    }
                }
            }
        }

        return null;
    }
}
