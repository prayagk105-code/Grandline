using System.Diagnostics;
using System.Text.Json;
using Dayform.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            _logger.LogWarning("Application exception ({ErrorCode}) on {Method} {Path}: {Message}",
                ex.ErrorCode, context.Request.Method, context.Request.Path, ex.Message);

            await WriteProblemAsync(context, ex.StatusCode, ex.Message, ex.ErrorCode, ex.Errors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);

            var message = _env.IsDevelopment()
                ? $"An unexpected server error occurred: {ex.Message}"
                : "An unexpected server error occurred. Please try again later.";

            await WriteProblemAsync(context, StatusCodes.Status500InternalServerError, message, "internal_error", null);
        }
    }

    private static async Task WriteProblemAsync(
        HttpContext context,
        int statusCode,
        string detail,
        string errorCode,
        IDictionary<string, string[]>? errors)
    {
        if (context.Response.HasStarted)
            return;

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = GetTitle(statusCode),
            Detail = detail,
            Instance = context.Request.Path
        };
        problem.Extensions["success"] = false;
        problem.Extensions["errorCode"] = errorCode;
        problem.Extensions["traceId"] = traceId;

        if (errors is not null && errors.Count > 0)
            problem.Extensions["errors"] = errors;

        var json = JsonSerializer.Serialize(problem, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        await context.Response.WriteAsync(json);
    }

    private static string GetTitle(int statusCode) => statusCode switch
    {
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        409 => "Conflict",
        422 => "Validation Failed",
        429 => "Too Many Requests",
        _ => "Internal Server Error"
    };
}

