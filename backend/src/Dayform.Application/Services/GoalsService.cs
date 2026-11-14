using Dayform.Application.Common;
using Dayform.Application.DTOs.Goals;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class GoalsService : IGoalService
{
    private readonly IDayformDbContext _db;

    public GoalsService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<GoalDto>> GetGoalsAsync(Guid userId, string? category = null, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Goals.AsNoTracking()
            .Include(g => g.Milestones)
            .Include(g => g.ActionSteps)
            .Where(g => g.UserId == userId);

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(g => g.Category == category);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            query = query.Where(g => g.Status == status);

        var list = await query.OrderByDescending(g => g.CreatedAtUtc).ToListAsync(ct);
        return list.Select(MapToDto).ToList();
    }

    public async Task<GoalDto> GetGoalByIdAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var goal = await _db.Goals.AsNoTracking()
            .Include(g => g.Milestones)
            .Include(g => g.ActionSteps)
            .FirstOrDefaultAsync(g => g.UserId == userId && g.Id == id, ct);

        if (goal == null)
            throw new NotFoundAppException("Goal not found.");

        return MapToDto(goal);
    }

    public async Task<GoalDto> CreateGoalAsync(Guid userId, CreateGoalRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Goal title is required.");

        var goal = new Goal
        {
            UserId = userId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Personal" : request.Category.Trim(),
            Timeframe = string.IsNullOrWhiteSpace(request.Timeframe) ? "Yearly" : request.Timeframe.Trim(),
            StartDate = request.StartDate,
            TargetDate = request.TargetDate,
            ProgressPercentage = 0,
            Status = "Active",
            ConnectedHabitId = request.ConnectedHabitId
        };

        if (request.Milestones != null && request.Milestones.Count > 0)
        {
            foreach (var m in request.Milestones)
            {
                if (!string.IsNullOrWhiteSpace(m))
                {
                    goal.Milestones.Add(new GoalMilestone
                    {
                        GoalId = goal.Id,
                        Title = m.Trim()
                    });
                }
            }
        }

        if (request.ActionSteps != null && request.ActionSteps.Count > 0)
        {
            int idx = 0;
            foreach (var s in request.ActionSteps)
            {
                if (!string.IsNullOrWhiteSpace(s))
                {
                    goal.ActionSteps.Add(new GoalActionStep
                    {
                        GoalId = goal.Id,
                        Title = s.Trim(),
                        OrderIndex = idx++
                    });
                }
            }
        }

        _db.Goals.Add(goal);
        await _db.SaveChangesAsync(ct);

        return MapToDto(goal);
    }

    public async Task<GoalDto> UpdateGoalAsync(Guid userId, Guid id, UpdateGoalRequest request, CancellationToken ct = default)
    {
        var goal = await _db.Goals
            .Include(g => g.Milestones)
            .Include(g => g.ActionSteps)
            .FirstOrDefaultAsync(g => g.UserId == userId && g.Id == id, ct);

        if (goal == null)
            throw new NotFoundAppException("Goal not found.");

        goal.Title = request.Title.Trim();
        goal.Description = request.Description?.Trim();
        goal.Category = request.Category.Trim();
        goal.Timeframe = request.Timeframe.Trim();
        goal.StartDate = request.StartDate;
        goal.TargetDate = request.TargetDate;
        goal.ProgressPercentage = Math.Clamp(request.ProgressPercentage, 0, 100);
        goal.Status = request.Status.Trim();
        goal.ConnectedHabitId = request.ConnectedHabitId;

        await _db.SaveChangesAsync(ct);
        return MapToDto(goal);
    }

    public async Task DeleteGoalAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var goal = await _db.Goals.FirstOrDefaultAsync(g => g.UserId == userId && g.Id == id, ct);
        if (goal == null)
            throw new NotFoundAppException("Goal not found.");

        _db.Goals.Remove(goal);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<GoalMilestoneDto> ToggleMilestoneAsync(Guid userId, Guid goalId, Guid milestoneId, CancellationToken ct = default)
    {
        var milestone = await _db.GoalMilestones
            .Include(m => m.Goal)
            .FirstOrDefaultAsync(m => m.Id == milestoneId && m.GoalId == goalId && m.Goal.UserId == userId, ct);

        if (milestone == null)
            throw new NotFoundAppException("Milestone not found.");

        milestone.IsCompleted = !milestone.IsCompleted;
        milestone.CompletedAtUtc = milestone.IsCompleted ? DateTime.UtcNow : null;

        // Auto update goal progress %
        var allMilestones = await _db.GoalMilestones.Where(m => m.GoalId == goalId).ToListAsync(ct);
        if (allMilestones.Count > 0)
        {
            var completedCount = allMilestones.Count(m => m.Id == milestoneId ? milestone.IsCompleted : m.IsCompleted);
            milestone.Goal.ProgressPercentage = (int)Math.Round((double)completedCount / allMilestones.Count * 100);
            if (milestone.Goal.ProgressPercentage == 100)
                milestone.Goal.Status = "Completed";
        }

        await _db.SaveChangesAsync(ct);
        return new GoalMilestoneDto(milestone.Id, milestone.GoalId, milestone.Title, milestone.TargetDate, milestone.IsCompleted, milestone.CompletedAtUtc);
    }

    public async Task<GoalActionStepDto> ToggleActionStepAsync(Guid userId, Guid goalId, Guid stepId, CancellationToken ct = default)
    {
        var step = await _db.GoalActionSteps
            .Include(s => s.Goal)
            .FirstOrDefaultAsync(s => s.Id == stepId && s.GoalId == goalId && s.Goal.UserId == userId, ct);

        if (step == null)
            throw new NotFoundAppException("Action step not found.");

        step.IsCompleted = !step.IsCompleted;
        await _db.SaveChangesAsync(ct);

        return new GoalActionStepDto(step.Id, step.GoalId, step.Title, step.IsCompleted, step.OrderIndex);
    }

    public async Task<IReadOnlyList<VisionBoardItemDto>> GetVisionBoardAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.VisionBoardItems.AsNoTracking()
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.CreatedAtUtc)
            .ToListAsync(ct);

        return list.Select(v => new VisionBoardItemDto(v.Id, v.Title, v.ImageUrl, v.Quote, v.Category, v.TargetYear, v.CreatedAtUtc)).ToList();
    }

    public async Task<VisionBoardItemDto> AddVisionBoardItemAsync(Guid userId, CreateVisionBoardItemRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Vision item title is required.");

        var item = new VisionBoardItem
        {
            UserId = userId,
            Title = request.Title.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            Quote = request.Quote?.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
            TargetYear = request.TargetYear
        };

        _db.VisionBoardItems.Add(item);
        await _db.SaveChangesAsync(ct);

        return new VisionBoardItemDto(item.Id, item.Title, item.ImageUrl, item.Quote, item.Category, item.TargetYear, item.CreatedAtUtc);
    }

    public async Task DeleteVisionBoardItemAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var item = await _db.VisionBoardItems.FirstOrDefaultAsync(v => v.UserId == userId && v.Id == id, ct);
        if (item == null)
            throw new NotFoundAppException("Vision board item not found.");

        _db.VisionBoardItems.Remove(item);
        await _db.SaveChangesAsync(ct);
    }

    private static GoalDto MapToDto(Goal g)
    {
        return new GoalDto(
            g.Id,
            g.Title,
            g.Description,
            g.Category,
            g.Timeframe,
            g.StartDate,
            g.TargetDate,
            g.ProgressPercentage,
            g.Status,
            g.ConnectedHabitId,
            g.Milestones.Select(m => new GoalMilestoneDto(m.Id, m.GoalId, m.Title, m.TargetDate, m.IsCompleted, m.CompletedAtUtc)).ToList(),
            g.ActionSteps.OrderBy(s => s.OrderIndex).Select(s => new GoalActionStepDto(s.Id, s.GoalId, s.Title, s.IsCompleted, s.OrderIndex)).ToList(),
            g.CreatedAtUtc
        );
    }
}

