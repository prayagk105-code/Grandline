using Dayform.Application.Common;
using Dayform.Application.DTOs.Study;
using Dayform.Application.Interfaces;
using Dayform.Application.Logic;
using Dayform.Domain.Entities;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class StudyService : IStudyService
{
    private readonly IDayformDbContext _db;
    private readonly IValidator<CreateLearningPathRequest> _createPathValidator;
    private readonly IValidator<UpdateLearningPathRequest> _updatePathValidator;
    private readonly IValidator<CreateStudySessionRequest> _createSessionValidator;
    private readonly IValidator<UpdateStudySessionRequest> _updateSessionValidator;

    public StudyService(
        IDayformDbContext db,
        IValidator<CreateLearningPathRequest> createPathValidator,
        IValidator<UpdateLearningPathRequest> updatePathValidator,
        IValidator<CreateStudySessionRequest> createSessionValidator,
        IValidator<UpdateStudySessionRequest> updateSessionValidator)
    {
        _db = db;
        _createPathValidator = createPathValidator;
        _updatePathValidator = updatePathValidator;
        _createSessionValidator = createSessionValidator;
        _updateSessionValidator = updateSessionValidator;
    }

    public async Task<IReadOnlyList<LearningPathDto>> GetLearningPathsAsync(Guid userId, bool includeArchived, CancellationToken ct = default)
    {
        var pathsQuery = _db.LearningPaths.AsNoTracking().Where(p => p.UserId == userId);
        if (!includeArchived)
            pathsQuery = pathsQuery.Where(p => !p.IsArchived);

        var paths = await pathsQuery.OrderBy(p => p.CreatedAtUtc).ToListAsync(ct);
        var pathIds = paths.Select(p => p.Id).ToList();

        var aggregates = await _db.StudySessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.LearningPathId != null && pathIds.Contains(s.LearningPathId.Value))
            .GroupBy(s => s.LearningPathId!.Value)
            .Select(g => new
            {
                LearningPathId = g.Key,
                TotalMinutes = g.Sum(x => x.Minutes),
                SessionCount = g.Count(),
                LastDate = g.Max(x => x.SessionDate)
            })
            .ToDictionaryAsync(x => x.LearningPathId, ct);

        return paths.Select(p =>
        {
            aggregates.TryGetValue(p.Id, out var agg);
            return new LearningPathDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Icon = p.Icon,
                TargetMinutes = p.TargetMinutes,
                Progress = p.Progress,
                IsArchived = p.IsArchived,
                TotalMinutesLogged = agg?.TotalMinutes ?? 0,
                SessionCount = agg?.SessionCount ?? 0,
                LastSessionDate = agg?.LastDate,
                CreatedAtUtc = p.CreatedAtUtc
            };
        }).ToList();
    }

    public async Task<LearningPathDto> GetLearningPathByIdAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var path = await _db.LearningPaths.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId, ct)
            ?? throw new NotFoundAppException("Learning path not found.");

        var sessions = await _db.StudySessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.LearningPathId == id)
            .ToListAsync(ct);

        return new LearningPathDto
        {
            Id = path.Id,
            Name = path.Name,
            Description = path.Description,
            Icon = path.Icon,
            TargetMinutes = path.TargetMinutes,
            Progress = path.Progress,
            IsArchived = path.IsArchived,
            TotalMinutesLogged = sessions.Sum(s => s.Minutes),
            SessionCount = sessions.Count,
            LastSessionDate = sessions.Count > 0 ? sessions.Max(s => s.SessionDate) : null,
            CreatedAtUtc = path.CreatedAtUtc
        };
    }

    public async Task<LearningPathDto> CreateLearningPathAsync(Guid userId, CreateLearningPathRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_createPathValidator, request, ct);

        var path = new LearningPath
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Icon = request.Icon.Trim(),
            TargetMinutes = request.TargetMinutes,
            Progress = Math.Clamp(request.Progress, 0, 100),
            IsArchived = false
        };

        _db.LearningPaths.Add(path);
        await _db.SaveChangesAsync(ct);

        return new LearningPathDto
        {
            Id = path.Id,
            Name = path.Name,
            Description = path.Description,
            Icon = path.Icon,
            TargetMinutes = path.TargetMinutes,
            Progress = path.Progress,
            IsArchived = path.IsArchived,
            TotalMinutesLogged = 0,
            SessionCount = 0,
            LastSessionDate = null,
            CreatedAtUtc = path.CreatedAtUtc
        };
    }

    public async Task<LearningPathDto> UpdateLearningPathAsync(Guid userId, Guid id, UpdateLearningPathRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_updatePathValidator, request, ct);

        var path = await _db.LearningPaths
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId, ct)
            ?? throw new NotFoundAppException("Learning path not found.");

        path.Name = request.Name.Trim();
        path.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        path.Icon = request.Icon.Trim();
        path.TargetMinutes = request.TargetMinutes;
        path.Progress = Math.Clamp(request.Progress, 0, 100);
        path.IsArchived = request.IsArchived;

        await _db.SaveChangesAsync(ct);
        return await GetLearningPathByIdAsync(userId, id, ct);
    }

    public async Task DeleteLearningPathAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var path = await _db.LearningPaths
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId, ct)
            ?? throw new NotFoundAppException("Learning path not found.");

        _db.LearningPaths.Remove(path);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<StudySessionDto>> GetSessionsAsync(
        Guid userId,
        Guid? learningPathId,
        DateOnly? from,
        DateOnly? to,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.StudySessions.AsNoTracking()
            .Include(s => s.LearningPath)
            .Where(s => s.UserId == userId);

        if (learningPathId.HasValue)
            query = query.Where(s => s.LearningPathId == learningPathId.Value);

        if (from.HasValue)
            query = query.Where(s => s.SessionDate >= from.Value);

        if (to.HasValue)
            query = query.Where(s => s.SessionDate <= to.Value);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(s => s.SessionDate)
            .ThenByDescending(s => s.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new StudySessionDto
            {
                Id = s.Id,
                LearningPathId = s.LearningPathId,
                LearningPathName = s.LearningPath != null ? s.LearningPath.Name : "General study",
                Topic = s.Topic,
                Minutes = s.Minutes,
                SessionDate = s.SessionDate,
                Notes = s.Notes,
                StartedAtUtc = s.StartedAtUtc,
                CompletedAtUtc = s.CompletedAtUtc,
                CreatedAtUtc = s.CreatedAtUtc
            })
            .ToListAsync(ct);

        return new PagedResult<StudySessionDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<StudySessionDto> GetSessionByIdAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var s = await _db.StudySessions.AsNoTracking()
            .Include(x => x.LearningPath)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct)
            ?? throw new NotFoundAppException("Study session not found.");

        return MapSessionDto(s, s.LearningPath?.Name ?? "General study");
    }

    public async Task<StudySessionDto> CreateSessionAsync(Guid userId, CreateStudySessionRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_createSessionValidator, request, ct);

        if (!string.IsNullOrWhiteSpace(request.ClientSessionKey))
        {
            var duplicate = await _db.StudySessions.AsNoTracking()
                .Include(x => x.LearningPath)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.ClientSessionKey == request.ClientSessionKey, ct);
            if (duplicate is not null)
                return MapSessionDto(duplicate, duplicate.LearningPath?.Name ?? "General study");
        }

        string pathName = "General study";
        if (request.LearningPathId.HasValue)
        {
            var lp = await _db.LearningPaths.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.LearningPathId.Value && p.UserId == userId, ct)
                ?? throw new NotFoundAppException("Learning path not found.");
            pathName = lp.Name;
        }

        var session = new StudySession
        {
            UserId = userId,
            LearningPathId = request.LearningPathId,
            Topic = request.Topic.Trim(),
            Minutes = request.Minutes,
            SessionDate = request.SessionDate,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            StartedAtUtc = request.StartedAtUtc,
            CompletedAtUtc = request.CompletedAtUtc,
            ClientSessionKey = string.IsNullOrWhiteSpace(request.ClientSessionKey) ? null : request.ClientSessionKey.Trim()
        };

        _db.StudySessions.Add(session);
        await _db.SaveChangesAsync(ct);

        return MapSessionDto(session, pathName);
    }

    public async Task<StudySessionDto> UpdateSessionAsync(Guid userId, Guid id, UpdateStudySessionRequest request, CancellationToken ct = default)
    {
        await ValidationHelper.ValidateAndThrowAsync(_updateSessionValidator, request, ct);

        var session = await _db.StudySessions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct)
            ?? throw new NotFoundAppException("Study session not found.");

        string pathName = "General study";
        if (request.LearningPathId.HasValue)
        {
            var lp = await _db.LearningPaths.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == request.LearningPathId.Value && p.UserId == userId, ct)
                ?? throw new NotFoundAppException("Learning path not found.");
            pathName = lp.Name;
        }

        session.LearningPathId = request.LearningPathId;
        session.Topic = request.Topic.Trim();
        session.Minutes = request.Minutes;
        session.SessionDate = request.SessionDate;
        session.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await _db.SaveChangesAsync(ct);
        return MapSessionDto(session, pathName);
    }

    public async Task DeleteSessionAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var session = await _db.StudySessions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct)
            ?? throw new NotFoundAppException("Study session not found.");

        _db.StudySessions.Remove(session);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<StudySummaryDto> GetSummaryAsync(Guid userId, DateOnly? clientDate, CancellationToken ct = default)
    {
        var tz = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.TimeZoneId)
            .FirstOrDefaultAsync(ct);
        var today = DateHelper.ResolveUserToday(tz, clientDate);
        var weekStart = today.AddDays(-6);

        var totalMinutes = await _db.StudySessions.AsNoTracking()
            .Where(s => s.UserId == userId)
            .SumAsync(s => (int?)s.Minutes, ct) ?? 0;

        var totalSessions = await _db.StudySessions.AsNoTracking()
            .CountAsync(s => s.UserId == userId, ct);

        var weekMinutes = await _db.StudySessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.SessionDate >= weekStart && s.SessionDate <= today)
            .SumAsync(s => (int?)s.Minutes, ct) ?? 0;

        return new StudySummaryDto
        {
            TotalMinutesAllTime = totalMinutes,
            TotalSessionsAllTime = totalSessions,
            MinutesThisWeek = weekMinutes
        };
    }

    private static StudySessionDto MapSessionDto(StudySession s, string pathName) => new()
    {
        Id = s.Id,
        LearningPathId = s.LearningPathId,
        LearningPathName = pathName,
        Topic = s.Topic,
        Minutes = s.Minutes,
        SessionDate = s.SessionDate,
        Notes = s.Notes,
        StartedAtUtc = s.StartedAtUtc,
        CompletedAtUtc = s.CompletedAtUtc,
        CreatedAtUtc = s.CreatedAtUtc
    };
}

