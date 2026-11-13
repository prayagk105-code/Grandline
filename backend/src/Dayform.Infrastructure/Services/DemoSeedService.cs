using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Dayform.Domain.Enums;
using Dayform.Infrastructure.Configuration;
using Dayform.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Dayform.Infrastructure.Services;

public class DemoSeedService : IDemoSeedService
{
    private readonly DayformDbContext _db;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly DemoOptions _demoOptions;
    private readonly ILogger<DemoSeedService> _logger;

    public DemoSeedService(
        DayformDbContext db,
        IPasswordHasher<User> passwordHasher,
        IOptions<DemoOptions> demoOptions,
        ILogger<DemoSeedService> logger)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _demoOptions = demoOptions.Value;
        _logger = logger;
    }

    public async Task SeedDemoDataAsync(bool resetExisting = false, CancellationToken ct = default)
    {
        var normalizedEmail = _demoOptions.Email.Trim().ToUpperInvariant();
        var existingUser = await _db.Users
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail, ct);

        if (existingUser is not null)
        {
            if (!existingUser.IsDemoUser)
                throw new InvalidOperationException("Configured demo email belongs to a non-demo user.");

            if (!resetExisting)
            {
                var hasHabits = await _db.Habits.AnyAsync(h => h.UserId == existingUser.Id, ct);
                if (hasHabits)
                    return; // Idempotent: demo data already seeded
            }
            else
            {
                _db.Users.Remove(existingUser);
                await _db.SaveChangesAsync(ct);
                existingUser = null;
            }
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        const int totalDays = 150;
        var startDate = today.AddDays(-(totalDays - 1));

        var user = existingUser ?? new User
        {
            DisplayName = "Alex Morgan",
            Email = _demoOptions.Email.Trim(),
            NormalizedEmail = normalizedEmail,
            ThemePreference = ThemePreference.Auto,
            JourneyStartDate = today.AddDays(-83),
            TimeZoneId = "UTC",
            IsActive = true,
            IsDemoUser = true
        };

        if (existingUser is null)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, _demoOptions.Password);
            _db.Users.Add(user);
            await _db.SaveChangesAsync(ct);
        }

        // Fixed deterministic seed so repeated runs produce identical realistic patterns
        var rng = new Random(7);

        var habitSpecs = new (string Name, string Category, string Target, string Icon)[]
        {
            ("Wake up early", "Lifestyle", "Before 6:30 AM", "sun"),
            ("Morning walk", "Health", "20–30 minutes", "leaf"),
            ("Move your body", "Health", "15 minutes", "zap"),
            ("Mindful breathing", "Mind", "5 minutes", "wind"),
            ("Focused study", "Learning", "One deep-work session", "book"),
            ("Language practice", "Learning", "20 minutes", "pen"),
            ("Hydrate well", "Health", "2 liters of water", "drop"),
            ("Read before bed", "Lifestyle", "10 pages", "moon")
        };

        var habits = habitSpecs.Select((spec, idx) => new Habit
        {
            UserId = user.Id,
            Name = spec.Name,
            Category = spec.Category,
            Target = spec.Target,
            Icon = spec.Icon,
            IsActive = true,
            SortOrder = idx + 1
        }).ToList();

        _db.Habits.AddRange(habits);

        // Generate 150 days of realistic habit logs up to today (never future)
        var habitLogs = new List<HabitLog>();
        for (int i = 0; i < totalDays; i++)
        {
            var d = startDate.AddDays(i);
            var isToday = d == today;

            // Create realistic strong weeks, occasional dip weeks, and lower Sunday completion
            var wave = Math.Sin(i / 11.0) * 0.12;
            var baseProb = 0.48 + (0.34 * i / totalDays) + wave - (d.DayOfWeek == DayOfWeek.Sunday ? 0.14 : 0);

            for (int hIdx = 0; hIdx < habits.Count; hIdx++)
            {
                bool completed;
                if (isToday)
                {
                    // Leave some habits pending today for immediate interactive check-in
                    completed = hIdx is 0 or 1 or 4;
                }
                else
                {
                    var prob = baseProb - (hIdx > 5 ? 0.08 : 0);
                    completed = rng.NextDouble() < prob;
                }

                if (completed)
                {
                    habitLogs.Add(new HabitLog
                    {
                        UserId = user.Id,
                        HabitId = habits[hIdx].Id,
                        LogDate = d,
                        IsCompleted = true
                    });
                }
            }
        }
        _db.HabitLogs.AddRange(habitLogs);

        // 4 Learning Paths
        var pathSpecs = new (string Name, string Desc, string Icon, int Progress, int TargetMinutes)[]
        {
            ("Personal learning plan", "Subjects, chapters and topics of your own", "book", 68, 2400),
            ("Professional development", "Skills, architecture and practice sessions", "zap", 42, 1800),
            ("Language practice", "Vocabulary, speaking and writing drills", "pen", 55, 1200),
            ("Mindful reading", "Long-form essays and reflective notes", "leaf", 35, 900)
        };

        var paths = pathSpecs.Select(p => new LearningPath
        {
            UserId = user.Id,
            Name = p.Name,
            Description = p.Desc,
            Icon = p.Icon,
            Progress = p.Progress,
            TargetMinutes = p.TargetMinutes,
            IsArchived = false
        }).ToList();
        _db.LearningPaths.AddRange(paths);

        // Study sessions across the 150-day period (no future dates)
        var topics = new[]
        {
            "Reading notes", "Practice exercises", "Review and recap",
            "New lesson", "Problem solving", "Weekly revision",
            "Concept mapping", "Timed drills"
        };
        var durations = new[] { 25, 30, 40, 50, 60 };
        var studySessions = new List<StudySession>();

        for (int i = 0; i < totalDays; i++)
        {
            var d = startDate.AddDays(i);
            if (rng.NextDouble() < 0.58)
            {
                int count = rng.NextDouble() < 0.25 ? 2 : 1;
                for (int k = 0; k < count; k++)
                {
                    var path = paths[rng.Next(paths.Count)];
                    var mins = durations[rng.Next(durations.Length)];
                    studySessions.Add(new StudySession
                    {
                        UserId = user.Id,
                        LearningPathId = path.Id,
                        Topic = topics[rng.Next(topics.Length)],
                        Minutes = mins,
                        SessionDate = d,
                        Notes = "Demo study block"
                    });
                }
            }
        }
        _db.StudySessions.AddRange(studySessions);

        // 14 Memories across 5 months (no fake Cloudinary URLs; gradient + icon fallback)
        var memorySpecs = new (int DayOffset, string Title, MemoryCategory Cat, string Note, string Icon)[]
        {
            (8, "A slow morning by the coast", MemoryCategory.Travel, "Quiet walk, sea breeze, no rush.", "drop"),
            (19, "Golden hour walk", MemoryCategory.Everyday, "The evening light across the park felt calm.", "sun"),
            (31, "A little café break", MemoryCategory.Everyday, "Coffee, a notebook and unhurried thinking time.", "cup"),
            (44, "Green trails", MemoryCategory.Travel, "An afternoon surrounded by pine trees and quiet trails.", "leaf"),
            (56, "Finished the first phase", MemoryCategory.Milestone, "Closed a learning goal I had been working toward.", "star"),
            (68, "A city to explore", MemoryCategory.Travel, "New streets, architecture and fresh perspectives.", "pin"),
            (79, "Sunday with family", MemoryCategory.Everyday, "Long lunch and slow conversation.", "heart"),
            (91, "Hit a 14-day streak", MemoryCategory.Milestone, "Consistency is starting to feel natural.", "star"),
            (103, "Rainy evening reading", MemoryCategory.Everyday, "Warm tea, a novel and the sound of rain.", "book"),
            (114, "Hill sunrise", MemoryCategory.Travel, "Early start, worth every single minute.", "sun"),
            (124, "Deep focus breakthrough", MemoryCategory.Milestone, "Completed two full focus sessions without distraction.", "zap"),
            (133, "Evening bike ride", MemoryCategory.Everyday, "Cool breeze after a busy workday.", "wind"),
            (141, "Botanical garden sketch", MemoryCategory.Travel, "Spent an hour sketching leaves in a quiet greenhouse.", "leaf"),
            (146, "Quiet moonlit walk", MemoryCategory.Everyday, "Wrapped up the week with fresh air and gratitude.", "moon")
        };

        var memories = memorySpecs.Select((m, idx) => new Memory
        {
            UserId = user.Id,
            MemoryDate = startDate.AddDays(Math.Min(m.DayOffset, totalDays - 1)),
            Title = m.Title,
            Category = m.Cat,
            Note = m.Note,
            Icon = m.Icon,
            GradientIndex = idx % 6
        }).ToList();
        _db.Memories.AddRange(memories);

        // Journal entries (~3 per week across 150 days)
        var accomplishmentsPool = new[]
        {
            "Completed my morning focus block before checking messages.",
            "Stayed consistent with movement and outdoor walk.",
            "Finished summarizing two chapters into clean notes.",
            "Wrapped up the weekly review with clear priorities.",
            "Kept a calm pace and finished the core task early."
        };
        var distractionsPool = new[]
        {
            "Phone notifications during the mid-afternoon.",
            "Switching between too many browser tabs.",
            "Checking email before finishing deep work.",
            "Late evening scrolling before bed."
        };
        var improvementsPool = new[]
        {
            "Leave phone in another room during the first study block.",
            "Write tomorrow's top single priority before dinner.",
            "Take a 5-minute breathing pause after lunch.",
            "Start wind-down routine 30 minutes earlier."
        };

        var journals = new List<JournalEntry>();
        for (int i = 1; i < totalDays - 1; i++)
        {
            if (i % 3 == 0 || rng.NextDouble() < 0.22)
            {
                journals.Add(new JournalEntry
                {
                    UserId = user.Id,
                    EntryDate = startDate.AddDays(i),
                    Accomplishments = accomplishmentsPool[rng.Next(accomplishmentsPool.Length)],
                    Distractions = distractionsPool[rng.Next(distractionsPool.Length)],
                    Improvements = improvementsPool[rng.Next(improvementsPool.Length)]
                });
            }
        }
        _db.JournalEntries.AddRange(journals);

        // Historical + Upcoming Reminders across repeat frequencies
        var reminders = new List<Reminder>
        {
            new()
            {
                UserId = user.Id,
                Title = "Morning breathing check-in",
                ReminderDate = today.AddDays(-14),
                ReminderTime = new TimeOnly(7, 30),
                RepeatFrequency = RepeatFrequency.Daily,
                IsActive = true
            },
            new()
            {
                UserId = user.Id,
                Title = "Weekly reset & planning",
                ReminderDate = today.AddDays(2),
                ReminderTime = new TimeOnly(18, 0),
                RepeatFrequency = RepeatFrequency.Weekly,
                IsActive = true
            },
            new()
            {
                UserId = user.Id,
                Title = "Review monthly goals",
                ReminderDate = today.AddDays(5),
                ReminderTime = new TimeOnly(9, 0),
                RepeatFrequency = RepeatFrequency.Monthly,
                IsActive = true
            },
            new()
            {
                UserId = user.Id,
                Title = "Plan next month's study path",
                ReminderDate = today.AddDays(9),
                ReminderTime = new TimeOnly(20, 0),
                RepeatFrequency = RepeatFrequency.Never,
                IsActive = true
            },
            new()
            {
                UserId = user.Id,
                Title = "Annual reflection milestone",
                ReminderDate = today.AddDays(25),
                ReminderTime = new TimeOnly(10, 0),
                RepeatFrequency = RepeatFrequency.Yearly,
                IsActive = true
            }
        };
        _db.Reminders.AddRange(reminders);

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded 150 days of deterministic demo data for user {Email}", user.Email);
    }

    public async Task RemoveDemoDataAsync(CancellationToken ct = default)
    {
        var demoUsers = await _db.Users.Where(u => u.IsDemoUser).ToListAsync(ct);
        if (demoUsers.Count == 0)
            return;

        _db.Users.RemoveRange(demoUsers);
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Removed {Count} demo user account(s) and associated records", demoUsers.Count);
    }
}

