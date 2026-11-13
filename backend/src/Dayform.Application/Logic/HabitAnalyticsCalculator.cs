namespace Dayform.Application.Logic;

public static class HabitAnalyticsCalculator
{
    public const double StreakThresholdPercent = 50.0;

    public static double CalculateDailyCompletionPercent(int completedCount, int totalActiveHabits)
    {
        if (totalActiveHabits <= 0 || completedCount <= 0)
            return 0.0;

        var capped = Math.Min(completedCount, totalActiveHabits);
        return Math.Round(capped * 100.0 / totalActiveHabits, 2);
    }

    public static int CalculateIntensityLevel(double completionPercent)
    {
        if (completionPercent <= 0) return 0;
        if (completionPercent < 25) return 1;
        if (completionPercent < 50) return 2;
        if (completionPercent < 75) return 3;
        return 4;
    }

    public static (int CurrentStreak, int BestStreak) CalculateStreaks(
        IReadOnlyDictionary<DateOnly, double> dailyCompletionPercents,
        DateOnly today)
    {
        if (dailyCompletionPercents.Count == 0)
            return (0, 0);

        var earliest = dailyCompletionPercents.Keys.Min();
        if (earliest > today)
            return (0, 0);

        int running = 0;
        int best = 0;

        for (var d = earliest; d <= today; d = d.AddDays(1))
        {
            var pct = dailyCompletionPercents.TryGetValue(d, out var val) ? val : 0;
            if (pct >= StreakThresholdPercent)
            {
                running++;
                if (running > best)
                    best = running;
            }
            else if (d != today)
            {
                running = 0;
            }
        }

        int current = 0;
        var todayPct = dailyCompletionPercents.TryGetValue(today, out var tp) ? tp : 0;
        var cursor = todayPct >= StreakThresholdPercent ? today : today.AddDays(-1);

        while (cursor >= earliest && current < 3650)
        {
            var pct = dailyCompletionPercents.TryGetValue(cursor, out var val) ? val : 0;
            if (pct < StreakThresholdPercent)
                break;

            current++;
            cursor = cursor.AddDays(-1);
        }

        return (current, best);
    }

    public static double CalculateAverageCompletion(
        IReadOnlyDictionary<DateOnly, double> dailyCompletionPercents,
        DateOnly from,
        DateOnly to)
    {
        if (to < from)
            return 0.0;

        double total = 0;
        int days = 0;

        for (var d = from; d <= to; d = d.AddDays(1))
        {
            if (dailyCompletionPercents.TryGetValue(d, out var pct))
                total += pct;
            days++;
        }

        return days > 0 ? Math.Round(total / days, 2) : 0.0;
    }
}

