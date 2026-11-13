using Dayform.Application.Common;
using Dayform.Application.DTOs.Study;

namespace Dayform.Application.Interfaces;

public interface IStudyService
{
    Task<IReadOnlyList<LearningPathDto>> GetLearningPathsAsync(Guid userId, bool includeArchived, CancellationToken ct = default);
    Task<LearningPathDto> GetLearningPathByIdAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<LearningPathDto> CreateLearningPathAsync(Guid userId, CreateLearningPathRequest request, CancellationToken ct = default);
    Task<LearningPathDto> UpdateLearningPathAsync(Guid userId, Guid id, UpdateLearningPathRequest request, CancellationToken ct = default);
    Task DeleteLearningPathAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<PagedResult<StudySessionDto>> GetSessionsAsync(Guid userId, Guid? learningPathId, DateOnly? from, DateOnly? to, int page, int pageSize, CancellationToken ct = default);
    Task<StudySessionDto> GetSessionByIdAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<StudySessionDto> CreateSessionAsync(Guid userId, CreateStudySessionRequest request, CancellationToken ct = default);
    Task<StudySessionDto> UpdateSessionAsync(Guid userId, Guid id, UpdateStudySessionRequest request, CancellationToken ct = default);
    Task DeleteSessionAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task<StudySummaryDto> GetSummaryAsync(Guid userId, DateOnly? clientDate, CancellationToken ct = default);
}

