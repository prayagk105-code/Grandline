using Dayform.Domain.Entities;
using Dayform.Domain.Enums;

namespace Dayform.Application.Logic;

public static class ReminderRecurrenceCalculator
{
    public static IReadOnlyList<DateOnly> GetOccurrencesInRange(Reminder reminder, DateOnly from, DateOnly to)
    {
        if (!reminder.IsActive || to < from || reminder.ReminderDate > to)
            return Array.Empty<DateOnly>();

        var results = new List<DateOnly>();
        var start = reminder.ReminderDate;

        switch (reminder.RepeatFrequency)
        {
            case RepeatFrequency.Never:
                if (start >= from && start <= to)
                    results.Add(start);
                break;

            case RepeatFrequency.Daily:
                var dailyStart = start < from ? from : start;
                for (var d = dailyStart; d <= to; d = d.AddDays(1))
                    results.Add(d);
                break;

            case RepeatFrequency.Weekly:
                var cursorW = start;
                if (cursorW < from)
                {
                    var daysDiff = from.DayNumber - cursorW.DayNumber;
                    var weeksToSkip = daysDiff / 7;
                    cursorW = cursorW.AddDays(weeksToSkip * 7);
                    if (cursorW < from)
                        cursorW = cursorW.AddDays(7);
                }
                while (cursorW <= to)
                {
                    results.Add(cursorW);
                    cursorW = cursorW.AddDays(7);
                }
                break;

            case RepeatFrequency.Monthly:
                var monthIndex = 0;
                while (true)
                {
                    var occurrence = AddMonthsClamped(start, monthIndex);
                    if (occurrence > to) break;
                    if (occurrence >= from)
                        results.Add(occurrence);
                    monthIndex++;
                    if (monthIndex > 2400) break;
                }
                break;

            case RepeatFrequency.Yearly:
                var yearIndex = 0;
                while (true)
                {
                    var occurrence = AddYearsClamped(start, yearIndex);
                    if (occurrence > to) break;
                    if (occurrence >= from)
                        results.Add(occurrence);
                    yearIndex++;
                    if (yearIndex > 200) break;
                }
                break;
        }

        return results;
    }

    private static DateOnly AddMonthsClamped(DateOnly anchor, int monthsToAdd)
    {
        var totalMonths = (anchor.Year * 12 + (anchor.Month - 1)) + monthsToAdd;
        var targetYear = totalMonths / 12;
        var targetMonth = (totalMonths % 12) + 1;
        var maxDay = DateTime.DaysInMonth(targetYear, targetMonth);
        return new DateOnly(targetYear, targetMonth, Math.Min(anchor.Day, maxDay));
    }

    private static DateOnly AddYearsClamped(DateOnly anchor, int yearsToAdd)
    {
        var targetYear = anchor.Year + yearsToAdd;
        var maxDay = DateTime.DaysInMonth(targetYear, anchor.Month);
        return new DateOnly(targetYear, anchor.Month, Math.Min(anchor.Day, maxDay));
    }
}

