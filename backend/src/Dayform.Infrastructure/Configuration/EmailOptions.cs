namespace Dayform.Infrastructure.Configuration;

public class EmailOptions
{
    public const string SectionName = "Email";
    public string SenderEmail { get; set; } = "prayagk806@gmail.com";
    public string? AppPassword { get; set; }
}

