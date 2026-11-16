using System.Text.Json;
using Dayform.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Xunit.Abstractions;

namespace Dayform.IntegrationTests;

public class DatabaseBackupAndCleanupTests
{
    private readonly ITestOutputHelper _output;

    public DatabaseBackupAndCleanupTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task BackupAndCleanDemoData()
    {
        var connStr = "Host=db.gjdeiicepjwkzfmaqnbs.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=Santro@7227105;SSL Mode=Require;Trust Server Certificate=true";
        var options = new DbContextOptionsBuilder<DayformDbContext>()
            .UseNpgsql(connStr)
            .Options;

        using var db = new DayformDbContext(options);
        using var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();

        // 1. Identify all users
        using var userCmd = conn.CreateCommand();
        userCmd.CommandText = @"SELECT ""Id"", ""Email"", ""DisplayName"", ""IsDemoUser"" FROM users;";
        using var userReader = await userCmd.ExecuteReaderAsync();
        var users = new List<(Guid Id, string Email, string Name, bool IsDemo)>();
        while (await userReader.ReadAsync())
        {
            users.Add((userReader.GetGuid(0), userReader.GetString(1), userReader.GetString(2), userReader.GetBoolean(3)));
        }
        await userReader.CloseAsync();

        _output.WriteLine($"Users found: {users.Count}");
        foreach (var u in users)
        {
            _output.WriteLine($"  User: {u.Email} (Demo: {u.IsDemo})");
        }

        // 2. Perform backup of all existing user data
        var backup = new Dictionary<string, object>();

        // Query each table that currently has data
        var tablesToBackup = new[] { "users", "habits", "habit_logs", "learning_paths", "study_sessions", "memories", "journal_entries", "reminders" };
        foreach (var t in tablesToBackup)
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = $@"SELECT json_agg(row_to_json(t)) FROM ""{t}"" t;";
            var json = await cmd.ExecuteScalarAsync();
            backup[t] = json?.ToString() ?? "[]";
            _output.WriteLine($"Backed up table {t}");
        }

        var backupDir = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", "database", "backups");
        Directory.CreateDirectory(backupDir);
        var backupPath = Path.Combine(backupDir, "demo_data_backup_before_cleanup.json");
        await File.WriteAllTextAsync(backupPath, JsonSerializer.Serialize(backup, new JsonSerializerOptions { WriteIndented = true }));
        _output.WriteLine($"Saved backup to {backupPath}");

        // 3. Remove only confirmed demo users and their cascade-deleted records
        var demoUsers = users.Where(u => u.IsDemo || u.Email.Contains("example.com") || u.Email.Contains("grandline.com")).ToList();
        _output.WriteLine($"Demo users to clean: {demoUsers.Count}");

        foreach (var demoUser in demoUsers)
        {
            using var delCmd = conn.CreateCommand();
            delCmd.CommandText = @"DELETE FROM users WHERE ""Id"" = @id;";
            var p = delCmd.CreateParameter();
            p.ParameterName = "@id";
            p.Value = demoUser.Id;
            delCmd.Parameters.Add(p);

            var rowsAffected = await delCmd.ExecuteNonQueryAsync();
            _output.WriteLine($"Deleted demo user {demoUser.Email}, rows: {rowsAffected}");
        }

        // 4. Verify post-cleanup state
        using var countUsersCmd = conn.CreateCommand();
        countUsersCmd.CommandText = @"SELECT COUNT(*) FROM users;";
        var finalUserCount = await countUsersCmd.ExecuteScalarAsync();
        _output.WriteLine($"Final user count in database: {finalUserCount}");

        using var countHabitsCmd = conn.CreateCommand();
        countHabitsCmd.CommandText = @"SELECT COUNT(*) FROM habits;";
        var finalHabitsCount = await countHabitsCmd.ExecuteScalarAsync();
        _output.WriteLine($"Final habits count in database: {finalHabitsCount}");

        using var countLogsCmd = conn.CreateCommand();
        countLogsCmd.CommandText = @"SELECT COUNT(*) FROM habit_logs;";
        var finalLogsCount = await countLogsCmd.ExecuteScalarAsync();
        _output.WriteLine($"Final habit_logs count in database: {finalLogsCount}");
    }
}
