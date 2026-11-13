using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Dayform.Application.Common;
using Dayform.Application.DTOs.Auth;
using Dayform.Application.DTOs.Dashboard;
using Dayform.Application.DTOs.Habits;
using Dayform.Application.DTOs.Journal;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.DTOs.Planner;
using Dayform.Application.DTOs.Profile;
using Dayform.Application.DTOs.Progress;
using Dayform.Application.DTOs.Study;
using Dayform.Domain.Enums;

namespace Dayform.IntegrationTests;

public class EndToEndWorkflowTests : IClassFixture<DayformWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly DayformWebApplicationFactory _factory;

    public EndToEndWorkflowTests(DayformWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task FullTrackerWorkflow_PersistsAcrossEndpoints_AndUploadsMemoryImage()
    {
        using var client = _factory.CreateClient();

        var reg = await client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            DisplayName = "Maya Lin",
            Email = $"maya-{Guid.NewGuid():N}@dayform.test",
            Password = "Password123!",
            TimeZoneId = "UTC"
        });
        Assert.Equal(HttpStatusCode.Created, reg.StatusCode);
        var auth = (await reg.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>(JsonOptions))!.Data!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayStr = today.ToString("yyyy-MM-dd");

        // 1. Create and check in a habit
        var habitRes = await client.PostAsJsonAsync("/api/v1/habits", new CreateHabitRequest
        {
            Name = "Deep Work Block",
            Category = "Focus",
            Target = "90 mins",
            Icon = "target"
        });
        Assert.Equal(HttpStatusCode.Created, habitRes.StatusCode);
        var habit = (await habitRes.Content.ReadFromJsonAsync<ApiResponse<HabitDto>>(JsonOptions))!.Data!;

        var logRes = await client.PutAsJsonAsync($"/api/v1/habits/{habit.Id}/logs/{todayStr}", new ToggleHabitLogRequest
        {
            IsCompleted = true
        });
        Assert.Equal(HttpStatusCode.OK, logRes.StatusCode);

        // 2. Create a learning path & idempotent study session
        var pathRes = await client.PostAsJsonAsync("/api/v1/learning-paths", new CreateLearningPathRequest
        {
            Name = "Distributed Systems",
            Description = "Consensus & replication",
            Icon = "cpu",
            TargetMinutes = 600
        });
        Assert.Equal(HttpStatusCode.Created, pathRes.StatusCode);
        var path = (await pathRes.Content.ReadFromJsonAsync<ApiResponse<LearningPathDto>>(JsonOptions))!.Data!;

        var sessionReq = new CreateStudySessionRequest
        {
            LearningPathId = path.Id,
            Topic = "Raft Consensus",
            Minutes = 45,
            SessionDate = today,
            ClientSessionKey = "timer-key-1"
        };
        var s1 = await client.PostAsJsonAsync("/api/v1/study-sessions", sessionReq);
        var s2 = await client.PostAsJsonAsync("/api/v1/study-sessions", sessionReq);
        Assert.Equal(HttpStatusCode.Created, s1.StatusCode);
        var s1Dto = (await s1.Content.ReadFromJsonAsync<ApiResponse<StudySessionDto>>(JsonOptions))!.Data!;
        var s2Dto = (await s2.Content.ReadFromJsonAsync<ApiResponse<StudySessionDto>>(JsonOptions))!.Data!;
        Assert.Equal(s1Dto.Id, s2Dto.Id);

        // 3. Create memory and upload valid PNG bytes
        var memRes = await client.PostAsJsonAsync("/api/v1/memories", new CreateMemoryRequest
        {
            Title = "Architecture Diagram",
            MemoryDate = today,
            Category = MemoryCategory.Milestone,
            Note = "Sketched full event loop"
        });
        Assert.Equal(HttpStatusCode.Created, memRes.StatusCode);
        var memory = (await memRes.Content.ReadFromJsonAsync<ApiResponse<MemoryDto>>(JsonOptions))!.Data!;

        var pngBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
        using var form = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(pngBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(fileContent, "file", "diagram.png");

        var uploadRes = await client.PostAsync($"/api/v1/memories/{memory.Id}/image", form);
        Assert.Equal(HttpStatusCode.OK, uploadRes.StatusCode);
        var memoryWithImage = (await uploadRes.Content.ReadFromJsonAsync<ApiResponse<MemoryDto>>(JsonOptions))!.Data!;
        Assert.NotNull(memoryWithImage.Image);
        Assert.Contains("https://res.cloudinary.com/", memoryWithImage.Image!.SecureUrl);

        // Delete memory cleans up Cloudinary asset
        var delMemRes = await client.DeleteAsync($"/api/v1/memories/{memory.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delMemRes.StatusCode);
        Assert.Contains(memoryWithImage.Image.PublicId, _factory.FakeImageStorage.DeletedPublicIds);

        // 4. Create reminder & journal entry
        var remRes = await client.PostAsJsonAsync("/api/v1/reminders", new CreateReminderRequest
        {
            Title = "Weekly Review",
            ReminderDate = today,
            ReminderTime = new TimeOnly(18, 0),
            RepeatFrequency = RepeatFrequency.Weekly
        });
        Assert.Equal(HttpStatusCode.Created, remRes.StatusCode);

        var journalRes = await client.PutAsJsonAsync($"/api/v1/journals/{todayStr}", new UpsertJournalRequest
        {
            Accomplishments = "Finished Raft chapter",
            Distractions = "Checking Slack too often",
            Improvements = "Silence notifications until noon"
        });
        Assert.Equal(HttpStatusCode.OK, journalRes.StatusCode);

        // 5. Verify dashboard, progress summary, and JSON export reflect persisted state
        var dashboard = (await client.GetFromJsonAsync<ApiResponse<DashboardSummaryDto>>($"/api/v1/dashboard/summary?date={todayStr}", JsonOptions))!.Data!;
        Assert.Equal(1, dashboard.CompletedHabitsToday);
        Assert.Equal(1, dashboard.TotalActiveHabits);
        Assert.Equal(45, dashboard.FocusMinutesLast7Days);

        var progress = (await client.GetFromJsonAsync<ApiResponse<ProgressSummaryDto>>($"/api/v1/progress/summary?from={todayStr}&to={todayStr}", JsonOptions))!.Data!;
        Assert.Equal(45, progress.StudyMinutes);
        Assert.Equal(100, progress.HabitAveragePercent);

        var export = (await client.GetFromJsonAsync<ApiResponse<UserExportDto>>("/api/v1/profile/export", JsonOptions))!.Data!;
        Assert.Single(export.Habits);
        Assert.Single(export.StudySessions);
        Assert.Single(export.JournalEntries);
        Assert.Single(export.Reminders);
    }
}
