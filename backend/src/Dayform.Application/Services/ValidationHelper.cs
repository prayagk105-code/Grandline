using Dayform.Application.Common;
using FluentValidation;

namespace Dayform.Application.Services;

internal static class ValidationHelper
{
    public static async Task ValidateAndThrowAsync<T>(IValidator<T> validator, T instance, CancellationToken ct)
    {
        var result = await validator.ValidateAsync(instance, ct);
        if (!result.IsValid)
        {
            var errors = result.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
            throw new ValidationAppException(errors);
        }
    }
}

