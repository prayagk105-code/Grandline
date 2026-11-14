using Dayform.Application.Common;
using Dayform.Application.DTOs.Finance;
using Dayform.Application.Interfaces;
using Dayform.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Dayform.Application.Services;

public class FinanceService : IFinanceService
{
    private readonly IDayformDbContext _db;

    public FinanceService(IDayformDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<FinancialTransactionDto>> GetTransactionsAsync(Guid userId, int? year = null, int? month = null, CancellationToken ct = default)
    {
        var query = _db.Transactions.AsNoTracking().Where(t => t.UserId == userId);
        if (year.HasValue && month.HasValue)
        {
            var start = new DateOnly(year.Value, month.Value, 1);
            var end = start.AddMonths(1).AddDays(-1);
            query = query.Where(t => t.TransactionDate >= start && t.TransactionDate <= end);
        }

        var list = await query.OrderByDescending(t => t.TransactionDate).ThenByDescending(t => t.CreatedAtUtc).ToListAsync(ct);
        return list.Select(t => new FinancialTransactionDto(t.Id, t.TransactionDate, t.Type, t.Amount, t.Category, t.Description, t.PaymentMethod, t.CreatedAtUtc)).ToList();
    }

    public async Task<FinancialTransactionDto> CreateTransactionAsync(Guid userId, CreateTransactionRequest request, CancellationToken ct = default)
    {
        if (request.Amount <= 0)
            throw new BadRequestException("Amount must be greater than 0.");

        var tx = new FinancialTransaction
        {
            UserId = userId,
            TransactionDate = request.TransactionDate,
            Type = string.IsNullOrWhiteSpace(request.Type) ? "Expense" : request.Type.Trim(),
            Amount = request.Amount,
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Other" : request.Category.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            PaymentMethod = request.PaymentMethod?.Trim()
        };

        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync(ct);

        return new FinancialTransactionDto(tx.Id, tx.TransactionDate, tx.Type, tx.Amount, tx.Category, tx.Description, tx.PaymentMethod, tx.CreatedAtUtc);
    }

    public async Task DeleteTransactionAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var tx = await _db.Transactions.FirstOrDefaultAsync(t => t.UserId == userId && t.Id == id, ct);
        if (tx == null) throw new NotFoundAppException("Transaction not found.");

        _db.Transactions.Remove(tx);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<MonthlyBudgetDto>> GetBudgetsAsync(Guid userId, int year, int month, CancellationToken ct = default)
    {
        var budgets = await _db.MonthlyBudgets.AsNoTracking()
            .Where(b => b.UserId == userId && b.Year == year && b.Month == month)
            .ToListAsync(ct);

        var start = new DateOnly(year, month, 1);
        var end = start.AddMonths(1).AddDays(-1);

        var spentByCategory = await _db.Transactions.AsNoTracking()
            .Where(t => t.UserId == userId && t.Type == "Expense" && t.TransactionDate >= start && t.TransactionDate <= end)
            .GroupBy(t => t.Category)
            .Select(g => new { Category = g.Key, Total = g.Sum(x => x.Amount) })
            .ToDictionaryAsync(x => x.Category, x => x.Total, ct);

        return budgets.Select(b =>
        {
            spentByCategory.TryGetValue(b.Category, out var spent);
            return new MonthlyBudgetDto(b.Id, b.Year, b.Month, b.Category, b.BudgetAmount, spent);
        }).ToList();
    }

    public async Task<MonthlyBudgetDto> SetBudgetAsync(Guid userId, SetBudgetRequest request, CancellationToken ct = default)
    {
        var existing = await _db.MonthlyBudgets
            .FirstOrDefaultAsync(b => b.UserId == userId && b.Year == request.Year && b.Month == request.Month && b.Category == request.Category, ct);

        if (existing != null)
        {
            existing.BudgetAmount = request.BudgetAmount;
            await _db.SaveChangesAsync(ct);
            return new MonthlyBudgetDto(existing.Id, existing.Year, existing.Month, existing.Category, existing.BudgetAmount, 0);
        }

        var budget = new MonthlyBudget
        {
            UserId = userId,
            Year = request.Year,
            Month = request.Month,
            Category = request.Category.Trim(),
            BudgetAmount = request.BudgetAmount
        };

        _db.MonthlyBudgets.Add(budget);
        await _db.SaveChangesAsync(ct);

        return new MonthlyBudgetDto(budget.Id, budget.Year, budget.Month, budget.Category, budget.BudgetAmount, 0);
    }

    public async Task<IReadOnlyList<SavingsGoalDto>> GetSavingsGoalsAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.SavingsGoals.AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.IsCompleted)
            .ThenByDescending(s => s.CreatedAtUtc)
            .ToListAsync(ct);

        return list.Select(s =>
        {
            var pct = s.TargetAmount > 0 ? (int)Math.Round((double)s.CurrentAmount / (double)s.TargetAmount * 100) : 0;
            return new SavingsGoalDto(s.Id, s.Title, s.TargetAmount, s.CurrentAmount, Math.Clamp(pct, 0, 100), s.TargetDate, s.IsCompleted, s.CreatedAtUtc);
        }).ToList();
    }

    public async Task<SavingsGoalDto> CreateSavingsGoalAsync(Guid userId, CreateSavingsGoalRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Savings goal title is required.");

        var goal = new SavingsGoal
        {
            UserId = userId,
            Title = request.Title.Trim(),
            TargetAmount = request.TargetAmount,
            CurrentAmount = request.CurrentAmount,
            TargetDate = request.TargetDate,
            IsCompleted = request.TargetAmount > 0 && request.CurrentAmount >= request.TargetAmount
        };

        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync(ct);

        var pct = goal.TargetAmount > 0 ? (int)Math.Round((double)goal.CurrentAmount / (double)goal.TargetAmount * 100) : 0;
        return new SavingsGoalDto(goal.Id, goal.Title, goal.TargetAmount, goal.CurrentAmount, Math.Clamp(pct, 0, 100), goal.TargetDate, goal.IsCompleted, goal.CreatedAtUtc);
    }

    public async Task<SavingsGoalDto> UpdateSavingsProgressAsync(Guid userId, Guid id, decimal amountToAdd, CancellationToken ct = default)
    {
        var goal = await _db.SavingsGoals.FirstOrDefaultAsync(s => s.UserId == userId && s.Id == id, ct);
        if (goal == null) throw new NotFoundAppException("Savings goal not found.");

        goal.CurrentAmount = Math.Max(0, goal.CurrentAmount + amountToAdd);
        if (goal.TargetAmount > 0 && goal.CurrentAmount >= goal.TargetAmount)
            goal.IsCompleted = true;

        await _db.SaveChangesAsync(ct);
        var pct = goal.TargetAmount > 0 ? (int)Math.Round((double)goal.CurrentAmount / (double)goal.TargetAmount * 100) : 0;
        return new SavingsGoalDto(goal.Id, goal.Title, goal.TargetAmount, goal.CurrentAmount, Math.Clamp(pct, 0, 100), goal.TargetDate, goal.IsCompleted, goal.CreatedAtUtc);
    }

    public async Task DeleteSavingsGoalAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var goal = await _db.SavingsGoals.FirstOrDefaultAsync(s => s.UserId == userId && s.Id == id, ct);
        if (goal == null) throw new NotFoundAppException("Savings goal not found.");

        _db.SavingsGoals.Remove(goal);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<DebtItemDto>> GetDebtsAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.Debts.AsNoTracking()
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.RemainingAmount)
            .ToListAsync(ct);

        return list.Select(d => new DebtItemDto(d.Id, d.CreditorName, d.TotalAmount, d.RemainingAmount, d.InterestRate, d.MinimumPayment, d.DueDate, d.Notes, d.CreatedAtUtc)).ToList();
    }

    public async Task<DebtItemDto> CreateDebtAsync(Guid userId, CreateDebtRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.CreditorName))
            throw new BadRequestException("Creditor name is required.");

        var debt = new DebtItem
        {
            UserId = userId,
            CreditorName = request.CreditorName.Trim(),
            TotalAmount = request.TotalAmount,
            RemainingAmount = request.RemainingAmount,
            InterestRate = request.InterestRate,
            MinimumPayment = request.MinimumPayment,
            DueDate = request.DueDate,
            Notes = request.Notes?.Trim()
        };

        _db.Debts.Add(debt);
        await _db.SaveChangesAsync(ct);

        return new DebtItemDto(debt.Id, debt.CreditorName, debt.TotalAmount, debt.RemainingAmount, debt.InterestRate, debt.MinimumPayment, debt.DueDate, debt.Notes, debt.CreatedAtUtc);
    }

    public async Task<DebtItemDto> MakeDebtPaymentAsync(Guid userId, Guid id, decimal paymentAmount, CancellationToken ct = default)
    {
        var debt = await _db.Debts.FirstOrDefaultAsync(d => d.UserId == userId && d.Id == id, ct);
        if (debt == null) throw new NotFoundAppException("Debt record not found.");

        debt.RemainingAmount = Math.Max(0, debt.RemainingAmount - paymentAmount);
        await _db.SaveChangesAsync(ct);

        return new DebtItemDto(debt.Id, debt.CreditorName, debt.TotalAmount, debt.RemainingAmount, debt.InterestRate, debt.MinimumPayment, debt.DueDate, debt.Notes, debt.CreatedAtUtc);
    }

    public async Task DeleteDebtAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var debt = await _db.Debts.FirstOrDefaultAsync(d => d.UserId == userId && d.Id == id, ct);
        if (debt == null) throw new NotFoundAppException("Debt not found.");

        _db.Debts.Remove(debt);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<SubscriptionItemDto>> GetSubscriptionsAsync(Guid userId, CancellationToken ct = default)
    {
        var list = await _db.Subscriptions.AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderBy(s => !s.IsActive)
            .ThenByDescending(s => s.Cost)
            .ToListAsync(ct);

        return list.Select(s => new SubscriptionItemDto(s.Id, s.Name, s.Cost, s.BillingCycle, s.NextBillingDate, s.Category, s.IsActive, s.CreatedAtUtc)).ToList();
    }

    public async Task<SubscriptionItemDto> CreateSubscriptionAsync(Guid userId, CreateSubscriptionRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new BadRequestException("Subscription name is required.");

        var sub = new SubscriptionItem
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Cost = request.Cost,
            BillingCycle = string.IsNullOrWhiteSpace(request.BillingCycle) ? "Monthly" : request.BillingCycle.Trim(),
            NextBillingDate = request.NextBillingDate,
            Category = request.Category?.Trim(),
            IsActive = true
        };

        _db.Subscriptions.Add(sub);
        await _db.SaveChangesAsync(ct);

        return new SubscriptionItemDto(sub.Id, sub.Name, sub.Cost, sub.BillingCycle, sub.NextBillingDate, sub.Category, sub.IsActive, sub.CreatedAtUtc);
    }

    public async Task<SubscriptionItemDto> ToggleSubscriptionAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.UserId == userId && s.Id == id, ct);
        if (sub == null) throw new NotFoundAppException("Subscription not found.");

        sub.IsActive = !sub.IsActive;
        await _db.SaveChangesAsync(ct);

        return new SubscriptionItemDto(sub.Id, sub.Name, sub.Cost, sub.BillingCycle, sub.NextBillingDate, sub.Category, sub.IsActive, sub.CreatedAtUtc);
    }

    public async Task DeleteSubscriptionAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.UserId == userId && s.Id == id, ct);
        if (sub == null) throw new NotFoundAppException("Subscription not found.");

        _db.Subscriptions.Remove(sub);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<FinancialSummaryDto> GetFinancialSummaryAsync(Guid userId, int? year = null, int? month = null, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        int y = year ?? now.Year;
        int m = month ?? now.Month;

        var start = new DateOnly(y, m, 1);
        var end = start.AddMonths(1).AddDays(-1);

        var monthTxs = await _db.Transactions.AsNoTracking()
            .Where(t => t.UserId == userId && t.TransactionDate >= start && t.TransactionDate <= end)
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync(ct);

        var totalIncome = monthTxs.Where(t => t.Type == "Income").Sum(t => t.Amount);
        var totalExpenses = monthTxs.Where(t => t.Type == "Expense").Sum(t => t.Amount);
        var netSavings = totalIncome - totalExpenses;
        var savingsRate = totalIncome > 0 ? Math.Round((netSavings / totalIncome) * 100, 1) : 0;

        var debts = await _db.Debts.AsNoTracking().Where(d => d.UserId == userId).ToListAsync(ct);
        var totalDebt = debts.Sum(d => d.RemainingAmount);

        var subs = await _db.Subscriptions.AsNoTracking().Where(s => s.UserId == userId && s.IsActive).ToListAsync(ct);
        var monthlySubs = subs.Sum(s => s.BillingCycle == "Yearly" ? Math.Round(s.Cost / 12, 2) : s.Cost);

        var recentTxs = monthTxs.Take(10)
            .Select(t => new FinancialTransactionDto(t.Id, t.TransactionDate, t.Type, t.Amount, t.Category, t.Description, t.PaymentMethod, t.CreatedAtUtc))
            .ToList();

        return new FinancialSummaryDto(
            totalIncome,
            totalExpenses,
            netSavings,
            savingsRate,
            totalDebt,
            monthlySubs,
            recentTxs
        );
    }
}
