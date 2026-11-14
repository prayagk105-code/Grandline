namespace Dayform.Application.DTOs.Finance;

public record FinancialTransactionDto(
    Guid Id,
    DateOnly TransactionDate,
    string Type,
    decimal Amount,
    string Category,
    string Description,
    string? PaymentMethod,
    DateTime CreatedAtUtc
);

public record CreateTransactionRequest(
    DateOnly TransactionDate,
    string Type,
    decimal Amount,
    string Category,
    string Description,
    string? PaymentMethod
);

public record MonthlyBudgetDto(
    Guid Id,
    int Year,
    int Month,
    string Category,
    decimal BudgetAmount,
    decimal ActualSpent
);

public record SetBudgetRequest(
    int Year,
    int Month,
    string Category,
    decimal BudgetAmount
);

public record SavingsGoalDto(
    Guid Id,
    string Title,
    decimal TargetAmount,
    decimal CurrentAmount,
    int ProgressPercent,
    DateOnly? TargetDate,
    bool IsCompleted,
    DateTime CreatedAtUtc
);

public record CreateSavingsGoalRequest(
    string Title,
    decimal TargetAmount,
    decimal CurrentAmount,
    DateOnly? TargetDate
);

public record DebtItemDto(
    Guid Id,
    string CreditorName,
    decimal TotalAmount,
    decimal RemainingAmount,
    decimal? InterestRate,
    decimal? MinimumPayment,
    DateOnly? DueDate,
    string? Notes,
    DateTime CreatedAtUtc
);

public record CreateDebtRequest(
    string CreditorName,
    decimal TotalAmount,
    decimal RemainingAmount,
    decimal? InterestRate,
    decimal? MinimumPayment,
    DateOnly? DueDate,
    string? Notes
);

public record SubscriptionItemDto(
    Guid Id,
    string Name,
    decimal Cost,
    string BillingCycle,
    DateOnly? NextBillingDate,
    string? Category,
    bool IsActive,
    DateTime CreatedAtUtc
);

public record CreateSubscriptionRequest(
    string Name,
    decimal Cost,
    string BillingCycle,
    DateOnly? NextBillingDate,
    string? Category
);

public record FinancialSummaryDto(
    decimal TotalIncomeThisMonth,
    decimal TotalExpensesThisMonth,
    decimal NetSavingsThisMonth,
    decimal SavingsRatePercent,
    decimal TotalDebtRemaining,
    decimal TotalMonthlySubscriptions,
    IReadOnlyList<FinancialTransactionDto> RecentTransactions
);

