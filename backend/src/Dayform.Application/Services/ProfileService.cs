using System.Security.Cryptography;
using System.Text;
using Dayform.Application.Common;
using Dayform.Application.DTOs.Habits;
using Dayform.Application.DTOs.Journal;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.DTOs.Planner;
using Dayform.Application.DTOs.Profile;
using Dayform.Application.DTOs.Study;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class ProfileService : IProfileService
{
    private readonly IDayformDbContext _db;
    private readonly IValidator<UpdateProfileRequest> _validator;

    public ProfileService(IDayformDbContext db, IValidator<UpdateProfileRequest> validator)
    {
        _db = db;
        _validator = validator;
    }

    public async Task<ProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var u = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == userId, ct)
            ?? throw new NotFoundAppException("User not found.");

        return MapToDto(u);
    }

    public async Task<ProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_validator, request, ct);

        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct)
            ?? throw new NotFoundAppException("User not found.");

        u.DisplayName = request.DisplayName.Trim();
        u.ThemePreference = request.ThemePreference;
        u.TimeZoneId = request.TimeZoneId.Trim();
        if (request.JourneyStartDate.HasValue)
            u.JourneyStartDate = request.JourneyStartDate.Value;

        if (request.DashboardConfigJson != null)
            u.DashboardConfigJson = request.DashboardConfigJson;

        if (request.DailyFocusTargetMinutes.HasValue && request.DailyFocusTargetMinutes.Value > 0)
            u.DailyFocusTargetMinutes = request.DailyFocusTargetMinutes.Value;

        await _db.SaveChangesAsync(ct);
        return MapToDto(u);
    }

    public async Task<UserExportDto> ExportDataAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await GetProfileAsync(userId, ct);

        var habits = await _db.Habits.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.SortOrder).ToListAsync(ct);
        var logs = await _db.HabitLogs.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.LogDate).ToListAsync(ct);
        var paths = await _db.LearningPaths.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.CreatedAtUtc).ToListAsync(ct);
        var sessions = await _db.StudySessions.AsNoTracking().Include(x => x.LearningPath).Where(x => x.UserId == userId).OrderBy(x => x.SessionDate).ToListAsync(ct);
        var memories = await _db.Memories.AsNoTracking().Include(x => x.MediaAsset).Where(x => x.UserId == userId).OrderBy(x => x.MemoryDate).ToListAsync(ct);
        var journals = await _db.JournalEntries.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.EntryDate).ToListAsync(ct);
        var reminders = await _db.Reminders.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.ReminderDate).ToListAsync(ct);

        return new UserExportDto
        {
            ExportedAtUtc = DateTime.UtcNow,
            Profile = profile,
            Habits = habits.Select(h => new HabitDto
            {
                Id = h.Id,
                Name = h.Name,
                Category = h.Category,
                Target = h.Target,
                Icon = h.Icon,
                Color = h.Color,
                IsActive = h.IsActive,
                CompletedToday = false,
                CreatedAtUtc = h.CreatedAtUtc
            }).ToList(),
            HabitLogs = logs.Select(l => new HabitLogDto
            {
                Id = l.Id,
                HabitId = l.HabitId,
                LogDate = l.LogDate,
                IsCompleted = l.IsCompleted
            }).ToList(),
            LearningPaths = paths.Select(p => new LearningPathDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Icon = p.Icon,
                TargetMinutes = p.TargetMinutes,
                Progress = 0,
                IsArchived = p.IsArchived,
                TotalMinutesLogged = 0,
                SessionCount = 0,
                LastSessionDate = null,
                CreatedAtUtc = p.CreatedAtUtc
            }).ToList(),
            StudySessions = sessions.Select(s => new StudySessionDto
            {
                Id = s.Id,
                LearningPathId = s.LearningPathId,
                LearningPathName = s.LearningPath?.Name ?? "General study",
                Topic = s.Topic,
                Minutes = s.Minutes,
                SessionDate = s.SessionDate,
                Notes = s.Notes,
                StartedAtUtc = s.StartedAtUtc,
                CompletedAtUtc = s.CompletedAtUtc,
                CreatedAtUtc = s.CreatedAtUtc
            }).ToList(),
            Memories = memories.Select(MemoryService.MapToDto).ToList(),
            JournalEntries = journals.Select(j => new JournalEntryDto
            {
                Id = j.Id,
                EntryDate = j.EntryDate,
                Accomplishments = j.Accomplishments,
                Distractions = j.Distractions,
                Improvements = j.Improvements,
                CreatedAtUtc = j.CreatedAtUtc,
                UpdatedAtUtc = j.UpdatedAtUtc
            }).ToList(),
            Reminders = reminders.Select(r => new ReminderDto
            {
                Id = r.Id,
                Title = r.Title,
                ReminderDate = r.ReminderDate,
                ReminderTime = r.ReminderTime,
                RepeatFrequency = r.RepeatFrequency,
                IsActive = r.IsActive
            }).ToList()
        };
    }

    public async Task<string> ExportCsvAsync(Guid userId, CancellationToken ct = default)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Type,Date,Title/Name,Category/Topic,Details,Status/Completed");

        var habits = await _db.Habits.AsNoTracking().Where(h => h.UserId == userId).ToListAsync(ct);
        foreach (var h in habits)
        {
            sb.AppendLine($"Habit,,{EscapeCsv(h.Name)},{EscapeCsv(h.Category)},{EscapeCsv(h.Target ?? "")},{(h.IsActive ? "Active" : "Archived")}");
        }

        var tasks = await _db.Tasks.AsNoTracking().Where(t => t.UserId == userId).ToListAsync(ct);
        foreach (var t in tasks)
        {
            sb.AppendLine($"Task,{t.DueDate?.ToString("yyyy-MM-dd")},{EscapeCsv(t.Title)},{EscapeCsv(t.Priority)},{EscapeCsv(t.Description ?? "")},{(t.IsCompleted ? "Completed" : "Pending")}");
        }

        var journals = await _db.JournalEntries.AsNoTracking().Where(j => j.UserId == userId).ToListAsync(ct);
        foreach (var j in journals)
        {
            sb.AppendLine($"Journal,{j.EntryDate:yyyy-MM-dd},Reflection,,{EscapeCsv(j.Accomplishments ?? "")},Done");
        }

        var sessions = await _db.StudySessions.AsNoTracking().Where(s => s.UserId == userId).ToListAsync(ct);
        foreach (var s in sessions)
        {
            sb.AppendLine($"StudySession,{s.SessionDate:yyyy-MM-dd},{EscapeCsv(s.Topic)},{s.Minutes} mins,{EscapeCsv(s.Notes ?? "")},Logged");
        }

        return sb.ToString();
    }

    public async Task RestoreDataAsync(Guid userId, UserExportDto data, CancellationToken ct = default)
    {
        if (data.Habits != null && data.Habits.Count > 0)
        {
            foreach (var h in data.Habits)
            {
                var existing = await _db.Habits.FirstOrDefaultAsync(x => x.UserId == userId && x.Name == h.Name, ct);
                if (existing == null)
                {
                    _db.Habits.Add(new Habit
                    {
                        UserId = userId,
                        Name = h.Name,
                        Category = h.Category,
                        Target = h.Target,
                        Icon = h.Icon,
                        Color = h.Color,
                        IsActive = h.IsActive
                    });
                }
            }
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<bool> SetPinAsync(Guid userId, string? pin, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundAppException("User not found.");

        if (string.IsNullOrWhiteSpace(pin))
        {
            user.AppPinHash = null;
        }
        else
        {
            user.AppPinHash = HashPin(pin.Trim());
        }

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> VerifyPinAsync(Guid userId, string pin, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundAppException("User not found.");

        if (string.IsNullOrWhiteSpace(user.AppPinHash))
            return true; // No PIN configured

        return user.AppPinHash == HashPin(pin.Trim());
    }

    public async Task DeleteAccountAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null) return;

        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);
    }

    private static string HashPin(string pin)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(pin + "_dayform_salt"));
        return Convert.ToHexString(bytes);
    }

    private static string EscapeCsv(string val)
    {
        if (val.Contains(',') || val.Contains('"') || val.Contains('\n') || val.Contains('\r'))
            return $"\"{val.Replace("\"", "\"\"")}\"";
        return val;
    }

    private static ProfileDto MapToDto(User u)
    {
        return new ProfileDto
        {
            Id = u.Id,
            DisplayName = u.DisplayName,
            Email = u.Email,
            ThemePreference = u.ThemePreference,
            JourneyStartDate = u.JourneyStartDate,
            TimeZoneId = u.TimeZoneId,
            IsDemoUser = u.IsDemoUser,
            HasAppPin = !string.IsNullOrWhiteSpace(u.AppPinHash),
            DashboardConfigJson = u.DashboardConfigJson,
            DailyFocusTargetMinutes = u.DailyFocusTargetMinutes,
            CreatedAtUtc = u.CreatedAtUtc
        };
    }
}
