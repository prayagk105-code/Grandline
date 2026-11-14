namespace Dayform.Application.DTOs.Gamification;

public record GamificationStatusDto(
    int TotalXp,
    int Level,
    string TierTitle,
    int XpInCurrentLevel,
    int XpToNextLevel,
    int ProgressPercent,
    IReadOnlyList<UserAchievementDto> Achievements,
    IReadOnlyList<DailyMissionDto> DailyMissions,
    IReadOnlyList<CustomRewardDto> AvailableRewards
);

public record UserAchievementDto(
    Guid Id,
    string BadgeKey,
    string Title,
    string Description,
    string Icon,
    string Category,
    DateTime UnlockedAtUtc
);

public record DailyMissionDto(
    Guid Id,
    DateOnly MissionDate,
    string Title,
    string? Description,
    string Category,
    int TargetCount,
    int CurrentCount,
    int XpReward,
    bool IsCompleted,
    bool IsClaimed
);

public record CustomRewardDto(
    Guid Id,
    string Title,
    int XpCost,
    string Icon,
    string? Description,
    bool IsRedeemed,
    DateTime? RedeemedAtUtc
);

public record CreateCustomRewardRequest(
    string Title,
    int XpCost,
    string Icon,
    string? Description
);

