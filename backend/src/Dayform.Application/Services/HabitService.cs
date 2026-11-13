using Dayform.Application.Common;
using Dayform.Application.DTOs.Habits;
using Dayform.Application.Interfaces;
using Dayform.Application.Logic;
using Dayform.Domain.Entities;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class HabitService : IHabitService
{
    private readonly IDayformDbContext _db;
    private readonly IValidator<CreateHabitRequest> _createValidator;
    private readonly IValidator<UpdateHabitRequest> _updateValidator;

    public HabitService(
        IDayformDbContext db,
        IValidator<CreateHabitRequest> createValidator,
        IValidator<UpdateHabitRequest> updateValidator)
    {
        _db = db;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<IReadOnlyList<HabitDto>> GetHabitsAsync(
        Guid userId,
        string? category,
        bool includeArchived,
        DateOnly? date,
        CancellationToken ct = default)
    {
        var targetDate = await ResolveDateAsync(userId, date, ct);

        var query = _db.Habits.AsNoTracking().Where(h => h.UserId == userId);
        if (!includeArchived)
            query = query.Where(h => h.IsActive);

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(h => h.Category == category);

        var habits = await query
            .OrderBy(h => h.SortOrder)
            .ThenBy(h => h.CreatedAtUtc)
            .ToListAsync(ct);

        var habitIds = habits.Select(h => h.Id).ToList();
        var completedIds = await _db.HabitLogs.AsNoTracking()
            .Where(l => l.UserId == userId && l.LogDate == targetDate && l.IsCompleted && habitIds.Contains(l.HabitId))
            .Select(l => l.HabitId)
            .ToListAsync(ct);

        var completedSet = completedIds.ToHashSet();

        return habits.Select(h => MapToDto(h, completedSet.Contains(h.Id))).ToList();
    }

    public async Task<HabitDto> GetHabitByIdAsync(Guid userId, Guid habitId, DateOnly? date, CancellationToken ct = default)
    {
        var habit = await _db.Habits.AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == habitId && h.UserId == userId, ct)
            ?? throw new NotFoundAppException("Habit not found.");

        var targetDate = await ResolveDateAsync(userId, date, ct);
        var completed = await _db.HabitLogs.AsNoTracking()
            .AnyAsync(l => l.UserId == userId && l.HabitId == habitId && l.LogDate == targetDate && l.IsCompleted, ct);

        return MapToDto(habit, completed);
    }

    public async Task<HabitDto> CreateHabitAsync(Guid userId, CreateHabitRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_createValidator, request, ct);

        var maxOrder = await _db.Habits
            .Where(h => h.UserId == userId)
            .Select(h => (int?)h.SortOrder)
            .MaxAsync(ct) ?? 0;

        var habit = new Habit
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Category = request.Category.Trim(),
            Target = string.IsNullOrWhiteSpace(request.Target) ? null : request.Target.Trim(),
            Icon = request.Icon.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim(),
            IsActive = true,
            SortOrder = maxOrder + 1
        };

        _db.Habits.Add(habit);
        await _db.SaveChangesAsync(ct);

        return MapToDto(habit, false);
    }

    public async Task<HabitDto> UpdateHabitAsync(Guid userId, Guid habitId, UpdateHabitRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_updateValidator, request, ct);

        var habit = await _db.Habits
            .FirstOrDefaultAsync(h => h.Id == habitId && h.UserId == userId, ct)
            ?? throw new NotFoundAppException("Habit not found.");

        habit.Name = request.Name.Trim();
        habit.Category = request.Category.Trim();
        habit.Target = string.IsNullOrWhiteSpace(request.Target) ? null : request.Target.Trim();
        habit.Icon = request.Icon.Trim();
        habit.Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim();
        habit.IsActive = request.IsActive;

        await _db.SaveChangesAsync(ct);

        var today = await ResolveDateAsync(userId, null, ct);
        var completed = await _db.HabitLogs.AsNoTracking()
            .AnyAsync(l => l.UserId == userId && l.HabitId == habitId && l.LogDate == today && l.IsCompleted, ct);

        return MapToDto(habit, completed);
    }

    public async Task DeleteHabitAsync(Guid userId, Guid habitId, CancellationToken ct = default)
    {
        var habit = await _db.Habits
            .FirstOrDefaultAsync(h => h.Id == habitId && h.UserId == userId, ct)
            ?? throw new NotFoundAppException("Habit not found.");

        _db.Habits.Remove(habit);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<HabitLogDto>> GetHabitLogsAsync(Guid userId, Guid habitId, DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var habitExists = await _db.Habits.AsNoTracking()
            .AnyAsync(h => h.Id == habitId && h.UserId == userId, ct);
        if (!habitExists)
            throw new NotFoundAppException("Habit not found.");

        var today = await ResolveDateAsync(userId, null, ct);
        var start = from ?? today.AddDays(-149);
        var end = to ?? today;

        return await _db.HabitLogs.AsNoTracking()
            .Where(l => l.UserId == userId && l.HabitId == habitId && l.LogDate >= start && l.LogDate <= end)
            .OrderByDescending(l => l.LogDate)
            .Select(l => new HabitLogDto
            {
                Id = l.Id,
                HabitId = l.HabitId,
                LogDate = l.LogDate,
                IsCompleted = l.IsCompleted
            })
            .ToListAsync(ct);
    }

    public async Task<HabitLogDto> SetHabitLogAsync(Guid userId, Guid habitId, DateOnly logDate, bool isCompleted, CancellationToken ct = default)
    {
        var habitExists = await _db.Habits.AsNoTracking()
            .AnyAsync(h => h.Id == habitId && h.UserId == userId, ct);
        if (!habitExists)
            throw new NotFoundAppException("Habit not found.");

        var today = await ResolveDateAsync(userId, null, ct);
        if (logDate > today.AddDays(1))
            throw new BadRequestException("Cannot log habits for future dates.", "future_habit_log");

        var existing = await _db.HabitLogs
            .FirstOrDefaultAsync(l => l.UserId == userId && l.HabitId == habitId && l.LogDate == logDate, ct);

        if (existing is null)
        {
            existing = new HabitLog
            {
                UserId = userId,
                HabitId = habitId,
                LogDate = logDate,
                IsCompleted = isCompleted
            };
            _db.HabitLogs.Add(existing);
        }
        else
        {
            existing.IsCompleted = isCompleted;
        }

        await _db.SaveChangesAsync(ct);

        return new HabitLogDto
        {
            Id = existing.Id,
            HabitId = existing.HabitId,
            LogDate = existing.LogDate,
            IsCompleted = existing.IsCompleted
        };
    }

    public async Task<HabitSummaryDto> GetSummaryAsync(Guid userId, DateOnly? clientDate, CancellationToken ct = default)
    {
        var today = await ResolveDateAsync(userId, clientDate, ct);
        var activeHabits = await _db.Habits.AsNoTracking()
            .Where(h => h.UserId == userId && h.IsActive)
            .Select(h => h.Id)
            .ToListAsync(ct);

        if (activeHabits.Count == 0)
        {
            return new HabitSummaryDto
            {
                WeeklyAveragePercent = 0,
                CurrentStreakDays = 0,
                BestStreakDays = 0,
                ActiveCount = 0
            };
        }

        var dailyPercents = await BuildDailyPercentsAsync(userId, activeHabits, null, today, ct);
        var (current, best) = HabitAnalyticsCalculator.CalculateStreaks(dailyPercents, today);
        var weekAvg = HabitAnalyticsCalculator.CalculateAverageCompletion(dailyPercents, today.AddDays(-6), today);

        return new HabitSummaryDto
        {
            WeeklyAveragePercent = weekAvg,
            CurrentStreakDays = current,
            BestStreakDays = best,
            ActiveCount = activeHabits.Count
        };
    }

    public async Task<IReadOnlyList<HabitHeatmapDayDto>> GetHeatmapAsync(Guid userId, int weeks, DateOnly? clientDate, CancellationToken ct = default)
    {
        var clampedWeeks = Math.Clamp(weeks, 1, 52);
        var today = await ResolveDateAsync(userId, clientDate, ct);

        // Align start to Sunday (DayOfWeek = 0) just like the reference UI
        var start = today.AddDays(-(int)today.DayOfWeek - (clampedWeeks - 1) * 7);

        var activeHabits = await _db.Habits.AsNoTracking()
            .Where(h => h.UserId == userId && h.IsActive)
            .Select(h => h.Id)
            .ToListAsync(ct);

        var countsByDate = await _db.HabitLogs.AsNoTracking()
            .Where(l => l.UserId == userId
                        && l.IsCompleted
                        && activeHabits.Contains(l.HabitId)
                        && l.LogDate >= start
                        && l.LogDate <= today)
            .GroupBy(l => l.LogDate)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, ct);

        var days = new List<HabitHeatmapDayDto>();
        for (var d = start; d <= today; d = d.AddDays(1))
        {
            var completed = countsByDate.TryGetValue(d, out var c) ? c : 0;
            var pct = HabitAnalyticsCalculator.CalculateDailyCompletionPercent(completed, activeHabits.Count);
            days.Add(new HabitHeatmapDayDto
            {
                Date = d,
                CompletedCount = completed,
                TotalActiveCount = activeHabits.Count,
                CompletionPercent = pct,
                IntensityLevel = HabitAnalyticsCalculator.CalculateIntensityLevel(pct)
            });
        }

        return days;
    }

    internal async Task<Dictionary<DateOnly, double>> BuildDailyPercentsAsync(
        Guid userId,
        IReadOnlyList<Guid> activeHabitIds,
        DateOnly? from,
        DateOnly to,
        CancellationToken ct)
    {
        if (activeHabitIds.Count == 0)
            return new Dictionary<DateOnly, double>();

        var query = _db.HabitLogs.AsNoTracking()
            .Where(l => l.UserId == userId && l.IsCompleted && activeHabitIds.Contains(l.HabitId) && l.LogDate <= to);

        if (from.HasValue)
            query = query.Where(l => l.LogDate >= from.Value);

        var grouped = await query
            .GroupBy(l => l.LogDate)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var dict = new Dictionary<DateOnly, double>(grouped.Count);
        foreach (var item in grouped)
        {
            dict[item.Date] = HabitAnalyticsCalculator.CalculateDailyCompletionPercent(item.Count, activeHabitIds.Count);
        }

        return dict;
    }

    private async Task<DateOnly> ResolveDateAsync(Guid userId, DateOnly? clientDate, CancellationToken ct)
    {
        var tz = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.TimeZoneId)
            .FirstOrDefaultAsync(ct);
        return DateHelper.ResolveUserToday(tz, clientDate);
    }

    private static HabitDto MapToDto(Habit h, bool completedToday) => new()
    {
        Id = h.Id,
        Name = h.Name,
        Category = h.Category,
        Target = h.Target,
        Icon = h.Icon,
        Color = h.Color,
        IsActive = h.IsActive,
        CompletedToday = completedToday,
        CreatedAtUtc = h.CreatedAtUtc
    };
}

