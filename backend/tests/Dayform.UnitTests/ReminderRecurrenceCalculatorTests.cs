using Dayform.Application.Logic;
using Dayform.Domain.Entities;
using Dayform.Domain.Enums;

namespace Dayform.UnitTests;

public class ReminderRecurrenceCalculatorTests
{
    [Fact]
    public void WeeklyReminder_GeneratesExactWeeklyOccurrencesInRange()
    {
        var reminder = new Reminder
        {
            Title = "Weekly reset",
            ReminderDate = new DateOnly(2026, 10, 1),
            RepeatFrequency = RepeatFrequency.Weekly,
            IsActive = true
        };

        var dates = ReminderRecurrenceCalculator.GetOccurrencesInRange(
            reminder,
            new DateOnly(2026, 10, 10),
            new DateOnly(2026, 10, 31));

        Assert.Equal(new[]
        {
            new DateOnly(2026, 10, 15),
            new DateOnly(2026, 10, 22),
            new DateOnly(2026, 10, 29)
        }, dates);
    }

    [Fact]
    public void MonthlyReminder_On31st_ClampsToMonthEnd()
    {
        var reminder = new Reminder
        {
            Title = "Month-end review",
            ReminderDate = new DateOnly(2026, 1, 31),
            RepeatFrequency = RepeatFrequency.Monthly,
            IsActive = true
        };

        var dates = ReminderRecurrenceCalculator.GetOccurrencesInRange(
            reminder,
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 4, 30));

        Assert.Equal(new[]
        {
            new DateOnly(2026, 1, 31),
            new DateOnly(2026, 2, 28),
            new DateOnly(2026, 3, 31),
            new DateOnly(2026, 4, 30)
        }, dates);
    }

    [Fact]
    public void YearlyReminder_OnLeapDay_ClampsInNonLeapYears()
    {
        var reminder = new Reminder
        {
            Title = "Leap day check",
            ReminderDate = new DateOnly(2024, 2, 29),
            RepeatFrequency = RepeatFrequency.Yearly,
            IsActive = true
        };

        var dates = ReminderRecurrenceCalculator.GetOccurrencesInRange(
            reminder,
            new DateOnly(2024, 1, 1),
            new DateOnly(2028, 12, 31));

        Assert.Equal(new[]
        {
            new DateOnly(2024, 2, 29),
            new DateOnly(2025, 2, 28),
            new DateOnly(2026, 2, 28),
            new DateOnly(2027, 2, 28),
            new DateOnly(2028, 2, 29)
        }, dates);
    }

    [Fact]
    public void InactiveReminder_ReturnsNoOccurrences()
    {
        var reminder = new Reminder
        {
            Title = "Inactive",
            ReminderDate = new DateOnly(2026, 11, 1),
            RepeatFrequency = RepeatFrequency.Daily,
            IsActive = false
        };

        var dates = ReminderRecurrenceCalculator.GetOccurrencesInRange(
            reminder,
            new DateOnly(2026, 11, 1),
            new DateOnly(2026, 11, 10));

        Assert.Empty(dates);
    }
}

