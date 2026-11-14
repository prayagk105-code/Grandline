using Dayform.Application.Common;
using Dayform.Application.DTOs.Focus;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class FocusService : IFocusService
{
    private readonly IDayformDbContext _db;

    public FocusService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<FocusSessionDto>> GetFocusSessionsAsync(Guid userId, DateOnly? date = null, int limit = 50, CancellationToken ct = default)
    {
        var query = _db.FocusSessions.AsNoTracking().Where(f => f.UserId == userId);
        if (date.HasValue)
            query = query.Where(f => f.SessionDate == date.Value);

        var list = await query
            .OrderByDescending(f => f.CompletedAtUtc)
            .Take(limit)
            .ToListAsync(ct);

        return list.Select(f => new FocusSessionDto(
            f.Id,
            f.SessionDate,
            f.SessionType,
            f.DurationMinutes,
            f.DistractionCount,
            f.DistractionNotes,
            f.Notes,
            f.CompletedAtUtc
        )).ToList();
    }

    public async Task<FocusSessionDto> CreateFocusSessionAsync(Guid userId, CreateFocusSessionRequest request, CancellationToken ct = default)
    {
        if (request.DurationMinutes <= 0)
            throw new BadRequestException("Duration must be greater than 0 minutes.");

        var session = new FocusSession
        {
            UserId = userId,
            SessionDate = request.SessionDate,
            SessionType = string.IsNullOrWhiteSpace(request.SessionType) ? "Pomodoro" : request.SessionType.Trim(),
            DurationMinutes = request.DurationMinutes,
            DistractionCount = request.DistractionCount,
            DistractionNotes = request.DistractionNotes?.Trim(),
            Notes = request.Notes?.Trim(),
            CompletedAtUtc = DateTime.UtcNow
        };

        _db.FocusSessions.Add(session);
        await _db.SaveChangesAsync(ct);

        return new FocusSessionDto(
            session.Id,
            session.SessionDate,
            session.SessionType,
            session.DurationMinutes,
            session.DistractionCount,
            session.DistractionNotes,
            session.Notes,
            session.CompletedAtUtc
        );
    }

    public async Task<FocusSummaryDto> GetFocusSummaryAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
        var targetMinutes = user?.DailyFocusTargetMinutes ?? 120;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var weekStart = today.AddDays(-((int)today.DayOfWeek == 0 ? 6 : (int)today.DayOfWeek - 1));

        var sessions = await _db.FocusSessions.AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CompletedAtUtc)
            .Take(100)
            .ToListAsync(ct);

        var todaySessions = sessions.Where(s => s.SessionDate == today).ToList();
        var weekSessions = sessions.Where(s => s.SessionDate >= weekStart).ToList();

        var todayMinutes = todaySessions.Sum(s => s.DurationMinutes);
        var weekMinutes = weekSessions.Sum(s => s.DurationMinutes);
        var deepWorkMinutes = sessions.Where(s => s.SessionType == "DeepWork").Sum(s => s.DurationMinutes);
        var totalDistractions = sessions.Sum(s => s.DistractionCount);

        var recentDtos = sessions.Take(10).Select(f => new FocusSessionDto(
            f.Id,
            f.SessionDate,
            f.SessionType,
            f.DurationMinutes,
            f.DistractionCount,
            f.DistractionNotes,
            f.Notes,
            f.CompletedAtUtc
        )).ToList();

        return new FocusSummaryDto(
            targetMinutes,
            todayMinutes,
            weekMinutes,
            sessions.Count,
            deepWorkMinutes,
            totalDistractions,
            recentDtos
        );
    }

    public async Task<IReadOnlyList<ScreenTimeLogDto>> GetScreenTimeLogsAsync(Guid userId, DateOnly? date = null, CancellationToken ct = default)
    {
        var query = _db.ScreenTimeLogs.AsNoTracking().Where(s => s.UserId == userId);
        if (date.HasValue)
            query = query.Where(s => s.LogDate == date.Value);

        var list = await query.OrderByDescending(s => s.LogDate).Take(50).ToListAsync(ct);
        return list.Select(s => new ScreenTimeLogDto(s.Id, s.LogDate, s.Category, s.DurationMinutes, s.Notes, s.CreatedAtUtc)).ToList();
    }

    public async Task<ScreenTimeLogDto> CreateScreenTimeLogAsync(Guid userId, CreateScreenTimeLogRequest request, CancellationToken ct = default)
    {
        var log = new ScreenTimeLog
        {
            UserId = userId,
            LogDate = request.LogDate,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Work" : request.Category.Trim(),
            DurationMinutes = request.DurationMinutes,
            Notes = request.Notes?.Trim()
        };

        _db.ScreenTimeLogs.Add(log);
        await _db.SaveChangesAsync(ct);

        return new ScreenTimeLogDto(log.Id, log.LogDate, log.Category, log.DurationMinutes, log.Notes, log.CreatedAtUtc);
    }
}

