using Dayform.Application.DTOs.Special;

namespace Dayform.Application.Interfaces;

public interface ISpecialGrandlineService
{
    // 11.1 Life Timeline
    Task<IReadOnlyList<LifeTimelineEventDto>> GetTimelineEventsAsync(Guid userId, CancellationToken ct = default);
    Task<LifeTimelineEventDto> CreateTimelineEventAsync(Guid userId, CreateTimelineEventRequest request, CancellationToken ct = default);
    Task DeleteTimelineEventAsync(Guid userId, Guid id, CancellationToken ct = default);

    // 11.2 Future Self
    Task<IReadOnlyList<FutureLetterDto>> GetFutureLettersAsync(Guid userId, CancellationToken ct = default);
    Task<FutureLetterDto> CreateFutureLetterAsync(Guid userId, CreateFutureLetterRequest request, CancellationToken ct = default);
    Task<FutureLetterDto> MarkFutureLetterReadAsync(Guid userId, Guid id, CancellationToken ct = default);

    // 11.3 90-Day Challenge
    Task<IReadOnlyList<NinetyDayChallengeDto>> GetChallengesAsync(Guid userId, CancellationToken ct = default);
    Task<NinetyDayChallengeDto> CreateChallengeAsync(Guid userId, CreateNinetyDayChallengeRequest request, CancellationToken ct = default);
    Task<NinetyDayChallengeDto> LogChallengeDayAsync(Guid userId, Guid challengeId, LogChallengeDayRequest request, CancellationToken ct = default);

    // 11.5 Personal Rules
    Task<IReadOnlyList<PersonalRuleDto>> GetPersonalRulesAsync(Guid userId, DateOnly? date = null, CancellationToken ct = default);
    Task<PersonalRuleDto> CreatePersonalRuleAsync(Guid userId, CreatePersonalRuleRequest request, CancellationToken ct = default);
    Task<PersonalRuleDto> LogRuleComplianceAsync(Guid userId, Guid ruleId, LogRuleComplianceRequest request, CancellationToken ct = default);
    Task DeletePersonalRuleAsync(Guid userId, Guid id, CancellationToken ct = default);

    // 11.6 Digital Detox
    Task<IReadOnlyList<DigitalDetoxDto>> GetDigitalDetoxesAsync(Guid userId, CancellationToken ct = default);
    Task<DigitalDetoxDto> CreateDigitalDetoxAsync(Guid userId, CreateDigitalDetoxRequest request, CancellationToken ct = default);
    Task<DigitalDetoxDto> LogDetoxCleanDayAsync(Guid userId, Guid id, CancellationToken ct = default);

    // 11.7 Monthly Reflection
    Task<MonthlyReflectionDto?> GetMonthlyReflectionAsync(Guid userId, int year, int month, CancellationToken ct = default);
    Task<MonthlyReflectionDto> UpsertMonthlyReflectionAsync(Guid userId, UpsertMonthlyReflectionRequest request, CancellationToken ct = default);

    // 11.10 Discipline Score
    Task<DisciplineScoreDto> GetDisciplineScoreAsync(Guid userId, CancellationToken ct = default);
}

