using Dayform.Application.Common;
using Dayform.Application.DTOs.PersonalDevelopment;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class PersonalDevelopmentService : IPersonalDevelopmentService
{
    private readonly IDayformDbContext _db;

    public PersonalDevelopmentService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<MoodLogDto>> GetMoodLogsAsync(Guid userId, int limit = 30, CancellationToken ct = default)
    {
        var list = await _db.MoodLogs.AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.LogDate)
            .Take(limit)
            .ToListAsync(ct);

        return list.Select(m => new MoodLogDto(
            m.Id,
            m.LogDate,
            m.MoodScore,
            m.EnergyScore,
            m.StressScore,
            m.Gratitude,
            m.Reflection,
            m.LessonsLearned,
            m.Notes,
            m.CreatedAtUtc
        )).ToList();
    }

    public async Task<MoodLogDto?> GetMoodLogByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default)
    {
        var m = await _db.MoodLogs.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.LogDate == date, ct);

        if (m == null) return null;

        return new MoodLogDto(
            m.Id,
            m.LogDate,
            m.MoodScore,
            m.EnergyScore,
            m.StressScore,
            m.Gratitude,
            m.Reflection,
            m.LessonsLearned,
            m.Notes,
            m.CreatedAtUtc
        );
    }

    public async Task<MoodLogDto> UpsertMoodLogAsync(Guid userId, UpsertMoodLogRequest request, CancellationToken ct = default)
    {
        var existing = await _db.MoodLogs
            .FirstOrDefaultAsync(m => m.UserId == userId && m.LogDate == request.LogDate, ct);

        if (existing != null)
        {
            existing.MoodScore = Math.Clamp(request.MoodScore, 1, 5);
            existing.EnergyScore = Math.Clamp(request.EnergyScore, 1, 5);
            existing.StressScore = Math.Clamp(request.StressScore, 1, 5);
            existing.Gratitude = request.Gratitude?.Trim();
            existing.Reflection = request.Reflection?.Trim();
            existing.LessonsLearned = request.LessonsLearned?.Trim();
            existing.Notes = request.Notes?.Trim();
            await _db.SaveChangesAsync(ct);

            return new MoodLogDto(
                existing.Id,
                existing.LogDate,
                existing.MoodScore,
                existing.EnergyScore,
                existing.StressScore,
                existing.Gratitude,
                existing.Reflection,
                existing.LessonsLearned,
                existing.Notes,
                existing.CreatedAtUtc
            );
        }

        var entry = new DailyMoodEnergyLog
        {
            UserId = userId,
            LogDate = request.LogDate,
            MoodScore = Math.Clamp(request.MoodScore, 1, 5),
            EnergyScore = Math.Clamp(request.EnergyScore, 1, 5),
            StressScore = Math.Clamp(request.StressScore, 1, 5),
            Gratitude = request.Gratitude?.Trim(),
            Reflection = request.Reflection?.Trim(),
            LessonsLearned = request.LessonsLearned?.Trim(),
            Notes = request.Notes?.Trim()
        };

        _db.MoodLogs.Add(entry);
        await _db.SaveChangesAsync(ct);

        return new MoodLogDto(
            entry.Id,
            entry.LogDate,
            entry.MoodScore,
            entry.EnergyScore,
            entry.StressScore,
            entry.Gratitude,
            entry.Reflection,
            entry.LessonsLearned,
            entry.Notes,
            entry.CreatedAtUtc
        );
    }

    public async Task<IReadOnlyList<BadHabitDto>> GetBadHabitsAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.BadHabits.AsNoTracking()
            .Where(b => b.UserId == userId)
            .OrderBy(b => b.Name)
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return list.Select(b =>
        {
            var cleanDays = Math.Max(0, today.DayNumber - b.CleanDaysStartDate.DayNumber);
            return new BadHabitDto(b.Id, b.Name, b.Trigger, b.ReplacementHabit, b.CleanDaysStartDate, cleanDays, b.RelapseCount, b.IsActive, b.CreatedAtUtc);
        }).ToList();
    }

    public async Task<BadHabitDto> CreateBadHabitAsync(Guid userId, CreateBadHabitRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new BadRequestException("Habit name is required.");

        var item = new BadHabit
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Trigger = request.Trigger?.Trim(),
            ReplacementHabit = request.ReplacementHabit?.Trim(),
            CleanDaysStartDate = request.CleanDaysStartDate,
            CleanStreakDays = 0,
            RelapseCount = 0,
            IsActive = true
        };

        _db.BadHabits.Add(item);
        await _db.SaveChangesAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var cleanDays = Math.Max(0, today.DayNumber - item.CleanDaysStartDate.DayNumber);
        return new BadHabitDto(item.Id, item.Name, item.Trigger, item.ReplacementHabit, item.CleanDaysStartDate, cleanDays, item.RelapseCount, item.IsActive, item.CreatedAtUtc);
    }

    public async Task<BadHabitDto> LogBadHabitRelapseAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var item = await _db.BadHabits.FirstOrDefaultAsync(b => b.UserId == userId && b.Id == id, ct);
        if (item == null)
            throw new NotFoundAppException("Bad habit not found.");

        item.RelapseCount += 1;
        item.CleanDaysStartDate = DateOnly.FromDateTime(DateTime.UtcNow);
        item.CleanStreakDays = 0;

        await _db.SaveChangesAsync(ct);
        return new BadHabitDto(item.Id, item.Name, item.Trigger, item.ReplacementHabit, item.CleanDaysStartDate, 0, item.RelapseCount, item.IsActive, item.CreatedAtUtc);
    }

    public async Task DeleteBadHabitAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var item = await _db.BadHabits.FirstOrDefaultAsync(b => b.UserId == userId && b.Id == id, ct);
        if (item == null)
            throw new NotFoundAppException("Bad habit not found.");

        _db.BadHabits.Remove(item);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<StrengthWeaknessDto>> GetStrengthsWeaknessesAsync(Guid userId, string? type = null, CancellationToken ct = default)
    {
        var query = _db.StrengthsWeaknesses.AsNoTracking().Where(s => s.UserId == userId);
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(s => s.Type == type);

        var list = await query.OrderBy(s => s.Type).ThenBy(s => s.Title).ToListAsync(ct);
        return list.Select(s => new StrengthWeaknessDto(s.Id, s.Type, s.Title, s.Description, s.ActionPlan, s.CreatedAtUtc)).ToList();
    }

    public async Task<StrengthWeaknessDto> CreateStrengthWeaknessAsync(Guid userId, CreateStrengthWeaknessRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Title is required.");

        var item = new PersonalStrengthWeakness
        {
            UserId = userId,
            Type = string.IsNullOrWhiteSpace(request.Type) ? "Strength" : request.Type.Trim(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            ActionPlan = request.ActionPlan?.Trim()
        };

        _db.StrengthsWeaknesses.Add(item);
        await _db.SaveChangesAsync(ct);

        return new StrengthWeaknessDto(item.Id, item.Type, item.Title, item.Description, item.ActionPlan, item.CreatedAtUtc);
    }

    public async Task DeleteStrengthWeaknessAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var item = await _db.StrengthsWeaknesses.FirstOrDefaultAsync(s => s.UserId == userId && s.Id == id, ct);
        if (item == null)
            throw new NotFoundAppException("Item not found.");

        _db.StrengthsWeaknesses.Remove(item);
        await _db.SaveChangesAsync(ct);
    }
}

