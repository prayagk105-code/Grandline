using Dayform.Domain.Entities;

namespace Dayform.Application.Interfaces;

public interface ITokenService
{
    (string Token, DateTime ExpiresAtUtc) GenerateAccessToken(User user);
    string GenerateRefreshToken();
    string HashToken(string rawToken);
}

public interface ICurrentUserService
{
    Guid UserId { get; }
    bool IsAuthenticated { get; }
}

