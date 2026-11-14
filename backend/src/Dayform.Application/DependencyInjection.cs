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

        // Grandline Expansion Services
        services.AddScoped<IGoalService, GoalsService>();
        services.AddScoped<ITaskService, TasksService>();
        services.AddScoped<IPersonalDevelopmentService, PersonalDevelopmentService>();
        services.AddScoped<IFocusService, FocusService>();
        services.AddScoped<IHealthService, HealthService>();
        services.AddScoped<IKnowledgeService, KnowledgeService>();
        services.AddScoped<IFinanceService, FinanceService>();
        services.AddScoped<IGamificationService, GamificationService>();
        services.AddScoped<ISpecialGrandlineService, SpecialGrandlineService>();

        return services;
    }
}
