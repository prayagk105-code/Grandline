using Dayform.Application.Common;
using Dayform.Application.DTOs.Health;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class HealthService : IHealthService
{
    private readonly IDayformDbContext _db;

    public HealthService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<HealthDailyLogDto>> GetDailyLogsAsync(Guid userId, int limit = 30, CancellationToken ct = default)
    {
        var list = await _db.HealthLogs.AsNoTracking()
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.LogDate)
            .Take(limit)
            .ToListAsync(ct);

        return list.Select(MapToDto).ToList();
    }

    public async Task<HealthDailyLogDto?> GetDailyLogByDateAsync(Guid userId, DateOnly date, CancellationToken ct = default)
    {
        var h = await _db.HealthLogs.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && x.LogDate == date, ct);

        return h == null ? null : MapToDto(h);
    }

    public async Task<HealthDailyLogDto> UpsertDailyLogAsync(Guid userId, UpsertHealthDailyLogRequest request, CancellationToken ct = default)
    {
        var existing = await _db.HealthLogs
            .FirstOrDefaultAsync(h => h.UserId == userId && h.LogDate == request.LogDate, ct);

        if (existing != null)
        {
            existing.SleepHours = request.SleepHours;
            existing.SleepBedtime = request.SleepBedtime?.Trim();
            existing.SleepWakeTime = request.SleepWakeTime?.Trim();
            existing.SleepQuality = Math.Clamp(request.SleepQuality, 1, 5);
            existing.WaterIntakeMl = request.WaterIntakeMl;
            existing.WeightKg = request.WeightKg;
            existing.StepsCount = request.StepsCount;
            existing.WalkingDistanceKm = request.WalkingDistanceKm;
            existing.BodyMeasurementsJson = request.BodyMeasurementsJson?.Trim();
            existing.Notes = request.Notes?.Trim();

            await _db.SaveChangesAsync(ct);
            return MapToDto(existing);
        }

        var entry = new HealthDailyLog
        {
            UserId = userId,
            LogDate = request.LogDate,
            SleepHours = request.SleepHours,
            SleepBedtime = request.SleepBedtime?.Trim(),
            SleepWakeTime = request.SleepWakeTime?.Trim(),
            SleepQuality = Math.Clamp(request.SleepQuality, 1, 5),
            WaterIntakeMl = request.WaterIntakeMl,
            WeightKg = request.WeightKg,
            StepsCount = request.StepsCount,
            WalkingDistanceKm = request.WalkingDistanceKm,
            BodyMeasurementsJson = request.BodyMeasurementsJson?.Trim(),
            Notes = request.Notes?.Trim()
        };

        _db.HealthLogs.Add(entry);
        await _db.SaveChangesAsync(ct);
        return MapToDto(entry);
    }

    public async Task<IReadOnlyList<WorkoutLogDto>> GetWorkoutLogsAsync(Guid userId, int limit = 30, CancellationToken ct = default)
    {
        var list = await _db.WorkoutLogs.AsNoTracking()
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.WorkoutDate)
            .Take(limit)
            .ToListAsync(ct);

        return list.Select(w => new WorkoutLogDto(
            w.Id,
            w.WorkoutDate,
            w.ActivityType,
            w.DurationMinutes,
            w.Intensity,
            w.CaloriesBurned,
            w.Notes,
            w.CreatedAtUtc
        )).ToList();
    }

    public async Task<WorkoutLogDto> CreateWorkoutLogAsync(Guid userId, CreateWorkoutLogRequest request, CancellationToken ct = default)
    {
        var entry = new WorkoutLog
        {
            UserId = userId,
            WorkoutDate = request.WorkoutDate,
            ActivityType = string.IsNullOrWhiteSpace(request.ActivityType) ? "Cardio" : request.ActivityType.Trim(),
            DurationMinutes = request.DurationMinutes,
            Intensity = string.IsNullOrWhiteSpace(request.Intensity) ? "Medium" : request.Intensity.Trim(),
            CaloriesBurned = request.CaloriesBurned,
            Notes = request.Notes?.Trim()
        };

        _db.WorkoutLogs.Add(entry);
        await _db.SaveChangesAsync(ct);

        return new WorkoutLogDto(
            entry.Id,
            entry.WorkoutDate,
            entry.ActivityType,
            entry.DurationMinutes,
            entry.Intensity,
            entry.CaloriesBurned,
            entry.Notes,
            entry.CreatedAtUtc
        );
    }

    public async Task DeleteWorkoutLogAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var item = await _db.WorkoutLogs.FirstOrDefaultAsync(w => w.UserId == userId && w.Id == id, ct);
        if (item == null)
            throw new NotFoundAppException("Workout log not found.");

        _db.WorkoutLogs.Remove(item);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<MealLogDto>> GetMealLogsAsync(Guid userId, DateOnly? date = null, CancellationToken ct = default)
    {
        var query = _db.MealLogs.AsNoTracking().Where(m => m.UserId == userId);
        if (date.HasValue)
            query = query.Where(m => m.MealDate == date.Value);

        var list = await query.OrderByDescending(m => m.MealDate).ThenBy(m => m.MealType).ToListAsync(ct);
        return list.Select(m => new MealLogDto(m.Id, m.MealDate, m.MealType, m.Description, m.HealthyRating, m.Notes, m.CreatedAtUtc)).ToList();
    }

    public async Task<MealLogDto> CreateMealLogAsync(Guid userId, CreateMealLogRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Description))
            throw new BadRequestException("Meal description is required.");

        var meal = new MealLog
        {
            UserId = userId,
            MealDate = request.MealDate,
            MealType = string.IsNullOrWhiteSpace(request.MealType) ? "Lunch" : request.MealType.Trim(),
            Description = request.Description.Trim(),
            HealthyRating = Math.Clamp(request.HealthyRating, 1, 5),
            Notes = request.Notes?.Trim()
        };

        _db.MealLogs.Add(meal);
        await _db.SaveChangesAsync(ct);

        return new MealLogDto(meal.Id, meal.MealDate, meal.MealType, meal.Description, meal.HealthyRating, meal.Notes, meal.CreatedAtUtc);
    }

    public async Task DeleteMealLogAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var meal = await _db.MealLogs.FirstOrDefaultAsync(m => m.UserId == userId && m.Id == id, ct);
        if (meal == null)
            throw new NotFoundAppException("Meal log not found.");

        _db.MealLogs.Remove(meal);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<HealthSummaryDto> GetHealthSummaryAsync(Guid userId, CancellationToken ct = default)
    {
        var logs = await _db.HealthLogs.AsNoTracking()
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.LogDate)
            .Take(30)
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var weekStart = today.AddDays(-7);

        var workoutsThisWeek = await _db.WorkoutLogs.AsNoTracking()
            .CountAsync(w => w.UserId == userId && w.WorkoutDate >= weekStart, ct);

        decimal avgSleep = logs.Count > 0 ? Math.Round(logs.Average(l => l.SleepHours), 1) : 7.0m;
        int avgWater = logs.Count > 0 ? (int)logs.Average(l => l.WaterIntakeMl) : 2000;
        int avgSteps = logs.Count > 0 ? (int)logs.Average(l => l.StepsCount) : 8000;
        decimal? latestWeight = logs.FirstOrDefault(l => l.WeightKg.HasValue)?.WeightKg;

        return new HealthSummaryDto(
            avgSleep,
            avgWater,
            avgSteps,
            workoutsThisWeek,
            latestWeight,
            logs.Take(7).Select(MapToDto).ToList()
        );
    }

    private static HealthDailyLogDto MapToDto(HealthDailyLog h)
    {
        return new HealthDailyLogDto(
            h.Id,
            h.LogDate,
            h.SleepHours,
            h.SleepBedtime,
            h.SleepWakeTime,
            h.SleepQuality,
            h.WaterIntakeMl,
            h.WeightKg,
            h.StepsCount,
            h.WalkingDistanceKm,
            h.BodyMeasurementsJson,
            h.Notes,
            h.CreatedAtUtc
        );
    }
}

