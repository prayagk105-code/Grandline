using Dayform.Application.Common;
using Dayform.Application.DTOs.Progress;
using Dayform.Application.Interfaces;
using Dayform.Application.Logic;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class ProgressService : IProgressService
{
    private readonly IDayformDbContext _db;

    public ProgressService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<ProgressSummaryDto> GetSummaryAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        if (to < from)
            throw new BadRequestException("'to' date must be on or after 'from' date.", "invalid_date_range");

        var user = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.JourneyStartDate, u.TimeZoneId })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundAppException("User not found.");

        var today = DateHelper.ResolveUserToday(user.TimeZoneId, null);

        var activeHabits = await _db.Habits.AsNoTracking()
            .Where(h => h.UserId == userId && h.IsActive)
            .Select(h => new { h.Id, h.Name })
            .ToListAsync(ct);

        var rangeDays = to.DayNumber - from.DayNumber + 1;
        var prevTo = from.AddDays(-1);
        var prevFrom = prevTo.AddDays(-(rangeDays - 1));

        var logs = await _db.HabitLogs.AsNoTracking()
            .Where(l => l.UserId == userId && l.IsCompleted && l.LogDate >= prevFrom && l.LogDate <= to)
            .Select(l => new { l.HabitId, l.LogDate })
            .ToListAsync(ct);

        var activeIds = activeHabits.Select(h => h.Id).ToHashSet();
        var countsByDate = logs
            .Where(l => activeIds.Contains(l.HabitId))
            .GroupBy(l => l.LogDate)
            .ToDictionary(g => g.Key, g => g.Count());

        var dailyPercents = countsByDate.ToDictionary(
            kvp => kvp.Key,
            kvp => HabitAnalyticsCalculator.CalculateDailyCompletionPercent(kvp.Value, activeIds.Count));

        var currentAvg = HabitAnalyticsCalculator.CalculateAverageCompletion(dailyPercents, from, to);

        var hasPreviousData = logs.Any(l => l.LogDate >= prevFrom && l.LogDate <= prevTo);
        double? prevAvg = hasPreviousData
            ? HabitAnalyticsCalculator.CalculateAverageCompletion(dailyPercents, prevFrom, prevTo)
            : null;
        double? delta = prevAvg.HasValue ? Math.Round(currentAvg - prevAvg.Value, 1) : null;

        var studySessions = await _db.StudySessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.SessionDate >= from && s.SessionDate <= to)
            .Select(s => new { s.Minutes, s.SessionDate })
            .ToListAsync(ct);

        var memoriesCount = await _db.Memories.AsNoTracking()
            .CountAsync(m => m.UserId == userId && m.MemoryDate >= from && m.MemoryDate <= to, ct);

        var insights = new List<ProgressInsightDto>();
        if (delta.HasValue)
        {
            var pts = Math.Abs(Math.Round(delta.Value));
            insights.Add(new ProgressInsightDto
            {
                Icon = "chart",
                Title = delta.Value >= 0
                    ? $"Consistency is up {pts} points"
                    : $"Consistency is down {pts} points",
                Description = $"Compared with the previous {rangeDays}-day period ({Math.Round(prevAvg!.Value)}% vs {Math.Round(currentAvg)}%)."
            });
        }

        if (studySessions.Count >= 3)
        {
            var byWeekday = studySessions
                .GroupBy(s => s.SessionDate.DayOfWeek)
                .Select(g => new { Day = g.Key, Minutes = g.Sum(x => x.Minutes) })
                .OrderByDescending(x => x.Minutes)
                .First();

            insights.Add(new ProgressInsightDto
            {
                Icon = "clock",
                Title = $"Your best study day is {byWeekday.Day}",
                Description = $"{byWeekday.Minutes} minutes logged on {byWeekday.Day}s in this range — protect that focus block."
            });
        }

        if (activeHabits.Count >= 2 && rangeDays >= 7 && logs.Any(l => l.LogDate >= from && l.LogDate <= to))
        {
            var habitCompletionRates = activeHabits
                .Select(h => new
                {
                    h.Name,
                    CompletedDays = logs.Count(l => l.HabitId == h.Id && l.LogDate >= from && l.LogDate <= to),
                    Rate = Math.Round(logs.Count(l => l.HabitId == h.Id && l.LogDate >= from && l.LogDate <= to) * 100.0 / rangeDays)
                })
                .OrderByDescending(x => x.Rate)
                .ToList();

            var strongest = habitCompletionRates.First();
            var weakest = habitCompletionRates.Last();
            if (strongest.Name != weakest.Name)
            {
                insights.Add(new ProgressInsightDto
                {
                    Icon = "star",
                    Title = $"Strongest: {strongest.Name} ({strongest.Rate}%)",
                    Description = $"Needs attention: {weakest.Name} ({weakest.Rate}% over this {rangeDays}-day period)."
                });
            }
        }

        var rawDay = today.DayNumber - user.JourneyStartDate.DayNumber + 1;
        var journeyDay = Math.Clamp(rawDay, 1, 180);
        var phaseName = journeyDay <= 60 ? "Foundation" : journeyDay <= 120 ? "Development" : "Preparation";

        return new ProgressSummaryDto
        {
            From = from,
            To = to,
            HabitAveragePercent = currentAvg,
            PreviousPeriodHabitAveragePercent = prevAvg,
            HabitTrendDeltaPoints = delta,
            StudyMinutes = studySessions.Sum(s => s.Minutes),
            StudySessionsCount = studySessions.Count,
            MemoriesCount = memoriesCount,
            Insights = insights,
            Journey = new JourneyProgressDto
            {
                JourneyStartDate = user.JourneyStartDate,
                CurrentDay = journeyDay,
                TotalDays = 180,
                RemainingDays = Math.Max(0, 180 - journeyDay),
                PercentComplete = Math.Round(journeyDay / 1.8, 1),
                PhaseName = phaseName,
                TotalPhases = 3
            }
        };
    }

    public async Task<ProgressHabitAnalyticsDto> GetHabitAnalyticsAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        if (to < from)
            throw new BadRequestException("'to' date must be on or after 'from' date.", "invalid_date_range");

        var activeIds = await _db.Habits.AsNoTracking()
            .Where(h => h.UserId == userId && h.IsActive)
            .Select(h => h.Id)
            .ToListAsync(ct);

        var countsByDate = await _db.HabitLogs.AsNoTracking()
            .Where(l => l.UserId == userId && l.IsCompleted && activeIds.Contains(l.HabitId) && l.LogDate >= from && l.LogDate <= to)
            .GroupBy(l => l.LogDate)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, ct);

        var dailyPercents = countsByDate.ToDictionary(
            kvp => kvp.Key,
            kvp => HabitAnalyticsCalculator.CalculateDailyCompletionPercent(kvp.Value, activeIds.Count));

        var totalDays = to.DayNumber - from.DayNumber + 1;
        var points = new List<ProgressHabitPointDto>();
        string granularity;

        if (totalDays <= 14)
        {
            granularity = "day";
            for (var d = from; d <= to; d = d.AddDays(1))
            {
                var pct = dailyPercents.TryGetValue(d, out var p) ? p : 0;
                points.Add(new ProgressHabitPointDto
                {
                    Label = d.ToString("ddd"),
                    From = d,
                    To = d,
                    CompletionPercent = pct
                });
            }
        }
        else if (totalDays <= 45)
        {
            granularity = "week";
            var cursor = from;
            while (cursor <= to)
            {
                var bucketEnd = cursor.AddDays(6) > to ? to : cursor.AddDays(6);
                points.Add(new ProgressHabitPointDto
                {
                    Label = $"{cursor:MMM d}",
                    From = cursor,
                    To = bucketEnd,
                    CompletionPercent = HabitAnalyticsCalculator.CalculateAverageCompletion(dailyPercents, cursor, bucketEnd)
                });
                cursor = bucketEnd.AddDays(1);
            }
        }
        else
        {
            granularity = "month";
            var cursor = new DateOnly(from.Year, from.Month, 1);
            while (cursor <= to)
            {
                var monthStart = cursor < from ? from : cursor;
                var monthEnd = new DateOnly(cursor.Year, cursor.Month, DateTime.DaysInMonth(cursor.Year, cursor.Month));
                if (monthEnd > to) monthEnd = to;

                points.Add(new ProgressHabitPointDto
                {
                    Label = cursor.ToString("MMM"),
                    From = monthStart,
                    To = monthEnd,
                    CompletionPercent = HabitAnalyticsCalculator.CalculateAverageCompletion(dailyPercents, monthStart, monthEnd)
                });

                cursor = cursor.AddMonths(1);
            }
        }

        return new ProgressHabitAnalyticsDto
        {
            From = from,
            To = to,
            Granularity = granularity,
            Points = points
        };
    }

    public async Task<ProgressStudyAnalyticsDto> GetStudyAnalyticsAsync(Guid userId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        if (to < from)
            throw new BadRequestException("'to' date must be on or after 'from' date.", "invalid_date_range");

        var sessions = await _db.StudySessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.SessionDate >= from && s.SessionDate <= to)
            .Select(s => new { s.SessionDate, s.Minutes })
            .ToListAsync(ct);

        var totalDays = to.DayNumber - from.DayNumber + 1;
        var points = new List<ProgressStudyPointDto>();

        if (totalDays <= 14)
        {
            for (var d = from; d <= to; d = d.AddDays(1))
            {
                var daySessions = sessions.Where(s => s.SessionDate == d).ToList();
                points.Add(new ProgressStudyPointDto
                {
                    Label = d.ToString("ddd"),
                    From = d,
                    To = d,
                    Minutes = daySessions.Sum(s => s.Minutes),
                    Sessions = daySessions.Count
                });
            }
        }
        else if (totalDays <= 45)
        {
            var cursor = from;
            while (cursor <= to)
            {
                var bucketEnd = cursor.AddDays(6) > to ? to : cursor.AddDays(6);
                var bucketSessions = sessions.Where(s => s.SessionDate >= cursor && s.SessionDate <= bucketEnd).ToList();
                points.Add(new ProgressStudyPointDto
                {
                    Label = $"{cursor:MMM d}",
                    From = cursor,
                    To = bucketEnd,
                    Minutes = bucketSessions.Sum(s => s.Minutes),
                    Sessions = bucketSessions.Count
                });
                cursor = bucketEnd.AddDays(1);
            }
        }
        else
        {
            var cursor = new DateOnly(from.Year, from.Month, 1);
            while (cursor <= to)
            {
                var monthStart = cursor < from ? from : cursor;
                var monthEnd = new DateOnly(cursor.Year, cursor.Month, DateTime.DaysInMonth(cursor.Year, cursor.Month));
                if (monthEnd > to) monthEnd = to;
                var bucketSessions = sessions.Where(s => s.SessionDate >= monthStart && s.SessionDate <= monthEnd).ToList();

                points.Add(new ProgressStudyPointDto
                {
                    Label = cursor.ToString("MMM"),
                    From = monthStart,
                    To = monthEnd,
                    Minutes = bucketSessions.Sum(s => s.Minutes),
                    Sessions = bucketSessions.Count
                });
                cursor = cursor.AddMonths(1);
            }
        }

        string? bestWeekday = sessions.Count > 0
            ? sessions.GroupBy(s => s.SessionDate.DayOfWeek)
                .OrderByDescending(g => g.Sum(x => x.Minutes))
                .First().Key.ToString()
            : null;

        return new ProgressStudyAnalyticsDto
        {
            From = from,
            To = to,
            TotalMinutes = sessions.Sum(s => s.Minutes),
            TotalSessions = sessions.Count,
            BestWeekday = bestWeekday,
            Points = points
        };
    }

    public async Task<IReadOnlyList<MonthlySummaryDto>> GetMonthlySummaryAsync(Guid userId, int months, DateOnly? clientDate, CancellationToken ct = default)
    {
        months = Math.Clamp(months, 1, 12);
        var tz = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.TimeZoneId)
            .FirstOrDefaultAsync(ct);
        var today = DateHelper.ResolveUserToday(tz, clientDate);

        var startMonth = new DateOnly(today.Year, today.Month, 1).AddMonths(-(months - 1));

        var activeIds = await _db.Habits.AsNoTracking()
            .Where(h => h.UserId == userId && h.IsActive)
            .Select(h => h.Id)
            .ToListAsync(ct);

        var logs = await _db.HabitLogs.AsNoTracking()
            .Where(l => l.UserId == userId && l.IsCompleted && activeIds.Contains(l.HabitId) && l.LogDate >= startMonth && l.LogDate <= today)
            .GroupBy(l => l.LogDate)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Date, x => x.Count, ct);

        var dailyPercents = logs.ToDictionary(
            kvp => kvp.Key,
            kvp => HabitAnalyticsCalculator.CalculateDailyCompletionPercent(kvp.Value, activeIds.Count));

        var sessions = await _db.StudySessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.SessionDate >= startMonth && s.SessionDate <= today)
            .Select(s => new { s.SessionDate, s.Minutes })
            .ToListAsync(ct);

        var memories = await _db.Memories.AsNoTracking()
            .Where(m => m.UserId == userId && m.MemoryDate >= startMonth && m.MemoryDate <= today)
            .Select(m => m.MemoryDate)
            .ToListAsync(ct);

        var result = new List<MonthlySummaryDto>(months);
        for (int i = 0; i < months; i++)
        {
            var mStart = startMonth.AddMonths(i);
            var mEnd = i == months - 1
                ? today
                : new DateOnly(mStart.Year, mStart.Month, DateTime.DaysInMonth(mStart.Year, mStart.Month));

            var monthSessions = sessions.Where(s => s.SessionDate >= mStart && s.SessionDate <= mEnd).ToList();
            var monthMemories = memories.Count(d => d >= mStart && d <= mEnd);

            result.Add(new MonthlySummaryDto
            {
                Year = mStart.Year,
                Month = mStart.Month,
                MonthLabel = mStart.ToString("MMMM"),
                HabitCompletionPercent = HabitAnalyticsCalculator.CalculateAverageCompletion(dailyPercents, mStart, mEnd),
                StudyMinutes = monthSessions.Sum(s => s.Minutes),
                StudySessions = monthSessions.Count,
                MemoriesCount = monthMemories
            });
        }

        return result;
    }
}

