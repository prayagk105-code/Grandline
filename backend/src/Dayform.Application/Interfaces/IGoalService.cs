using Dayform.Application.DTOs.Goals;

namespace Dayform.Application.Interfaces;

public interface IGoalService
{
    Task<IReadOnlyList<GoalDto>> GetGoalsAsync(Guid userId, string? category = null, string? status = null, CancellationToken ct = default);
    Task<GoalDto> GetGoalByIdAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<GoalDto> CreateGoalAsync(Guid userId, CreateGoalRequest request, CancellationToken ct = default);
    Task<GoalDto> UpdateGoalAsync(Guid userId, Guid id, UpdateGoalRequest request, CancellationToken ct = default);
    Task DeleteGoalAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<GoalMilestoneDto> ToggleMilestoneAsync(Guid userId, Guid goalId, Guid milestoneId, CancellationToken ct = default);
    Task<GoalActionStepDto> ToggleActionStepAsync(Guid userId, Guid goalId, Guid stepId, CancellationToken ct = default);

    Task<IReadOnlyList<VisionBoardItemDto>> GetVisionBoardAsync(Guid userId, CancellationToken ct = default);
    Task<VisionBoardItemDto> AddVisionBoardItemAsync(Guid userId, CreateVisionBoardItemRequest request, CancellationToken ct = default);
    Task DeleteVisionBoardItemAsync(Guid userId, Guid id, CancellationToken ct = default);
}

