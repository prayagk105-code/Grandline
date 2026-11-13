using Dayform.Application.Common;
using Dayform.Application.DTOs.Dashboard;
using Dayform.Application.DTOs.Habits;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.Interfaces;
using Dayform.Application.Logic;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IDayformDbContext _db;

    public DashboardService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(Guid userId, DateOnly? clientDate, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.JourneyStartDate, u.TimeZoneId })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundAppException("User not found.");

        var today = DateHelper.ResolveUserToday(user.TimeZoneId, clientDate);
        var weekStart = today.AddDays(-6);

        var habits = await _db.Habits.AsNoTracking()
            .Where(h => h.UserId == userId && h.IsActive)
            .OrderBy(h => h.SortOrder)
            .ThenBy(h => h.CreatedAtUtc)
            .ToListAsync(ct);

        var activeIds = habits.Select(h => h.Id).ToList();

        var logs = await _db.HabitLogs.AsNoTracking()
            .Where(l => l.UserId == userId && l.IsCompleted && activeIds.Contains(l.HabitId) && l.LogDate <= today)
            .Select(l => new { l.HabitId, l.LogDate })
            .ToListAsync(ct);

        var todayCompletedSet = logs.Where(l => l.LogDate == today).Select(l => l.HabitId).ToHashSet();
        var countsByDate = logs.GroupBy(l => l.LogDate).ToDictionary(g => g.Key, g => g.Count());
        var dailyPercents = countsByDate.ToDictionary(
            kvp => kvp.Key,
            kvp => HabitAnalyticsCalculator.CalculateDailyCompletionPercent(kvp.Value, activeIds.Count));

        var (currentStreak, bestStreak) = HabitAnalyticsCalculator.CalculateStreaks(dailyPercents, today);
        var habitAvg7d = HabitAnalyticsCalculator.CalculateAverageCompletion(dailyPercents, weekStart, today);
        var todayPct = HabitAnalyticsCalculator.CalculateDailyCompletionPercent(todayCompletedSet.Count, activeIds.Count);

        var studyLast7 = await _db.StudySessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.SessionDate >= weekStart && s.SessionDate <= today)
            .Select(s => new { s.SessionDate, s.Minutes })
            .ToListAsync(ct);

        var studyByDate = studyLast7.GroupBy(s => s.SessionDate).ToDictionary(g => g.Key, g => g.Sum(x => x.Minutes));

        var last7Days = new List<WeeklyActivityDayDto>(7);
        for (var d = weekStart; d <= today; d = d.AddDays(1))
        {
            var completedCount = countsByDate.TryGetValue(d, out var cnt) ? cnt : 0;
            last7Days.Add(new WeeklyActivityDayDto
            {
                Date = d,
                WeekdayShort = d.ToString("ddd")[..1],
                CompletedCount = completedCount,
                TotalCount = activeIds.Count,
                CompletionPercent = dailyPercents.TryGetValue(d, out var p) ? p : 0,
                StudyMinutes = studyByDate.TryGetValue(d, out var m) ? m : 0
            });
        }

        var recentMemories = await _db.Memories.AsNoTracking()
            .Include(m => m.MediaAsset)
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.MemoryDate)
            .ThenByDescending(m => m.CreatedAtUtc)
            .Take(5)
            .ToListAsync(ct);

        var nextHabit = habits.FirstOrDefault(h => !todayCompletedSet.Contains(h.Id));
        var journeyDay = Math.Clamp(today.DayNumber - user.JourneyStartDate.DayNumber + 1, 1, 180);

        return new DashboardSummaryDto
        {
            TodayDate = today,
            JourneyDay = journeyDay,
            JourneyTotalDays = 180,
            CompletedHabitsToday = todayCompletedSet.Count,
            TotalActiveHabits = habits.Count,
            CompletionPercentToday = (int)Math.Round(todayPct),
            NextIncompleteHabitName = nextHabit?.Name,
            CurrentStreakDays = currentStreak,
            BestStreakDays = bestStreak,
            FocusMinutesLast7Days = studyLast7.Sum(s => s.Minutes),
            HabitAverageLast7Days = habitAvg7d,
            Last7Days = last7Days,
            TodayHabits = habits.Take(5).Select(h => new HabitDto
            {
                Id = h.Id,
                Name = h.Name,
                Category = h.Category,
                Target = h.Target,
                Icon = h.Icon,
                Color = h.Color,
                IsActive = h.IsActive,
                CompletedToday = todayCompletedSet.Contains(h.Id),
                CreatedAtUtc = h.CreatedAtUtc
            }).ToList(),
            RecentMemories = recentMemories.Select(MemoryService.MapToDto).ToList()
        };
    }

    public async Task<IReadOnlyList<WeeklyActivityDayDto>> GetWeeklyActivityAsync(Guid userId, DateOnly? clientDate, CancellationToken ct = default)
    {
        var summary = await GetSummaryAsync(userId, clientDate, ct);
        return summary.Last7Days;
    }

    public async Task<IReadOnlyList<MemoryDto>> GetRecentMemoriesAsync(Guid userId, int limit = 5, CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 20);
        var memories = await _db.Memories.AsNoTracking()
            .Include(m => m.MediaAsset)
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.MemoryDate)
            .ThenByDescending(m => m.CreatedAtUtc)
            .Take(limit)
            .ToListAsync(ct);

        return memories.Select(MemoryService.MapToDto).ToList();
    }
}

