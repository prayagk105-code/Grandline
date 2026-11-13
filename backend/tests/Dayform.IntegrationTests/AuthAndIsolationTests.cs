using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Dayform.Application.Common;
using Dayform.Application.DTOs.Auth;
using Dayform.Application.DTOs.Habits;
using Dayform.Application.DTOs.Journal;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.DTOs.Planner;
using Dayform.Application.DTOs.Study;
using Dayform.Domain.Enums;

namespace Dayform.IntegrationTests;

public class AuthAndIsolationTests : IClassFixture<DayformWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly DayformWebApplicationFactory _factory;

    public AuthAndIsolationTests(DayformWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Unauthenticated_ProtectedRoutes_ReturnUnauthorized()
    {
        using var client = _factory.CreateClient();

        var habits = await client.GetAsync("/api/v1/habits");
        var dashboard = await client.GetAsync("/api/v1/dashboard/summary");
        var profile = await client.GetAsync("/api/v1/profile");

        Assert.Equal(HttpStatusCode.Unauthorized, habits.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, dashboard.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, profile.StatusCode);
    }

    [Fact]
    public async Task Register_Login_Refresh_Logout_And_UserIsolation_AreEnforced()
    {
        using var clientA = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });
        using var clientB = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        var emailA = $"alice-{Guid.NewGuid():N}@dayform.test";
        var emailB = $"bob-{Guid.NewGuid():N}@dayform.test";

        var regA = await clientA.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            DisplayName = "Alice",
            Email = emailA,
            Password = "Password123!",
            TimeZoneId = "UTC"
        });
        Assert.Equal(HttpStatusCode.Created, regA.StatusCode);
        var authA = await regA.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>(JsonOptions);
        Assert.NotNull(authA?.Data);
        clientA.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authA!.Data!.AccessToken);

        var regB = await clientB.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            DisplayName = "Bob",
            Email = emailB,
            Password = "Password123!",
            TimeZoneId = "UTC"
        });
        Assert.Equal(HttpStatusCode.Created, regB.StatusCode);
        var authB = await regB.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>(JsonOptions);
        Assert.NotNull(authB?.Data);
        clientB.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authB!.Data!.AccessToken);

        // User A creates private records
        var habitRes = await clientA.PostAsJsonAsync("/api/v1/habits", new CreateHabitRequest
        {
            Name = "Alice Private Habit",
            Category = "Health",
            Icon = "heart"
        });
        Assert.Equal(HttpStatusCode.Created, habitRes.StatusCode);
        var habitId = (await habitRes.Content.ReadFromJsonAsync<ApiResponse<HabitDto>>(JsonOptions))!.Data!.Id;

        var sessionRes = await clientA.PostAsJsonAsync("/api/v1/study-sessions", new CreateStudySessionRequest
        {
            Topic = "Alice Private Study",
            Minutes = 30,
            SessionDate = DateOnly.FromDateTime(DateTime.UtcNow)
        });
        Assert.Equal(HttpStatusCode.Created, sessionRes.StatusCode);
        var sessionId = (await sessionRes.Content.ReadFromJsonAsync<ApiResponse<StudySessionDto>>(JsonOptions))!.Data!.Id;

        var memoryRes = await clientA.PostAsJsonAsync("/api/v1/memories", new CreateMemoryRequest
        {
            Title = "Alice Private Memory",
            MemoryDate = DateOnly.FromDateTime(DateTime.UtcNow),
            Category = MemoryCategory.Everyday,
            Note = "Secret note"
        });
        Assert.Equal(HttpStatusCode.Created, memoryRes.StatusCode);
        var memoryId = (await memoryRes.Content.ReadFromJsonAsync<ApiResponse<MemoryDto>>(JsonOptions))!.Data!.Id;

        var reminderRes = await clientA.PostAsJsonAsync("/api/v1/reminders", new CreateReminderRequest
        {
            Title = "Alice Private Reminder",
            ReminderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            RepeatFrequency = RepeatFrequency.Never
        });
        Assert.Equal(HttpStatusCode.Created, reminderRes.StatusCode);
        var reminderId = (await reminderRes.Content.ReadFromJsonAsync<ApiResponse<ReminderDto>>(JsonOptions))!.Data!.Id;

        var todayStr = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var journalRes = await clientA.PutAsJsonAsync($"/api/v1/journals/{todayStr}", new UpsertJournalRequest
        {
            Accomplishments = "Alice private win"
        });
        Assert.Equal(HttpStatusCode.OK, journalRes.StatusCode);

        // User B cannot read or delete any of User A's records
        Assert.Equal(HttpStatusCode.NotFound, (await clientB.GetAsync($"/api/v1/habits/{habitId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await clientB.DeleteAsync($"/api/v1/habits/{habitId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await clientB.GetAsync($"/api/v1/study-sessions/{sessionId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await clientB.DeleteAsync($"/api/v1/study-sessions/{sessionId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await clientB.GetAsync($"/api/v1/memories/{memoryId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await clientB.DeleteAsync($"/api/v1/memories/{memoryId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await clientB.GetAsync($"/api/v1/reminders/{reminderId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await clientB.DeleteAsync($"/api/v1/reminders/{reminderId}")).StatusCode);

        var bobJournalRes = await clientB.GetFromJsonAsync<ApiResponse<JournalEntryDto?>>($"/api/v1/journals/{todayStr}", JsonOptions);
        Assert.Null(bobJournalRes?.Data);

        // Refresh cookie works for User A
        var refreshRes = await clientA.PostAsync("/api/v1/auth/refresh", null);
        Assert.Equal(HttpStatusCode.OK, refreshRes.StatusCode);

        // Logout invalidates refresh session
        var logoutRes = await clientA.PostAsync("/api/v1/auth/logout", null);
        Assert.Equal(HttpStatusCode.NoContent, logoutRes.StatusCode);

        var refreshAfterLogout = await clientA.PostAsync("/api/v1/auth/refresh", null);
        Assert.Equal(HttpStatusCode.Unauthorized, refreshAfterLogout.StatusCode);
    }

    [Fact]
    public async Task SendOtp_And_VerifyOtpAndRegister_CreatesAccount_AndIssuesTokens()
    {
        using var client = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true
        });

        var testEmail = $"otp_test_{Guid.NewGuid():N}@example.com";

        // Step 1: Send OTP
        var sendOtpRes = await client.PostAsJsonAsync("/api/v1/auth/send-otp", new SendOtpRequest
        {
            Email = testEmail,
            DisplayName = "Test User"
        });
        Assert.Equal(HttpStatusCode.OK, sendOtpRes.StatusCode);

        var sendOtpData = await sendOtpRes.Content.ReadFromJsonAsync<ApiResponse<SendOtpResponse>>(JsonOptions);
        Assert.NotNull(sendOtpData?.Data);
        var otp = sendOtpData!.Data!.DevelopmentOtp;
        Assert.False(string.IsNullOrWhiteSpace(otp));

        // Step 2: Test wrong OTP returns 400
        var wrongOtpRes = await client.PostAsJsonAsync("/api/v1/auth/verify-otp-and-register", new VerifyOtpAndRegisterRequest
        {
            DisplayName = "Test User",
            Email = testEmail,
            Password = "SecurePassword123!",
            Otp = "000000"
        });
        Assert.Equal(HttpStatusCode.BadRequest, wrongOtpRes.StatusCode);

        // Step 3: Test valid OTP completes registration and issues session
        var verifyRes = await client.PostAsJsonAsync("/api/v1/auth/verify-otp-and-register", new VerifyOtpAndRegisterRequest
        {
            DisplayName = "Test User",
            Email = testEmail,
            Password = "SecurePassword123!",
            Otp = otp!
        });
        Assert.Equal(HttpStatusCode.Created, verifyRes.StatusCode);

        var auth = await verifyRes.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>(JsonOptions);
        Assert.NotNull(auth?.Data?.AccessToken);
        Assert.Equal(testEmail, auth!.Data!.User.Email);

        // Step 4: Access protected route with issued token
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Data.AccessToken);
        var meRes = await client.GetAsync("/api/v1/auth/me");
        Assert.Equal(HttpStatusCode.OK, meRes.StatusCode);

        // Step 5: Sending OTP to same email again conflicts
        var duplicateOtpRes = await client.PostAsJsonAsync("/api/v1/auth/send-otp", new SendOtpRequest
        {
            Email = testEmail,
            DisplayName = "Test User"
        });
        Assert.Equal(HttpStatusCode.Conflict, duplicateOtpRes.StatusCode);
    }
}
