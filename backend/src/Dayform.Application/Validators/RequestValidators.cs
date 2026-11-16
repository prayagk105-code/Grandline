using Dayform.Application.DTOs.Auth;
using Dayform.Application.DTOs.Habits;
using Dayform.Application.DTOs.Journal;
using Dayform.Application.DTOs.Memories;
using Dayform.Application.DTOs.Planner;
using Dayform.Application.DTOs.Profile;
using Dayform.Application.DTOs.Study;
using FluentValidation;

namespace Dayform.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.DisplayName).MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128)
            .Matches("[A-Za-z]").WithMessage("Password must contain at least one letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128)
            .Matches("[A-Za-z]").WithMessage("Password must contain at least one letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");
    }
}

public class SendOtpRequestValidator : AbstractValidator<SendOtpRequest>
{
    public SendOtpRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.DisplayName).MaximumLength(100);
    }
}

public class VerifyOtpAndRegisterRequestValidator : AbstractValidator<VerifyOtpAndRegisterRequest>
{
    public VerifyOtpAndRegisterRequestValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128)
            .Matches("[A-Za-z]").WithMessage("Password must contain at least one letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");
        RuleFor(x => x.Otp)
            .NotEmpty()
            .Length(6)
            .Matches("^[0-9]{6}$").WithMessage("Verification code must be a 6-digit number.");
    }
}


public class CreateHabitRequestValidator : AbstractValidator<CreateHabitRequest>
{
    public CreateHabitRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Category).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Target).MaximumLength(160);
        RuleFor(x => x.Icon).NotEmpty().MaximumLength(40);
        RuleFor(x => x.Color).MaximumLength(32);
    }
}

public class UpdateHabitRequestValidator : AbstractValidator<UpdateHabitRequest>
{
    public UpdateHabitRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Category).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Target).MaximumLength(160);
        RuleFor(x => x.Icon).NotEmpty().MaximumLength(40);
        RuleFor(x => x.Color).MaximumLength(32);
    }
}

public class CreateLearningPathRequestValidator : AbstractValidator<CreateLearningPathRequest>
{
    public CreateLearningPathRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(140);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Icon).NotEmpty().MaximumLength(40);
        RuleFor(x => x.Progress).InclusiveBetween(0, 100);
        RuleFor(x => x.TargetMinutes).GreaterThan(0).When(x => x.TargetMinutes.HasValue);
    }
}

public class UpdateLearningPathRequestValidator : AbstractValidator<UpdateLearningPathRequest>
{
    public UpdateLearningPathRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(140);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Icon).NotEmpty().MaximumLength(40);
        RuleFor(x => x.Progress).InclusiveBetween(0, 100);
        RuleFor(x => x.TargetMinutes).GreaterThan(0).When(x => x.TargetMinutes.HasValue);
    }
}

public class CreateStudySessionRequestValidator : AbstractValidator<CreateStudySessionRequest>
{
    public CreateStudySessionRequestValidator()
    {
        RuleFor(x => x.Topic).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Minutes).InclusiveBetween(1, 1440);
        RuleFor(x => x.Notes).MaximumLength(1000);
        RuleFor(x => x.ClientSessionKey).MaximumLength(100);
    }
}

public class UpdateStudySessionRequestValidator : AbstractValidator<UpdateStudySessionRequest>
{
    public UpdateStudySessionRequestValidator()
    {
        RuleFor(x => x.Topic).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Minutes).InclusiveBetween(1, 1440);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}

public class CreateMemoryRequestValidator : AbstractValidator<CreateMemoryRequest>
{
    public CreateMemoryRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Note).MaximumLength(2000);
        RuleFor(x => x.Icon).MaximumLength(40);
    }
}

public class UpdateMemoryRequestValidator : AbstractValidator<UpdateMemoryRequest>
{
    public UpdateMemoryRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Note).MaximumLength(2000);
        RuleFor(x => x.Icon).MaximumLength(40);
    }
}

public class CreateReminderRequestValidator : AbstractValidator<CreateReminderRequest>
{
    public CreateReminderRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
    }
}

public class UpdateReminderRequestValidator : AbstractValidator<UpdateReminderRequest>
{
    public UpdateReminderRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
    }
}

public class UpsertJournalRequestValidator : AbstractValidator<UpsertJournalRequest>
{
    public UpsertJournalRequestValidator()
    {
        RuleFor(x => x.Accomplishments).MaximumLength(4000);
        RuleFor(x => x.Distractions).MaximumLength(4000);
        RuleFor(x => x.Improvements).MaximumLength(4000);
    }
}

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.TimeZoneId).NotEmpty().MaximumLength(100);
    }
}

