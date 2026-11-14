using Dayform.Domain.Common;

namespace Dayform.Domain.Entities;

public class FinancialTransaction : AuditableEntity
{
    public Guid UserId { get; set; }
    public DateOnly TransactionDate { get; set; }
    public string Type { get; set; } = "Expense"; // Income, Expense
    public decimal Amount { get; set; }
    public string Category { get; set; } = "Other"; // Salary, Freelance, Investment, Rent, Food, Utilities, Transport, Entertainment, Shopping, Health, Other
    public string Description { get; set; } = string.Empty;
    public string? PaymentMethod { get; set; }

    public User User { get; set; } = null!;
}

public class MonthlyBudget : AuditableEntity
{
    public Guid UserId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal BudgetAmount { get; set; }

    public User User { get; set; } = null!;
}

public class SavingsGoal : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; } = 0;
    public DateOnly? TargetDate { get; set; }
    public bool IsCompleted { get; set; } = false;

    public User User { get; set; } = null!;
}

public class DebtItem : AuditableEntity
{
    public Guid UserId { get; set; }
    public string CreditorName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public decimal? InterestRate { get; set; }
    public decimal? MinimumPayment { get; set; }
    public DateOnly? DueDate { get; set; }
    public string? Notes { get; set; }

    public User User { get; set; } = null!;
}

public class SubscriptionItem : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public string BillingCycle { get; set; } = "Monthly"; // Monthly, Yearly
    public DateOnly? NextBillingDate { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
}

