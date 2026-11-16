using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Dayform.Application.Common;
using Dayform.Application.DTOs.Auth;
using Dayform.Application.DTOs.Dashboard;
using Dayform.Application.DTOs.Finance;
using Dayform.Application.DTOs.Goals;
using Dayform.Application.DTOs.Habits;
using Dayform.Application.DTOs.Health;
using Dayform.Application.DTOs.Journal;
using Dayform.Application.DTOs.Study;
using Dayform.Application.DTOs.Tasks;
using Xunit;

namespace Dayform.IntegrationTests;

public class MultiUserFullApplicationTests : IClassFixture<DayformWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly DayformWebApplicationFactory _factory;

    public MultiUserFullApplicationTests(DayformWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Complete_Authentication_And_MultiUser_Isolation_Flow()
    {
        using var clientA = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions { HandleCookies = true });
        using var clientB = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions { HandleCookies = true });

        var emailA = $"userA-{Guid.NewGuid():N}@grandline.test";
        var emailB = $"userB-{Guid.NewGuid():N}@grandline.test";
        var password = "SecurePassword123!";

        // 1. Validation tests
        // Weak password
        var weakRes = await clientA.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = "weak@grandline.test",
            Password = "weak"
        });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, weakRes.StatusCode);

        // Invalid email
        var invalidEmailRes = await clientA.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = "not-an-email",
            Password = password
        });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalidEmailRes.StatusCode);

        // 2. Successful Registration for User A
        var regARes = await clientA.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = emailA,
            Password = password
        });
        Assert.Equal(HttpStatusCode.Created, regARes.StatusCode);

        // Duplicate email check
        var dupRes = await clientA.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = emailA,
            Password = password
        });
        Assert.Equal(HttpStatusCode.Conflict, dupRes.StatusCode);

        // 3. Login with invalid credentials
        var badLogin = await clientA.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            Email = emailA,
            Password = "WrongPassword!"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, badLogin.StatusCode);

        // 4. Login with valid credentials for User A
        var loginARes = await clientA.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            Email = emailA,
            Password = password
        });
        Assert.Equal(HttpStatusCode.OK, loginARes.StatusCode);
        var authA = (await loginARes.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>(JsonOptions))!.Data!;
        Assert.NotNull(authA.AccessToken);
        Assert.Equal(emailA, authA.User.Email);
        clientA.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authA.AccessToken);

        // 5. Verify /auth/me
        var meARes = await clientA.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, meARes.StatusCode);
        var meA = (await meARes.Content.ReadFromJsonAsync<ApiResponse<UserDto>>(JsonOptions))!.Data!;
        Assert.Equal(emailA, meA.Email);

        // 6. Verify New User Starts with Clean State (0 habits, 0 tasks, 0 goals, etc.)
        var habitsInitA = await clientA.GetFromJsonAsync<ApiResponse<List<HabitDto>>>("/api/v1/habits", JsonOptions);
        Assert.Empty(habitsInitA!.Data!);

        var tasksInitA = await clientA.GetFromJsonAsync<ApiResponse<List<TaskDto>>>("/api/v1/tasks", JsonOptions);
        Assert.Empty(tasksInitA!.Data!);

        var goalsInitA = await clientA.GetFromJsonAsync<ApiResponse<List<GoalDto>>>("/api/v1/goals", JsonOptions);
        Assert.Empty(goalsInitA!.Data!);

        // 7. Register & Login User B
        var regBRes = await clientB.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Email = emailB,
            Password = password
        });
        Assert.Equal(HttpStatusCode.Created, regBRes.StatusCode);

        var loginBRes = await clientB.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            Email = emailB,
            Password = password
        });
        Assert.Equal(HttpStatusCode.OK, loginBRes.StatusCode);
        var authB = (await loginBRes.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>(JsonOptions))!.Data!;
        clientB.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authB.AccessToken);

        // 8. User A creates records across modules
        // Habit
        var createHabitRes = await clientA.PostAsJsonAsync("/api/v1/habits", new CreateHabitRequest
        {
            Name = "Morning Exercise",
            Category = "Health",
            Icon = "heart"
        });
        Assert.Equal(HttpStatusCode.Created, createHabitRes.StatusCode);
        var habitA = (await createHabitRes.Content.ReadFromJsonAsync<ApiResponse<HabitDto>>(JsonOptions))!.Data!;

        // Goal
        var createGoalRes = await clientA.PostAsJsonAsync("/api/v1/goals", new CreateGoalRequest(
            "Run 10km Marathon",
            "Fitness goal description",
            "Fitness",
            "Monthly",
            DateOnly.FromDateTime(DateTime.UtcNow),
            DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(1)),
            null,
            null,
            null
        ));
        Assert.Equal(HttpStatusCode.Created, createGoalRes.StatusCode);
        var goalA = (await createGoalRes.Content.ReadFromJsonAsync<ApiResponse<GoalDto>>(JsonOptions))!.Data!;

        // Planner Task
        var createTaskRes = await clientA.PostAsJsonAsync("/api/v1/tasks", new CreateTaskRequest(
            "Review system architecture",
            "Check all endpoints",
            "High",
            DateOnly.FromDateTime(DateTime.UtcNow),
            "18:00",
            true,
            "None",
            null,
            null
        ));
        Assert.Equal(HttpStatusCode.Created, createTaskRes.StatusCode);
        var taskA = (await createTaskRes.Content.ReadFromJsonAsync<ApiResponse<TaskDto>>(JsonOptions))!.Data!;

        // Study Session
        var createStudyRes = await clientA.PostAsJsonAsync("/api/v1/study-sessions", new CreateStudySessionRequest
        {
            Topic = "PostgreSQL Index Optimization",
            Minutes = 45,
            SessionDate = DateOnly.FromDateTime(DateTime.UtcNow)
        });
        Assert.Equal(HttpStatusCode.Created, createStudyRes.StatusCode);

        // Journal Entry
        var createJournalRes = await clientA.PutAsJsonAsync($"/api/v1/journals/{DateOnly.FromDateTime(DateTime.UtcNow):yyyy-MM-dd}", new UpsertJournalRequest
        {
            Accomplishments = "Architected database integration",
            Distractions = "None",
            Improvements = "Sleep earlier"
        });
        Assert.Equal(HttpStatusCode.OK, createJournalRes.StatusCode);

        // Health Daily Log
        var createHealthRes = await clientA.PostAsJsonAsync("/api/v1/health-logs/daily", new UpsertHealthDailyLogRequest(
            DateOnly.FromDateTime(DateTime.UtcNow),
            8.0m,
            "23:00",
            "07:00",
            5,
            2500,
            70.0m,
            8500,
            5.5m,
            null,
            "Feeling great"
        ));
        Assert.Equal(HttpStatusCode.OK, createHealthRes.StatusCode);

        // Finance Transaction
        var createTxRes = await clientA.PostAsJsonAsync("/api/v1/finance/transactions", new CreateTransactionRequest(
            DateOnly.FromDateTime(DateTime.UtcNow),
            "Expense",
            45.50m,
            "Food",
            "Grocery shopping",
            "Card"
        ));
        Assert.Equal(HttpStatusCode.OK, createTxRes.StatusCode);

        // 9. VERIFY USER B CANNOT SEE USER A'S DATA (STRICT ISOLATION)
        var habitsB = await clientB.GetFromJsonAsync<ApiResponse<List<HabitDto>>>("/api/v1/habits", JsonOptions);
        Assert.Empty(habitsB!.Data!);

        var goalsB = await clientB.GetFromJsonAsync<ApiResponse<List<GoalDto>>>("/api/v1/goals", JsonOptions);
        Assert.Empty(goalsB!.Data!);

        var tasksB = await clientB.GetFromJsonAsync<ApiResponse<List<TaskDto>>>("/api/v1/tasks", JsonOptions);
        Assert.Empty(tasksB!.Data!);

        // User B cannot access User A's specific record by ID
        var getHabitB = await clientB.GetAsync($"/api/v1/habits/{habitA.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getHabitB.StatusCode);

        var getGoalB = await clientB.GetAsync($"/api/v1/goals/{goalA.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getGoalB.StatusCode);

        var getTaskB = await clientB.GetAsync($"/api/v1/tasks/{taskA.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getTaskB.StatusCode);

        // User B cannot delete User A's records
        var deleteHabitB = await clientB.DeleteAsync($"/api/v1/habits/{habitA.Id}");
        Assert.Equal(HttpStatusCode.NotFound, deleteHabitB.StatusCode);

        var deleteGoalB = await clientB.DeleteAsync($"/api/v1/goals/{goalA.Id}");
        Assert.Equal(HttpStatusCode.NotFound, deleteGoalB.StatusCode);

        // 10. VERIFY USER A'S DASHBOARD INTEGRATION CALCULATIONS
        var dashResA = await clientA.GetAsync($"/api/v1/dashboard/summary?date={DateOnly.FromDateTime(DateTime.UtcNow):yyyy-MM-dd}");
        Assert.Equal(HttpStatusCode.OK, dashResA.StatusCode);
        var dashA = (await dashResA.Content.ReadFromJsonAsync<ApiResponse<DashboardSummaryDto>>(JsonOptions))!.Data!;

        Assert.Equal(1, dashA.TotalActiveHabits);
        Assert.Equal(45, dashA.FocusMinutesLast7Days);
        Assert.NotNull(dashA.TodayHabits);
        Assert.Single(dashA.TodayHabits);
        Assert.Equal("Morning Exercise", dashA.TodayHabits[0].Name);

        // 11. USER B CREATES INDEPENDENT RECORDS
        var createHabitBRes = await clientB.PostAsJsonAsync("/api/v1/habits", new CreateHabitRequest
        {
            Name = "Read Tech Documentation",
            Category = "Learning",
            Icon = "book"
        });
        Assert.Equal(HttpStatusCode.Created, createHabitBRes.StatusCode);

        // Verify User A still only sees User A's records
        var habitsA = await clientA.GetFromJsonAsync<ApiResponse<List<HabitDto>>>("/api/v1/habits", JsonOptions);
        Assert.Single(habitsA!.Data!);
        Assert.Equal("Morning Exercise", habitsA.Data![0].Name);

        // Verify User B only sees User B's records
        var habitsBUpdated = await clientB.GetFromJsonAsync<ApiResponse<List<HabitDto>>>("/api/v1/habits", JsonOptions);
        Assert.Single(habitsBUpdated!.Data!);
        Assert.Equal("Read Tech Documentation", habitsBUpdated.Data![0].Name);
    }
}
