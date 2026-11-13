using Dayform.Application.DTOs.Auth;
using Dayform.Application.Validators;

namespace Dayform.UnitTests;

public class AuthValidatorTests
{
    private readonly RegisterRequestValidator _registerValidator = new();

    [Fact]
    public async Task RegisterValidator_RejectsWeakPassword()
    {
        var req = new RegisterRequest
        {
            DisplayName = "Alex",
            Email = "alex@example.com",
            Password = "onlyletters"
        };

        var result = await _registerValidator.ValidateAsync(req);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Password));
    }

    [Fact]
    public async Task RegisterValidator_AcceptsValidRequest()
    {
        var req = new RegisterRequest
        {
            DisplayName = "Alex Morgan",
            Email = "alex@example.com",
            Password = "Password123"
        };

        var result = await _registerValidator.ValidateAsync(req);

        Assert.True(result.IsValid);
    }
}

