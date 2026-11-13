using Dayform.Application.Logic;

namespace Dayform.UnitTests;

public class HabitAnalyticsCalculatorTests
{
    [Fact]
    public void CalculateDailyCompletionPercent_HandlesEdgeCases()
    {
        Assert.Equal(0, HabitAnalyticsCalculator.CalculateDailyCompletionPercent(0, 0));
        Assert.Equal(0, HabitAnalyticsCalculator.CalculateDailyCompletionPercent(3, 0));
        Assert.Equal(50, HabitAnalyticsCalculator.CalculateDailyCompletionPercent(2, 4));
        Assert.Equal(100, HabitAnalyticsCalculator.CalculateDailyCompletionPercent(5, 4));
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(10, 1)]
    [InlineData(24.9, 1)]
    [InlineData(25, 2)]
    [InlineData(49.9, 2)]
    [InlineData(50, 3)]
    [InlineData(74.9, 3)]
    [InlineData(75, 4)]
    [InlineData(100, 4)]
    public void CalculateIntensityLevel_ReturnsExpectedBucket(double percent, int expected)
    {
        Assert.Equal(expected, HabitAnalyticsCalculator.CalculateIntensityLevel(percent));
    }

    [Fact]
    public void CalculateStreaks_WhenTodayIncomplete_PreservesYesterdayStreak()
    {
        var today = new DateOnly(2026, 11, 12);
        var data = new Dictionary<DateOnly, double>
        {
            [today.AddDays(-6)] = 80,
            [today.AddDays(-5)] = 60,
            [today.AddDays(-4)] = 20, // break
            [today.AddDays(-3)] = 50,
            [today.AddDays(-2)] = 75,
            [today.AddDays(-1)] = 100,
            [today] = 25 // today below 50%, should not break streak from yesterday
        };

        var (current, best) = HabitAnalyticsCalculator.CalculateStreaks(data, today);

        Assert.Equal(3, current);
        Assert.Equal(3, best);
    }

    [Fact]
    public void CalculateStreaks_TracksBestStreakSeparatelyFromCurrent()
    {
        var today = new DateOnly(2026, 11, 12);
        var data = new Dictionary<DateOnly, double>
        {
            [today.AddDays(-8)] = 100,
            [today.AddDays(-7)] = 100,
            [today.AddDays(-6)] = 100,
            [today.AddDays(-5)] = 100,
            [today.AddDays(-4)] = 0, // break
            [today.AddDays(-1)] = 60,
            [today] = 80
        };

        var (current, best) = HabitAnalyticsCalculator.CalculateStreaks(data, today);

        Assert.Equal(2, current);
        Assert.Equal(4, best);
    }

    [Fact]
    public void CalculateAverageCompletion_IncludesMissingDaysAsZero()
    {
        var from = new DateOnly(2026, 11, 1);
        var to = new DateOnly(2026, 11, 4);
        var data = new Dictionary<DateOnly, double>
        {
            [new DateOnly(2026, 11, 1)] = 100,
            [new DateOnly(2026, 11, 3)] = 60
        };

        var avg = HabitAnalyticsCalculator.CalculateAverageCompletion(data, from, to);

        Assert.Equal(40, avg); // (100 + 0 + 60 + 0) / 4
    }
}

