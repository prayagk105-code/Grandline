using Dayform.Application.Interfaces;
using Dayform.Application.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Dayform.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IHabitService, HabitService>();
        services.AddScoped<IStudyService, StudyService>();
        services.AddScoped<IMemoryService, MemoryService>();
        services.AddScoped<IPlannerService, PlannerService>();
        services.AddScoped<IJournalService, JournalService>();
        services.AddScoped<IProgressService, ProgressService>();
        services.AddScoped<IProfileService, ProfileService>();

        return services;
    }
}

