namespace Dayform.Application.Common;

public abstract class AppException : Exception
{
    public int StatusCode { get; }
    public string ErrorCode { get; }
    public IDictionary<string, string[]>? Errors { get; }

    protected AppException(string message, int statusCode, string errorCode, IDictionary<string, string[]>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
        Errors = errors;
    }
}

public sealed class BadRequestException : AppException
{
    public BadRequestException(string message, string errorCode = "bad_request")
        : base(message, 400, errorCode) { }
}

public sealed class ValidationAppException : AppException
{
    public ValidationAppException(IDictionary<string, string[]> errors, string message = "One or more validation errors occurred.")
        : base(message, 422, "validation_error", errors) { }
}

public sealed class UnauthorizedAppException : AppException
{
    public UnauthorizedAppException(string message = "Authentication is required.", string errorCode = "unauthorized")
        : base(message, 401, errorCode) { }
}

public sealed class ForbiddenAppException : AppException
{
    public ForbiddenAppException(string message = "You do not have permission to perform this action.", string errorCode = "forbidden")
        : base(message, 403, errorCode) { }
}

public sealed class NotFoundAppException : AppException
{
    public NotFoundAppException(string message = "The requested resource was not found.", string errorCode = "not_found")
        : base(message, 404, errorCode) { }
}

public sealed class ConflictAppException : AppException
{
    public ConflictAppException(string message, string errorCode = "conflict")
        : base(message, 409, errorCode) { }
}

