using Dayform.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Xunit.Abstractions;

namespace Dayform.IntegrationTests;

public class DatabaseInspectorTests
{
    private readonly ITestOutputHelper _output;

    public DatabaseInspectorTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task InspectSupabaseDatabase()
    {
        var connStr = "Host=db.gjdeiicepjwkzfmaqnbs.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=Santro@7227105;SSL Mode=Require;Trust Server Certificate=true";
        var options = new DbContextOptionsBuilder<DayformDbContext>()
            .UseNpgsql(connStr)
            .Options;

        using var db = new DayformDbContext(options);
        using var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;";
        
        using var reader = await cmd.ExecuteReaderAsync();
        var tables = new List<string>();
        while (await reader.ReadAsync())
        {
            tables.Add(reader.GetString(0));
        }
        await reader.CloseAsync();

        _output.WriteLine($"Tables found ({tables.Count}):");
        foreach (var t in tables)
        {
            using var countCmd = conn.CreateCommand();
            countCmd.CommandText = $"SELECT COUNT(*) FROM \"{t}\";";
            var count = await countCmd.ExecuteScalarAsync();
            _output.WriteLine($"  - {t}: {count} rows");
        }
    }
}
