using Dayform.Application.DTOs.Profile;

namespace Dayform.Application.Interfaces;

public interface IProfileService
{
    Task<ProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default);
    Task<ProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task<UserExportDto> ExportDataAsync(Guid userId, CancellationToken ct = default);
    Task<string> ExportCsvAsync(Guid userId, CancellationToken ct = default);
    Task RestoreDataAsync(Guid userId, UserExportDto data, CancellationToken ct = default);
    Task<bool> SetPinAsync(Guid userId, string? pin, CancellationToken ct = default);
    Task<bool> VerifyPinAsync(Guid userId, string pin, CancellationToken ct = default);
    Task DeleteAccountAsync(Guid userId, CancellationToken ct = default);
}

public interface IDemoSeedService
{
    Task SeedDemoDataAsync(bool resetExisting = false, CancellationToken ct = default);
    Task RemoveDemoDataAsync(CancellationToken ct = default);
}
