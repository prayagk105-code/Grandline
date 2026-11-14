using Dayform.Application.DTOs.Finance;

namespace Dayform.Application.Interfaces;

public interface IFinanceService
{
    Task<IReadOnlyList<FinancialTransactionDto>> GetTransactionsAsync(Guid userId, int? year = null, int? month = null, CancellationToken ct = default);
    Task<FinancialTransactionDto> CreateTransactionAsync(Guid userId, CreateTransactionRequest request, CancellationToken ct = default);
    Task DeleteTransactionAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<MonthlyBudgetDto>> GetBudgetsAsync(Guid userId, int year, int month, CancellationToken ct = default);
    Task<MonthlyBudgetDto> SetBudgetAsync(Guid userId, SetBudgetRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<SavingsGoalDto>> GetSavingsGoalsAsync(Guid userId, CancellationToken ct = default);
    Task<SavingsGoalDto> CreateSavingsGoalAsync(Guid userId, CreateSavingsGoalRequest request, CancellationToken ct = default);
    Task<SavingsGoalDto> UpdateSavingsProgressAsync(Guid userId, Guid id, decimal amountToAdd, CancellationToken ct = default);
    Task DeleteSavingsGoalAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<DebtItemDto>> GetDebtsAsync(Guid userId, CancellationToken ct = default);
    Task<DebtItemDto> CreateDebtAsync(Guid userId, CreateDebtRequest request, CancellationToken ct = default);
    Task<DebtItemDto> MakeDebtPaymentAsync(Guid userId, Guid id, decimal paymentAmount, CancellationToken ct = default);
    Task DeleteDebtAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<SubscriptionItemDto>> GetSubscriptionsAsync(Guid userId, CancellationToken ct = default);
    Task<SubscriptionItemDto> CreateSubscriptionAsync(Guid userId, CreateSubscriptionRequest request, CancellationToken ct = default);
    Task<SubscriptionItemDto> ToggleSubscriptionAsync(Guid userId, Guid id, CancellationToken ct = default);
    Task DeleteSubscriptionAsync(Guid userId, Guid id, CancellationToken ct = default);

    Task<FinancialSummaryDto> GetFinancialSummaryAsync(Guid userId, int? year = null, int? month = null, CancellationToken ct = default);
}

