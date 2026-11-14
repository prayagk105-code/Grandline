using Dayform.Application.Common;
using Dayform.Application.DTOs.Gamification;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class GamificationService : IGamificationService
{
    private readonly IDayformDbContext _db;

    public GamificationService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<GamificationStatusDto> GetGamificationStatusAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await EnsureProfileAsync(userId, ct);
        await EnsureDailyMissionsAsync(userId, ct);
        await EvaluateBadgesAsync(userId, ct);

        var achievements = await _db.Achievements.AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.UnlockedAtUtc)
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var missions = await _db.DailyMissions.AsNoTracking()
            .Where(m => m.UserId == userId && m.MissionDate == today)
            .ToListAsync(ct);

        var rewards = await _db.CustomRewards.AsNoTracking()
            .Where(r => r.UserId == userId && !r.IsRedeemed)
            .ToListAsync(ct);

        // Level formula: Level = floor(sqrt(TotalXp / 100)) + 1
        int level = (int)Math.Floor(Math.Sqrt(profile.TotalXp / 100.0)) + 1;
        int xpForCurrentLevel = (level - 1) * (level - 1) * 100;
        int xpForNextLevel = level * level * 100;
        int xpInLevel = Math.Max(0, profile.TotalXp - xpForCurrentLevel);
        int needed = Math.Max(1, xpForNextLevel - xpForCurrentLevel);
        int progressPct = Math.Clamp((int)Math.Round((double)xpInLevel / needed * 100), 0, 100);

        string tier = GetTierTitle(level);

        return new GamificationStatusDto(
            profile.TotalXp,
            level,
            tier,
            xpInLevel,
            needed - xpInLevel,
            progressPct,
            achievements.Select(a => new UserAchievementDto(a.Id, a.BadgeKey, a.Title, a.Description, a.Icon, a.Category, a.UnlockedAtUtc)).ToList(),
            missions.Select(m => new DailyMissionDto(m.Id, m.MissionDate, m.Title, m.Description, m.Category, m.TargetCount, m.CurrentCount, m.XpReward, m.IsCompleted, m.IsClaimed)).ToList(),
            rewards.Select(r => new CustomRewardDto(r.Id, r.Title, r.XpCost, r.Icon, r.Description, r.IsRedeemed, r.RedeemedAtUtc)).ToList()
        );
    }

    public async Task<GamificationStatusDto> AwardXpAsync(Guid userId, int amount, string reason, CancellationToken ct = default)
    {
        var profile = await EnsureProfileAsync(userId, ct);
        profile.TotalXp += Math.Max(0, amount);
        int level = (int)Math.Floor(Math.Sqrt(profile.TotalXp / 100.0)) + 1;
        profile.Level = level;
        profile.TierTitle = GetTierTitle(level);

        await _db.SaveChangesAsync(ct);
        return await GetGamificationStatusAsync(userId, ct);
    }

    public async Task<DailyMissionDto> ClaimMissionRewardAsync(Guid userId, Guid missionId, CancellationToken ct = default)
    {
        var mission = await _db.DailyMissions.FirstOrDefaultAsync(m => m.UserId == userId && m.Id == missionId, ct);
        if (mission == null) throw new NotFoundAppException("Mission not found.");
        if (mission.IsClaimed) throw new BadRequestException("Reward already claimed.");

        mission.IsCompleted = true;
        mission.IsClaimed = true;

        var profile = await EnsureProfileAsync(userId, ct);
        profile.TotalXp += mission.XpReward;
        await _db.SaveChangesAsync(ct);

        return new DailyMissionDto(mission.Id, mission.MissionDate, mission.Title, mission.Description, mission.Category, mission.TargetCount, mission.CurrentCount, mission.XpReward, mission.IsCompleted, mission.IsClaimed);
    }

    public async Task<CustomRewardDto> CreateRewardAsync(Guid userId, CreateCustomRewardRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Reward title is required.");

        var reward = new CustomReward
        {
            UserId = userId,
            Title = request.Title.Trim(),
            XpCost = Math.Max(10, request.XpCost),
            Icon = string.IsNullOrWhiteSpace(request.Icon) ? "gift" : request.Icon.Trim(),
            Description = request.Description?.Trim(),
            IsRedeemed = false
        };

        _db.CustomRewards.Add(reward);
        await _db.SaveChangesAsync(ct);

        return new CustomRewardDto(reward.Id, reward.Title, reward.XpCost, reward.Icon, reward.Description, reward.IsRedeemed, reward.RedeemedAtUtc);
    }

    public async Task<CustomRewardDto> RedeemRewardAsync(Guid userId, Guid rewardId, CancellationToken ct = default)
    {
        var reward = await _db.CustomRewards.FirstOrDefaultAsync(r => r.UserId == userId && r.Id == rewardId, ct);
        if (reward == null) throw new NotFoundAppException("Reward not found.");
        if (reward.IsRedeemed) throw new BadRequestException("Reward already redeemed.");

        var profile = await EnsureProfileAsync(userId, ct);
        if (profile.TotalXp < reward.XpCost)
            throw new BadRequestException($"Insufficient XP. You need {reward.XpCost} XP but have {profile.TotalXp} XP.");

        profile.TotalXp -= reward.XpCost;
        reward.IsRedeemed = true;
        reward.RedeemedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new CustomRewardDto(reward.Id, reward.Title, reward.XpCost, reward.Icon, reward.Description, reward.IsRedeemed, reward.RedeemedAtUtc);
    }

    private async Task<GamificationProfile> EnsureProfileAsync(Guid userId, CancellationToken ct)
    {
        var profile = await _db.GamificationProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
        if (profile != null) return profile;

        profile = new GamificationProfile
        {
            UserId = userId,
            TotalXp = 350,
            Level = 2,
            TierTitle = "Grandline Voyager"
        };
        _db.GamificationProfiles.Add(profile);
        await _db.SaveChangesAsync(ct);
        return profile;
    }

    private async Task EnsureDailyMissionsAsync(Guid userId, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var existing = await _db.DailyMissions.AnyAsync(m => m.UserId == userId && m.MissionDate == today, ct);
        if (existing) return;

        var defaults = new List<DailyMission>
        {
            new() { UserId = userId, MissionDate = today, Title = "Log 3 Habit completions", Category = "Habit", TargetCount = 3, CurrentCount = 0, XpReward = 40 },
            new() { UserId = userId, MissionDate = today, Title = "Complete 25m Deep Work", Category = "Focus", TargetCount = 25, CurrentCount = 0, XpReward = 50 },
            new() { UserId = userId, MissionDate = today, Title = "Record Daily Reflection & Gratitude", Category = "Reflection", TargetCount = 1, CurrentCount = 0, XpReward = 35 }
        };

        _db.DailyMissions.AddRange(defaults);
        await _db.SaveChangesAsync(ct);
    }

    private async Task EvaluateBadgesAsync(Guid userId, CancellationToken ct)
    {
        var hasFirstHabit = await _db.Achievements.AnyAsync(a => a.UserId == userId && a.BadgeKey == "first_habit", ct);
        if (!hasFirstHabit)
        {
            var habitCount = await _db.Habits.CountAsync(h => h.UserId == userId, ct);
            if (habitCount > 0)
            {
                _db.Achievements.Add(new UserAchievement
                {
                    UserId = userId,
                    BadgeKey = "first_habit",
                    Title = "Anchor Raised",
                    Description = "Created your first Grandline habit.",
                    Icon = "anchor",
                    Category = "Habits"
                });
                await _db.SaveChangesAsync(ct);
            }
        }
    }

    private static string GetTierTitle(int level) => level switch
    {
        <= 1 => "Novice Mariner",
        <= 3 => "Grandline Voyager",
        <= 6 => "Sea Adventurer",
        <= 9 => "Captain of Discipline",
        <= 14 => "Master of Haki",
        _ => "King of the Grandline"
    };
}

