using Dayform.Application.Common;
using Dayform.Application.DTOs.Finance;
using Dayform.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dayform.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/finance")]
public class FinanceController : ControllerBase
{
    private readonly IFinanceService _financeService;
    private readonly ICurrentUserService _currentUser;

    public FinanceController(IFinanceService financeService, ICurrentUserService currentUser)
    {
        _financeService = financeService;
        _currentUser = currentUser;
    }

    // Transactions
    [HttpGet("transactions")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<FinancialTransactionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransactions([FromQuery] int? year, [FromQuery] int? month, CancellationToken ct)
    {
        var data = await _financeService.GetTransactionsAsync(_currentUser.UserId, year, month, ct);
        return Ok(ApiResponse<IReadOnlyList<FinancialTransactionDto>>.Ok(data));
    }

    [HttpPost("transactions")]
    [ProducesResponseType(typeof(ApiResponse<FinancialTransactionDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request, CancellationToken ct)
    {
        var data = await _financeService.CreateTransactionAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<FinancialTransactionDto>.Ok(data, "Transaction recorded."));
    }

    [HttpDelete("transactions/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteTransaction(Guid id, CancellationToken ct)
    {
        await _financeService.DeleteTransactionAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Budgets
    [HttpGet("budgets")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<MonthlyBudgetDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBudgets([FromQuery] int year, [FromQuery] int month, CancellationToken ct)
    {
        var data = await _financeService.GetBudgetsAsync(_currentUser.UserId, year, month, ct);
        return Ok(ApiResponse<IReadOnlyList<MonthlyBudgetDto>>.Ok(data));
    }

    [HttpPost("budgets")]
    [ProducesResponseType(typeof(ApiResponse<MonthlyBudgetDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetBudget([FromBody] SetBudgetRequest request, CancellationToken ct)
    {
        var data = await _financeService.SetBudgetAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<MonthlyBudgetDto>.Ok(data, "Budget updated."));
    }

    // Savings Goals
    [HttpGet("savings-goals")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SavingsGoalDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSavingsGoals(CancellationToken ct)
    {
        var data = await _financeService.GetSavingsGoalsAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<SavingsGoalDto>>.Ok(data));
    }

    [HttpPost("savings-goals")]
    [ProducesResponseType(typeof(ApiResponse<SavingsGoalDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateSavingsGoal([FromBody] CreateSavingsGoalRequest request, CancellationToken ct)
    {
        var data = await _financeService.CreateSavingsGoalAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<SavingsGoalDto>.Ok(data, "Savings goal created."));
    }

    [HttpPost("savings-goals/{id:guid}/add")]
    [ProducesResponseType(typeof(ApiResponse<SavingsGoalDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddToSavings(Guid id, [FromQuery] decimal amount, CancellationToken ct)
    {
        var data = await _financeService.UpdateSavingsProgressAsync(_currentUser.UserId, id, amount, ct);
        return Ok(ApiResponse<SavingsGoalDto>.Ok(data, "Savings progress updated."));
    }

    [HttpDelete("savings-goals/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteSavingsGoal(Guid id, CancellationToken ct)
    {
        await _financeService.DeleteSavingsGoalAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Debts
    [HttpGet("debts")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<DebtItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDebts(CancellationToken ct)
    {
        var data = await _financeService.GetDebtsAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<DebtItemDto>>.Ok(data));
    }

    [HttpPost("debts")]
    [ProducesResponseType(typeof(ApiResponse<DebtItemDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateDebt([FromBody] CreateDebtRequest request, CancellationToken ct)
    {
        var data = await _financeService.CreateDebtAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<DebtItemDto>.Ok(data, "Debt record added."));
    }

    [HttpPost("debts/{id:guid}/pay")]
    [ProducesResponseType(typeof(ApiResponse<DebtItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MakePayment(Guid id, [FromQuery] decimal amount, CancellationToken ct)
    {
        var data = await _financeService.MakeDebtPaymentAsync(_currentUser.UserId, id, amount, ct);
        return Ok(ApiResponse<DebtItemDto>.Ok(data, "Payment logged."));
    }

    [HttpDelete("debts/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteDebt(Guid id, CancellationToken ct)
    {
        await _financeService.DeleteDebtAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Subscriptions
    [HttpGet("subscriptions")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SubscriptionItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubscriptions(CancellationToken ct)
    {
        var data = await _financeService.GetSubscriptionsAsync(_currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<SubscriptionItemDto>>.Ok(data));
    }

    [HttpPost("subscriptions")]
    [ProducesResponseType(typeof(ApiResponse<SubscriptionItemDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateSubscription([FromBody] CreateSubscriptionRequest request, CancellationToken ct)
    {
        var data = await _financeService.CreateSubscriptionAsync(_currentUser.UserId, request, ct);
        return Ok(ApiResponse<SubscriptionItemDto>.Ok(data, "Subscription added."));
    }

    [HttpPost("subscriptions/{id:guid}/toggle")]
    [ProducesResponseType(typeof(ApiResponse<SubscriptionItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleSubscription(Guid id, CancellationToken ct)
    {
        var data = await _financeService.ToggleSubscriptionAsync(_currentUser.UserId, id, ct);
        return Ok(ApiResponse<SubscriptionItemDto>.Ok(data));
    }

    [HttpDelete("subscriptions/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteSubscription(Guid id, CancellationToken ct)
    {
        await _financeService.DeleteSubscriptionAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    // Financial Summary
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<FinancialSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary([FromQuery] int? year, [FromQuery] int? month, CancellationToken ct)
    {
        var data = await _financeService.GetFinancialSummaryAsync(_currentUser.UserId, year, month, ct);
        return Ok(ApiResponse<FinancialSummaryDto>.Ok(data));
    }
}

