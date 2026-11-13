using Dayform.Application.Common;
using Dayform.Application.DTOs.Habits;
using Dayform.Application.DTOs.Journal;
using Dayform.Application.DTOs.Planner;
using Dayform.Application.DTOs.Profile;
using Dayform.Application.DTOs.Study;
using Dayform.Application.Interfaces;
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
                Progress = p.Progress,
                IsArchived = p.IsArchived,
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

    private static ProfileDto MapToDto(Domain.Entities.User u) => new()
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
}

