using Dayform.Application.DTOs.Gamification;

namespace Dayform.Application.Interfaces;

public interface IGamificationService
{
    Task<GamificationStatusDto> GetGamificationStatusAsync(Guid userId, CancellationToken ct = default);
    Task<GamificationStatusDto> AwardXpAsync(Guid userId, int amount, string reason, CancellationToken ct = default);
    Task<DailyMissionDto> ClaimMissionRewardAsync(Guid userId, Guid missionId, CancellationToken ct = default);
    Task<CustomRewardDto> CreateRewardAsync(Guid userId, CreateCustomRewardRequest request, CancellationToken ct = default);
    Task<CustomRewardDto> RedeemRewardAsync(Guid userId, Guid rewardId, CancellationToken ct = default);
}

