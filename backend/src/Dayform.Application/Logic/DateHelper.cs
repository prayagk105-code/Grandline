namespace Dayform.Application.Logic;

public static class DateHelper
{
    public static DateOnly ResolveUserToday(string? timeZoneId, DateOnly? clientDate = null)
    {
        var utcToday = DateOnly.FromDateTime(DateTime.UtcNow);

        if (clientDate.HasValue && Math.Abs(clientDate.Value.DayNumber - utcToday.DayNumber) <= 1)
            return clientDate.Value;

        if (!string.IsNullOrWhiteSpace(timeZoneId))
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
                var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
                return DateOnly.FromDateTime(local);
            }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }

        return utcToday;
    }
}

