using Dayform.Application.Common;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.DTOs.Planner;
using Dayform.Application.DTOs.Study;
using Dayform.Application.Interfaces;
using Dayform.Application.Logic;
using Dayform.Domain.Entities;
using Dayform.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class PlannerService : IPlannerService
{
    private readonly IDayformDbContext _db;
    private readonly IValidator<CreateReminderRequest> _createValidator;
    private readonly IValidator<UpdateReminderRequest> _updateValidator;

    public PlannerService(
        IDayformDbContext db,
        IValidator<CreateReminderRequest> createValidator,
        IValidator<UpdateReminderRequest> updateValidator)
    {
        _db = db;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IReadOnlyList<ReminderDto>> GetRemindersAsync(Guid userId, bool activeOnly, CancellationToken ct = default)
    {
        var query = _db.Reminders.AsNoTracking().Where(r => r.UserId == userId);
        if (activeOnly)
            query = query.Where(r => r.IsActive);

        return await query
            .OrderBy(r => r.ReminderDate)
            .ThenBy(r => r.ReminderTime)
            .Select(r => new ReminderDto
            {
                Id = r.Id,
                Title = r.Title,
                ReminderDate = r.ReminderDate,
                ReminderTime = r.ReminderTime,
                RepeatFrequency = r.RepeatFrequency,
                IsActive = r.IsActive
            })
            .ToListAsync(ct);
    }

    public async Task<ReminderDto> GetReminderByIdAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var r = await _db.Reminders.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct)
            ?? throw new NotFoundAppException("Reminder not found.");

        return MapToDto(r);
    }

    public async Task<ReminderDto> CreateReminderAsync(Guid userId, CreateReminderRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_createValidator, request, ct);

        var reminder = new Reminder
        {
            UserId = userId,
            Title = request.Title.Trim(),
            ReminderDate = request.ReminderDate,
            ReminderTime = request.ReminderTime,
            RepeatFrequency = request.RepeatFrequency,
            IsActive = true
        };

        _db.Reminders.Add(reminder);
        await _db.SaveChangesAsync(ct);
        return MapToDto(reminder);
    }

    public async Task<ReminderDto> UpdateReminderAsync(Guid userId, Guid id, UpdateReminderRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_updateValidator, request, ct);

        var reminder = await _db.Reminders
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId, ct)
            ?? throw new NotFoundAppException("Reminder not found.");

        reminder.Title = request.Title.Trim();
        reminder.ReminderDate = request.ReminderDate;
        reminder.ReminderTime = request.ReminderTime;
        reminder.RepeatFrequency = request.RepeatFrequency;
        reminder.IsActive = request.IsActive;

        await _db.SaveChangesAsync(ct);
        return MapToDto(reminder);
    }

    public async Task DeleteReminderAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var reminder = await _db.Reminders
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId, ct)
            ?? throw new NotFoundAppException("Reminder not found.");

        _db.Reminders.Remove(reminder);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PlannerCalendarDto> GetCalendarAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        if (to < from)
            throw new BadRequestException("'to' date must be on or after 'from' date.", "invalid_date_range");

        if (to.DayNumber - from.DayNumber > 90)
            throw new BadRequestException("Calendar range cannot exceed 90 days.", "range_too_large");

        var activeHabitIds = await _db.Habits.AsNoTracking()
            .Where(h => h.UserId == userId && h.IsActive)
            .Select(h => h.Id)
            .ToListAsync(ct);

        var habitCounts = await _db.HabitLogs.AsNoTracking()
            .Where(l => l.UserId == userId && l.IsCompleted && activeHabitIds.Contains(l.HabitId) && l.LogDate >= from && l.LogDate <= to)
            .GroupBy(l => l.LogDate)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, ct);

        var sessions = await _db.StudySessions.AsNoTracking()
            .Include(s => s.LearningPath)
            .Where(s => s.UserId == userId && s.SessionDate >= from && s.SessionDate <= to)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(ct);

        var memories = await _db.Memories.AsNoTracking()
            .Include(m => m.MediaAsset)
            .Where(m => m.UserId == userId && m.MemoryDate >= from && m.MemoryDate <= to)
            .OrderByDescending(m => m.CreatedAtUtc)
            .ToListAsync(ct);

        var reminders = await _db.Reminders.AsNoTracking()
            .Where(r => r.UserId == userId && r.IsActive && r.ReminderDate <= to)
            .ToListAsync(ct);

        var occurrencesByDate = new Dictionary<DateOnly, List<ReminderOccurrenceDto>>();
        foreach (var reminder in reminders)
        {
            var dates = ReminderRecurrenceCalculator.GetOccurrencesInRange(reminder, from, to);
            foreach (var occDate in dates)
            {
                if (!occurrencesByDate.TryGetValue(occDate, out var list))
                {
                    list = new List<ReminderOccurrenceDto>();
                    occurrencesByDate[occDate] = list;
                }

                list.Add(new ReminderOccurrenceDto
                {
                    ReminderId = reminder.Id,
                    Title = reminder.Title,
                    OccurrenceDate = occDate,
                    ReminderTime = reminder.ReminderTime,
                    RepeatFrequency = reminder.RepeatFrequency,
                    IsRecurringInstance = reminder.RepeatFrequency != RepeatFrequency.Never && occDate != reminder.ReminderDate
                });
            }
        }

        var sessionsByDate = sessions.GroupBy(s => s.SessionDate).ToDictionary(g => g.Key, g => g.ToList());
        var memoriesByDate = memories.GroupBy(m => m.MemoryDate).ToDictionary(g => g.Key, g => g.ToList());

        var days = new List<PlannerDayDto>();
        for (var d = from; d <= to; d = d.AddDays(1))
        {
            var completed = habitCounts.TryGetValue(d, out var hc) ? hc : 0;
            var pct = HabitAnalyticsCalculator.CalculateDailyCompletionPercent(completed, activeHabitIds.Count);
            sessionsByDate.TryGetValue(d, out var daySessions);
            memoriesByDate.TryGetValue(d, out var dayMemories);
            occurrencesByDate.TryGetValue(d, out var dayReminders);

            days.Add(new PlannerDayDto
            {
                Date = d,
                HabitCompletionPercent = pct,
                HabitIntensityLevel = HabitAnalyticsCalculator.CalculateIntensityLevel(pct),
                StudyMinutes = daySessions?.Sum(s => s.Minutes) ?? 0,
                StudySessionCount = daySessions?.Count ?? 0,
                Reminders = dayReminders?.OrderBy(r => r.ReminderTime).ToList() ?? new List<ReminderOccurrenceDto>(),
                StudySessions = daySessions?.Select(s => new StudySessionDto
                {
                    Id = s.Id,
                    LearningPathId = s.LearningPathId,
                    LearningPathName = s.LearningPath?.Name ?? "General study",
                    Topic = s.Topic,
                    Minutes = s.Minutes,
                    SessionDate = s.SessionDate,
                    Notes = s.Notes,
                    CreatedAtUtc = s.CreatedAtUtc
                }).ToList() ?? new List<StudySessionDto>(),
                Memories = dayMemories?.Select(MemoryService.MapToDto).ToList() ?? new List<MemoryDto>()
            });
        }

        return new PlannerCalendarDto
        {
            From = from,
            To = to,
            Days = days
        };
    }

    private static ReminderDto MapToDto(Reminder r) => new()
    {
        Id = r.Id,
        Title = r.Title,
        ReminderDate = r.ReminderDate,
        ReminderTime = r.ReminderTime,
        RepeatFrequency = r.RepeatFrequency,
        IsActive = r.IsActive
    };
}

