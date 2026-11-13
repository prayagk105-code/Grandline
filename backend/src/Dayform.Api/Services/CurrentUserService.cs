using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Dayform.Application.Common;
using Dayform.Application.Interfaces;

namespace Dayform.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public Guid UserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var raw = user?.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? user?.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!Guid.TryParse(raw, out var id))
                throw new UnauthorizedAppException("Authenticated user identity is missing.");

            return id;
        }
    }
}

