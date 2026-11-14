using Dayform.Application.Common;
using Dayform.Application.DTOs.Special;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class SpecialGrandlineService : ISpecialGrandlineService
{
    private readonly IDayformDbContext _db;

    public SpecialGrandlineService(IDayformDbContext db)
    {
        _db = db;
    }

    // 11.1 Life Timeline
    public async Task<IReadOnlyList<LifeTimelineEventDto>> GetTimelineEventsAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.TimelineEvents.AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.EventDate)
            .ToListAsync(ct);

        return list.Select(t => new LifeTimelineEventDto(t.Id, t.EventDate, t.Title, t.Description, t.Category, t.ImageUrl, t.SignificanceLevel, t.CreatedAtUtc)).ToList();
    }

    public async Task<LifeTimelineEventDto> CreateTimelineEventAsync(Guid userId, CreateTimelineEventRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Event title is required.");

        var ev = new LifeTimelineEvent
        {
            UserId = userId,
            EventDate = request.EventDate,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Milestone" : request.Category.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            SignificanceLevel = Math.Clamp(request.SignificanceLevel, 1, 5)
        };

        _db.TimelineEvents.Add(ev);
        await _db.SaveChangesAsync(ct);

        return new LifeTimelineEventDto(ev.Id, ev.EventDate, ev.Title, ev.Description, ev.Category, ev.ImageUrl, ev.SignificanceLevel, ev.CreatedAtUtc);
    }

    public async Task DeleteTimelineEventAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var ev = await _db.TimelineEvents.FirstOrDefaultAsync(t => t.UserId == userId && t.Id == id, ct);
        if (ev == null) throw new NotFoundAppException("Event not found.");

        _db.TimelineEvents.Remove(ev);
        await _db.SaveChangesAsync(ct);
    }

    // 11.2 Future Self
    public async Task<IReadOnlyList<FutureLetterDto>> GetFutureLettersAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.FutureLetters.AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.UnlockDate)
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return list.Select(f =>
        {
            var isUnlocked = today >= f.UnlockDate;
            var displayContent = isUnlocked ? f.Content : "🔒 Sealed letter. This letter will unlock on " + f.UnlockDate.ToString("MMM dd, yyyy") + ".";
            return new FutureLetterDto(f.Id, f.Title, displayContent, f.WrittenDate, f.UnlockDate, isUnlocked, f.IsRead, f.CreatedAtUtc);
        }).ToList();
    }

    public async Task<FutureLetterDto> CreateFutureLetterAsync(Guid userId, CreateFutureLetterRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Letter title is required.");
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new BadRequestException("Letter content is required.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.UnlockDate <= today)
            throw new BadRequestException("Unlock date must be in the future.");

        var letter = new FutureLetter
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            WrittenDate = today,
            UnlockDate = request.UnlockDate,
            IsRead = false
        };

        _db.FutureLetters.Add(letter);
        await _db.SaveChangesAsync(ct);

        return new FutureLetterDto(letter.Id, letter.Title, "🔒 Sealed letter.", letter.WrittenDate, letter.UnlockDate, false, false, letter.CreatedAtUtc);
    }

    public async Task<FutureLetterDto> MarkFutureLetterReadAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var letter = await _db.FutureLetters.FirstOrDefaultAsync(f => f.UserId == userId && f.Id == id, ct);
        if (letter == null) throw new NotFoundAppException("Letter not found.");

        letter.IsRead = true;
        await _db.SaveChangesAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var isUnlocked = today >= letter.UnlockDate;
        return new FutureLetterDto(letter.Id, letter.Title, isUnlocked ? letter.Content : "🔒 Sealed letter.", letter.WrittenDate, letter.UnlockDate, isUnlocked, letter.IsRead, letter.CreatedAtUtc);
    }

    // 11.3 90-Day Challenge
    public async Task<IReadOnlyList<NinetyDayChallengeDto>> GetChallengesAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.Challenges.AsNoTracking()
            .Include(c => c.DayLogs)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(ct);

        return list.Select(MapToChallengeDto).ToList();
    }

    public async Task<NinetyDayChallengeDto> CreateChallengeAsync(Guid userId, CreateNinetyDayChallengeRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Challenge title is required.");

        var startDate = request.StartDate;
        var endDate = startDate.AddDays(89);

        var challenge = new NinetyDayChallenge
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartDate = startDate,
            EndDate = endDate,
            DailyAction = string.IsNullOrWhiteSpace(request.DailyAction) ? "Daily challenge action" : request.DailyAction.Trim(),
            Status = "Active"
        };

        for (int i = 1; i <= 90; i++)
        {
            challenge.DayLogs.Add(new NinetyDayChallengeLog
            {
                ChallengeId = challenge.Id,
                DayNumber = i,
                LogDate = startDate.AddDays(i - 1),
                IsCompleted = false
            });
        }

        _db.Challenges.Add(challenge);
        await _db.SaveChangesAsync(ct);

        return MapToChallengeDto(challenge);
    }

    public async Task<NinetyDayChallengeDto> LogChallengeDayAsync(Guid userId, Guid challengeId, LogChallengeDayRequest request, CancellationToken ct = default)
    {
        var challenge = await _db.Challenges
            .Include(c => c.DayLogs)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Id == challengeId, ct);

        if (challenge == null) throw new NotFoundAppException("Challenge not found.");

        var dayLog = challenge.DayLogs.FirstOrDefault(d => d.DayNumber == request.DayNumber);
        if (dayLog == null)
        {
            dayLog = new NinetyDayChallengeLog
            {
                ChallengeId = challenge.Id,
                DayNumber = request.DayNumber,
                LogDate = request.LogDate,
                IsCompleted = request.IsCompleted,
                Notes = request.Notes
            };
            challenge.DayLogs.Add(dayLog);
        }
        else
        {
            dayLog.IsCompleted = request.IsCompleted;
            if (request.Notes != null) dayLog.Notes = request.Notes.Trim();
        }

        if (challenge.DayLogs.Count(d => d.IsCompleted) >= 90)
            challenge.Status = "Completed";

        await _db.SaveChangesAsync(ct);
        return MapToChallengeDto(challenge);
    }

    // 11.5 Personal Rules
    public async Task<IReadOnlyList<PersonalRuleDto>> GetPersonalRulesAsync(Guid userId, DateOnly? date = null, CancellationToken ct = default)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var rules = await _db.PersonalRules.AsNoTracking()
            .Include(r => r.Logs)
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.Category)
            .ThenBy(r => r.RuleText)
            .ToListAsync(ct);

        return rules.Select(r =>
        {
            var log = r.Logs.FirstOrDefault(l => l.LogDate == targetDate);
            return new PersonalRuleDto(
                r.Id,
                r.RuleText,
                r.Category,
                r.IsActive,
                r.CurrentStreak,
                r.BestStreak,
                log?.Complied ?? false,
                r.CreatedAtUtc
            );
        }).ToList();
    }

    public async Task<PersonalRuleDto> CreatePersonalRuleAsync(Guid userId, CreatePersonalRuleRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.RuleText))
            throw new BadRequestException("Rule text is required.");

        var rule = new PersonalRule
        {
            UserId = userId,
            RuleText = request.RuleText.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
            IsActive = true,
            CurrentStreak = 0,
            BestStreak = 0
        };

        _db.PersonalRules.Add(rule);
        await _db.SaveChangesAsync(ct);

        return new PersonalRuleDto(rule.Id, rule.RuleText, rule.Category, rule.IsActive, 0, 0, false, rule.CreatedAtUtc);
    }

    public async Task<PersonalRuleDto> LogRuleComplianceAsync(Guid userId, Guid ruleId, LogRuleComplianceRequest request, CancellationToken ct = default)
    {
        var rule = await _db.PersonalRules
            .Include(r => r.Logs)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Id == ruleId, ct);

        if (rule == null) throw new NotFoundAppException("Rule not found.");

        var log = rule.Logs.FirstOrDefault(l => l.LogDate == request.LogDate);
        if (log == null)
        {
            log = new PersonalRuleLog
            {
                RuleId = rule.Id,
                LogDate = request.LogDate,
                Complied = request.Complied
            };
            rule.Logs.Add(log);
        }
        else
        {
            log.Complied = request.Complied;
        }

        if (request.Complied)
        {
            rule.CurrentStreak += 1;
            if (rule.CurrentStreak > rule.BestStreak)
                rule.BestStreak = rule.CurrentStreak;
        }
        else
        {
            rule.CurrentStreak = 0;
        }

        await _db.SaveChangesAsync(ct);
        return new PersonalRuleDto(rule.Id, rule.RuleText, rule.Category, rule.IsActive, rule.CurrentStreak, rule.BestStreak, log.Complied, rule.CreatedAtUtc);
    }

    public async Task DeletePersonalRuleAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var rule = await _db.PersonalRules.FirstOrDefaultAsync(r => r.UserId == userId && r.Id == id, ct);
        if (rule == null) throw new NotFoundAppException("Rule not found.");

        _db.PersonalRules.Remove(rule);
        await _db.SaveChangesAsync(ct);
    }

    // 11.6 Digital Detox
    public async Task<IReadOnlyList<DigitalDetoxDto>> GetDigitalDetoxesAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.DigitalDetoxes.AsNoTracking()
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.CreatedAtUtc)
            .ToListAsync(ct);

        return list.Select(d => new DigitalDetoxDto(d.Id, d.Title, d.DistractingApps, d.StartDate, d.EndDate, d.IsActive, d.CleanDaysCount, d.CreatedAtUtc)).ToList();
    }

    public async Task<DigitalDetoxDto> CreateDigitalDetoxAsync(Guid userId, CreateDigitalDetoxRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Title is required.");

        var detox = new DigitalDetox
        {
            UserId = userId,
            Title = request.Title.Trim(),
            DistractingApps = request.DistractingApps.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = true,
            CleanDaysCount = 0
        };

        _db.DigitalDetoxes.Add(detox);
        await _db.SaveChangesAsync(ct);

        return new DigitalDetoxDto(detox.Id, detox.Title, detox.DistractingApps, detox.StartDate, detox.EndDate, detox.IsActive, detox.CleanDaysCount, detox.CreatedAtUtc);
    }

    public async Task<DigitalDetoxDto> LogDetoxCleanDayAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var detox = await _db.DigitalDetoxes.FirstOrDefaultAsync(d => d.UserId == userId && d.Id == id, ct);
        if (detox == null) throw new NotFoundAppException("Detox goal not found.");

        detox.CleanDaysCount += 1;
        await _db.SaveChangesAsync(ct);

        return new DigitalDetoxDto(detox.Id, detox.Title, detox.DistractingApps, detox.StartDate, detox.EndDate, detox.IsActive, detox.CleanDaysCount, detox.CreatedAtUtc);
    }

    // 11.7 Monthly Reflection
    public async Task<MonthlyReflectionDto?> GetMonthlyReflectionAsync(Guid userId, int year, int month, CancellationToken ct = default)
    {
        var r = await _db.MonthlyReflections.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Year == year && x.Month == month, ct);

        if (r == null) return null;

        return new MonthlyReflectionDto(r.Id, r.Year, r.Month, r.Expectations, r.Achievements, r.BiggestImprovements, r.ChallengesFaced, r.LessonsLearned, r.NextMonthPriorities, r.CreatedAtUtc);
    }

    public async Task<MonthlyReflectionDto> UpsertMonthlyReflectionAsync(Guid userId, UpsertMonthlyReflectionRequest request, CancellationToken ct = default)
    {
        var existing = await _db.MonthlyReflections
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Year == request.Year && x.Month == request.Month, ct);

        if (existing != null)
        {
            existing.Expectations = request.Expectations?.Trim();
            existing.Achievements = request.Achievements?.Trim();
            existing.BiggestImprovements = request.BiggestImprovements?.Trim();
            existing.ChallengesFaced = request.ChallengesFaced?.Trim();
            existing.LessonsLearned = request.LessonsLearned?.Trim();
            existing.NextMonthPriorities = request.NextMonthPriorities?.Trim();

            await _db.SaveChangesAsync(ct);
            return new MonthlyReflectionDto(existing.Id, existing.Year, existing.Month, existing.Expectations, existing.Achievements, existing.BiggestImprovements, existing.ChallengesFaced, existing.LessonsLearned, existing.NextMonthPriorities, existing.CreatedAtUtc);
        }

        var entry = new MonthlyReflection
        {
            UserId = userId,
            Year = request.Year,
            Month = request.Month,
            Expectations = request.Expectations?.Trim(),
            Achievements = request.Achievements?.Trim(),
            BiggestImprovements = request.BiggestImprovements?.Trim(),
            ChallengesFaced = request.ChallengesFaced?.Trim(),
            LessonsLearned = request.LessonsLearned?.Trim(),
            NextMonthPriorities = request.NextMonthPriorities?.Trim()
        };

        _db.MonthlyReflections.Add(entry);
        await _db.SaveChangesAsync(ct);

        return new MonthlyReflectionDto(entry.Id, entry.Year, entry.Month, entry.Expectations, entry.Achievements, entry.BiggestImprovements, entry.ChallengesFaced, entry.LessonsLearned, entry.NextMonthPriorities, entry.CreatedAtUtc);
    }

    // 11.10 Discipline Score
    public async Task<DisciplineScoreDto> GetDisciplineScoreAsync(Guid userId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var thirtyDaysAgo = today.AddDays(-30);

        // 1. Habit consistency over last 30 days (40% weight)
        var totalHabitOpportunities = await _db.HabitLogs.AsNoTracking()
            .CountAsync(l => l.UserId == userId && l.LogDate >= thirtyDaysAgo && l.LogDate <= today, ct);
        var completedHabits = await _db.HabitLogs.AsNoTracking()
            .CountAsync(l => l.UserId == userId && l.LogDate >= thirtyDaysAgo && l.LogDate <= today && l.IsCompleted, ct);
        int habitScore = totalHabitOpportunities > 0 ? (int)Math.Round((double)completedHabits / totalHabitOpportunities * 100) : 80;

        // 2. Task completion rate over last 30 days (30% weight)
        var totalTasks = await _db.Tasks.AsNoTracking()
            .CountAsync(t => t.UserId == userId && t.CreatedAtUtc >= DateTime.UtcNow.AddDays(-30), ct);
        var completedTasks = await _db.Tasks.AsNoTracking()
            .CountAsync(t => t.UserId == userId && t.IsCompleted && t.CreatedAtUtc >= DateTime.UtcNow.AddDays(-30), ct);
        int taskScore = totalTasks > 0 ? (int)Math.Round((double)completedTasks / totalTasks * 100) : 75;

        // 3. Focus sessions consistency (30% weight)
        var focusDays = await _db.FocusSessions.AsNoTracking()
            .Where(f => f.UserId == userId && f.SessionDate >= thirtyDaysAgo)
            .Select(f => f.SessionDate)
            .Distinct()
            .CountAsync(ct);
        int focusScore = Math.Clamp((int)Math.Round((double)focusDays / 30 * 100), 10, 100);

        int overall = (int)Math.Round((habitScore * 0.40) + (taskScore * 0.30) + (focusScore * 0.30));
        overall = Math.Clamp(overall, 1, 100);

        string rating = overall switch
        {
            >= 90 => "Master of Haki (Elite)",
            >= 80 => "Grandline Captain (Excellent)",
            >= 65 => "Steady Helmsman (Solid)",
            >= 50 => "Voyager in Training (Developing)",
            _ => "Rebuilding Momentum (Starting Out)"
        };

        var factors = new List<string>
        {
            $"Habit Consistency: {habitScore}% (Weight 40%)",
            $"Task Completion Rate: {taskScore}% (Weight 30%)",
            $"Focus Regularity: {focusScore}% (Weight 30%)"
        };

        return new DisciplineScoreDto(
            overall,
            habitScore,
            taskScore,
            focusScore,
            rating,
            "Calculated mathematically from your last 30 days of actual habit logs, task completions, and focus sessions.",
            factors
        );
    }

    private static NinetyDayChallengeDto MapToChallengeDto(NinetyDayChallenge c)
    {
        var completed = c.DayLogs.Count(d => d.IsCompleted);
        var total = Math.Max(1, c.DayLogs.Count);
        var pct = (int)Math.Round((double)completed / total * 100);

        return new NinetyDayChallengeDto(
            c.Id,
            c.Title,
            c.Description,
            c.StartDate,
            c.EndDate,
            c.DailyAction,
            c.Status,
            completed,
            total,
            Math.Clamp(pct, 0, 100),
            c.DayLogs.OrderBy(d => d.DayNumber).Select(d => new NinetyDayChallengeLogDto(d.Id, d.ChallengeId, d.DayNumber, d.LogDate, d.IsCompleted, d.Notes)).ToList(),
            c.CreatedAtUtc
        );
    }
}

