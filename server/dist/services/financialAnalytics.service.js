"use strict";
/**
 * Financial Analytics Service
 *
 * This is the single source of truth for all financial calculations.
 * All totals, dashboards, budgets, charts, insights, and alerts are
 * derived here from actual Income and Expense records.
 *
 * NEVER maintain duplicate summary counters elsewhere.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sumExpenses = sumExpenses;
exports.sumIncome = sumIncome;
exports.getAvailableBalance = getAvailableBalance;
exports.getFinancialSummary = getFinancialSummary;
exports.getCategoryBreakdown = getCategoryBreakdown;
exports.getDailySpending = getDailySpending;
exports.getMonthlyData = getMonthlyData;
exports.getBudgetStatus = getBudgetStatus;
exports.getPaymentMethodBreakdown = getPaymentMethodBreakdown;
exports.getSpendingVelocity = getSpendingVelocity;
exports.generateFinancialInsights = generateFinancialInsights;
exports.getFinancialDashboard = getFinancialDashboard;
exports.getCalendarData = getCalendarData;
exports.detectUnusualSpending = detectUnusualSpending;
const date_fns_1 = require("date-fns");
const Expense_1 = require("../models/Expense");
const Income_1 = require("../models/Income");
const Budget_1 = require("../models/Budget");
const FinancialSettings_1 = require("../models/FinancialSettings");
const ExpenseCategory_1 = require("../models/ExpenseCategory");
// ─── Core Aggregation Helpers ─────────────────────────────────────────────────
function toUTCDayStart(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}
function toUTCDayEnd(date) {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d;
}
/**
 * Sum confirmed expenses in a date range.
 */
async function sumExpenses(userId, from, to) {
    const result = await Expense_1.Expense.aggregate([
        {
            $match: {
                userId,
                status: 'confirmed',
                isRefund: false,
                deletedAt: { $exists: false },
                date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
            },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const refunds = await Expense_1.Expense.aggregate([
        {
            $match: {
                userId,
                status: 'confirmed',
                isRefund: true,
                deletedAt: { $exists: false },
                date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
            },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const grossExpenses = result[0]?.total ?? 0;
    const refundTotal = refunds[0]?.total ?? 0;
    return Math.max(0, grossExpenses - refundTotal);
}
/**
 * Sum confirmed income in a date range.
 */
async function sumIncome(userId, from, to) {
    const result = await Income_1.Income.aggregate([
        {
            $match: {
                userId,
                status: 'confirmed',
                deletedAt: { $exists: false },
                date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
            },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
}
// ─── Available Balance ────────────────────────────────────────────────────────
async function getAvailableBalance(userId) {
    const settings = await FinancialSettings_1.FinancialSettings.findOne({ userId });
    const openingBalance = settings?.openingBalance ?? 0;
    // All-time confirmed income
    const incomeResult = await Income_1.Income.aggregate([
        { $match: { userId, status: 'confirmed', deletedAt: { $exists: false } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalConfirmedIncome = incomeResult[0]?.total ?? 0;
    // All-time confirmed expenses (net of refunds)
    const expenseResult = await Expense_1.Expense.aggregate([
        {
            $match: { userId, status: 'confirmed', isRefund: false, deletedAt: { $exists: false } },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const refundResult = await Expense_1.Expense.aggregate([
        {
            $match: { userId, status: 'confirmed', isRefund: true, deletedAt: { $exists: false } },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const grossExpenses = expenseResult[0]?.total ?? 0;
    const refundTotal = refundResult[0]?.total ?? 0;
    const totalConfirmedExpenses = Math.max(0, grossExpenses - refundTotal);
    return {
        openingBalance,
        totalConfirmedIncome,
        totalConfirmedExpenses,
        availableBalance: openingBalance + totalConfirmedIncome - totalConfirmedExpenses,
    };
}
// ─── Period Summary ───────────────────────────────────────────────────────────
async function getFinancialSummary(userId, from, to) {
    const [totalIncome, totalExpenses] = await Promise.all([
        sumIncome(userId, from, to),
        sumExpenses(userId, from, to),
    ]);
    return {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
    };
}
// ─── Category Breakdown ───────────────────────────────────────────────────────
async function getCategoryBreakdown(userId, from, to) {
    const pipeline = await Expense_1.Expense.aggregate([
        {
            $match: {
                userId,
                status: 'confirmed',
                isRefund: false,
                deletedAt: { $exists: false },
                date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
            },
        },
        {
            $group: {
                _id: '$categoryId',
                amount: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'expensecategories',
                localField: '_id',
                foreignField: '_id',
                as: 'category',
            },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $sort: { amount: -1 } },
    ]);
    const total = pipeline.reduce((sum, row) => sum + row.amount, 0);
    return pipeline.map((row) => ({
        categoryId: row._id?.toString() ?? 'unknown',
        name: row.category?.name ?? 'Unknown',
        icon: row.category?.icon ?? '📦',
        color: row.category?.color ?? '#71717a',
        amount: row.amount,
        percentage: total > 0 ? Math.round((row.amount / total) * 100) : 0,
        transactionCount: row.count,
    }));
}
// ─── Daily Spending ───────────────────────────────────────────────────────────
async function getDailySpending(userId, from, to) {
    const days = (0, date_fns_1.eachDayOfInterval)({ start: from, end: to });
    const [expenses, incomes] = await Promise.all([
        Expense_1.Expense.aggregate([
            {
                $match: {
                    userId,
                    status: 'confirmed',
                    isRefund: false,
                    deletedAt: { $exists: false },
                    date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]),
        Income_1.Income.aggregate([
            {
                $match: {
                    userId,
                    status: 'confirmed',
                    deletedAt: { $exists: false },
                    date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    amount: { $sum: '$amount' },
                },
            },
        ]),
    ]);
    const expenseMap = new Map(expenses.map((e) => [e._id, { amount: e.amount, count: e.count }]));
    const incomeMap = new Map(incomes.map((i) => [i._id, i.amount]));
    return days.map((day) => {
        const key = (0, date_fns_1.format)(day, 'yyyy-MM-dd');
        const exp = expenseMap.get(key) ?? { amount: 0, count: 0 };
        return {
            date: key,
            amount: exp.amount,
            incomeAmount: incomeMap.get(key) ?? 0,
            transactionCount: exp.count,
        };
    });
}
// ─── Monthly Data ─────────────────────────────────────────────────────────────
async function getMonthlyData(userId, months = 12) {
    const now = new Date();
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
        const monthDate = (0, date_fns_1.subMonths)(now, i);
        const from = (0, date_fns_1.startOfMonth)(monthDate);
        const to = (0, date_fns_1.endOfMonth)(monthDate);
        const [income, expenses] = await Promise.all([
            sumIncome(userId, from, to),
            sumExpenses(userId, from, to),
        ]);
        result.push({
            year: monthDate.getFullYear(),
            month: monthDate.getMonth() + 1,
            label: (0, date_fns_1.format)(monthDate, 'MMM yyyy'),
            income,
            expenses,
            netCashFlow: income - expenses,
        });
    }
    return result;
}
// ─── Budget Status ────────────────────────────────────────────────────────────
async function getBudgetStatus(userId, year, month) {
    const budget = await Budget_1.Budget.findOne({ userId, year, month });
    if (!budget || (budget.overall === 0 && budget.categoryBudgets.length === 0)) {
        return null;
    }
    const from = new Date(year, month - 1, 1);
    const to = (0, date_fns_1.endOfMonth)(from);
    // Overall budget status
    const totalSpent = await sumExpenses(userId, from, to);
    const overallRemaining = Math.max(0, budget.overall - totalSpent);
    const overallPercentage = budget.overall > 0 ? Math.round((totalSpent / budget.overall) * 100) : 0;
    // Per-category budget status
    const categoryIds = budget.categoryBudgets.map((cb) => cb.categoryId);
    const categories = await ExpenseCategory_1.ExpenseCategory.find({ _id: { $in: categoryIds } }).lean();
    const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]));
    const categoryExpenses = await Expense_1.Expense.aggregate([
        {
            $match: {
                userId,
                status: 'confirmed',
                isRefund: false,
                deletedAt: { $exists: false },
                date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
                categoryId: { $in: categoryIds },
            },
        },
        { $group: { _id: '$categoryId', spent: { $sum: '$amount' } } },
    ]);
    const spentMap = new Map(categoryExpenses.map((e) => [e._id.toString(), e.spent]));
    const categoryStatuses = budget.categoryBudgets.map((cb) => {
        const cat = categoryMap.get(cb.categoryId.toString());
        const spent = spentMap.get(cb.categoryId.toString()) ?? 0;
        const remaining = Math.max(0, cb.amount - spent);
        const pct = cb.amount > 0 ? Math.round((spent / cb.amount) * 100) : 0;
        return {
            categoryId: cb.categoryId.toString(),
            name: cat?.name ?? 'Unknown',
            icon: cat?.icon ?? '📦',
            color: cat?.color ?? '#71717a',
            budgeted: cb.amount,
            spent,
            remaining,
            percentage: pct,
            isOverBudget: spent > cb.amount,
        };
    });
    return {
        overall: {
            budgeted: budget.overall,
            spent: totalSpent,
            remaining: overallRemaining,
            percentage: overallPercentage,
        },
        categories: categoryStatuses.sort((a, b) => b.percentage - a.percentage),
    };
}
// ─── Payment Method Breakdown ─────────────────────────────────────────────────
async function getPaymentMethodBreakdown(userId, from, to) {
    const pipeline = await Expense_1.Expense.aggregate([
        {
            $match: {
                userId,
                status: 'confirmed',
                isRefund: false,
                deletedAt: { $exists: false },
                date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
            },
        },
        {
            $group: {
                _id: '$paymentMethodId',
                amount: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'paymentmethods',
                localField: '_id',
                foreignField: '_id',
                as: 'method',
            },
        },
        { $unwind: { path: '$method', preserveNullAndEmptyArrays: true } },
        { $sort: { amount: -1 } },
    ]);
    const total = pipeline.reduce((sum, row) => sum + row.amount, 0);
    return pipeline.map((row) => ({
        methodId: row._id?.toString() ?? null,
        name: row.method?.name ?? 'Unspecified',
        icon: row.method?.icon ?? '💳',
        amount: row.amount,
        percentage: total > 0 ? Math.round((row.amount / total) * 100) : 0,
        count: row.count,
    }));
}
// ─── Spending Velocity ────────────────────────────────────────────────────────
async function getSpendingVelocity(userId, year, month) {
    const budget = await Budget_1.Budget.findOne({ userId, year, month });
    if (!budget || budget.overall === 0)
        return null;
    const now = new Date();
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = (0, date_fns_1.endOfMonth)(monthStart);
    const totalDaysInMonth = (0, date_fns_1.differenceInDays)(monthEnd, monthStart) + 1;
    const daysElapsed = Math.min((0, date_fns_1.differenceInDays)(now, monthStart) + 1, totalDaysInMonth);
    const percentMonthElapsed = Math.round((daysElapsed / totalDaysInMonth) * 100);
    const spentAmount = await sumExpenses(userId, monthStart, now);
    const percentBudgetUsed = budget.overall > 0 ? Math.round((spentAmount / budget.overall) * 100) : 0;
    const dailyAvg = daysElapsed > 0 ? spentAmount / daysElapsed : 0;
    const projectedMonthlySpend = Math.round(dailyAvg * totalDaysInMonth);
    return {
        daysElapsed,
        totalDaysInMonth,
        percentMonthElapsed,
        budgetedAmount: budget.overall,
        spentAmount,
        percentBudgetUsed,
        isOverPace: percentBudgetUsed > percentMonthElapsed,
        projectedMonthlySpend,
    };
}
// ─── Insights ─────────────────────────────────────────────────────────────────
async function generateFinancialInsights(userId) {
    const insights = [];
    const now = new Date();
    const thisMonthStart = (0, date_fns_1.startOfMonth)(now);
    const lastMonthStart = (0, date_fns_1.startOfMonth)((0, date_fns_1.subMonths)(now, 1));
    const lastMonthEnd = (0, date_fns_1.endOfMonth)((0, date_fns_1.subMonths)(now, 1));
    // Check if there's enough data
    const expenseCount = await Expense_1.Expense.countDocuments({
        userId,
        deletedAt: { $exists: false },
        status: 'confirmed',
    });
    if (expenseCount < 3) {
        insights.push({
            id: 'no-data',
            type: 'info',
            title: 'Start Tracking',
            message: 'Add a few transactions to see personalized financial insights here.',
            icon: '💡',
        });
        return insights;
    }
    const [thisMonthExpenses, lastMonthExpenses, thisMonthIncome, balance, categories] = await Promise.all([
        sumExpenses(userId, thisMonthStart, now),
        sumExpenses(userId, lastMonthStart, lastMonthEnd),
        sumIncome(userId, thisMonthStart, now),
        getAvailableBalance(userId),
        getCategoryBreakdown(userId, thisMonthStart, now),
    ]);
    const settings = await FinancialSettings_1.FinancialSettings.findOne({ userId });
    const budget = await Budget_1.Budget.findOne({ userId, year: now.getFullYear(), month: now.getMonth() + 1 });
    const currencySymbol = settings?.currencySymbol ?? '₹';
    const fmt = (n) => `${currencySymbol}${n.toLocaleString('en-IN')}`;
    // Month-over-month comparison
    if (lastMonthExpenses > 0) {
        const diff = thisMonthExpenses - lastMonthExpenses;
        const pct = Math.round(Math.abs(diff / lastMonthExpenses) * 100);
        if (diff > 0 && pct >= 10) {
            insights.push({
                id: 'mom-increase',
                type: 'warning',
                title: 'Spending Increased',
                message: `You've spent ${fmt(diff)} more (${pct}% increase) compared to last month.`,
                icon: '📈',
            });
        }
        else if (diff < 0 && pct >= 10) {
            insights.push({
                id: 'mom-decrease',
                type: 'success',
                title: 'Spending Decreased',
                message: `Great! You've spent ${fmt(Math.abs(diff))} less (${pct}% decrease) than last month.`,
                icon: '📉',
            });
        }
    }
    // Top category insight
    if (categories.length > 0) {
        const top = categories[0];
        if (top.percentage >= 30) {
            insights.push({
                id: 'top-category',
                type: 'info',
                title: `${top.name} is Your Largest Expense`,
                message: `${top.icon} ${top.name} accounts for ${top.percentage}% of your expenses this month (${fmt(top.amount)}).`,
                icon: top.icon,
            });
        }
    }
    // Low balance alert
    const threshold = settings?.lowBalanceThreshold ?? 10000;
    if (balance.availableBalance < threshold && balance.availableBalance >= 0) {
        insights.push({
            id: 'low-balance',
            type: 'alert',
            title: 'Low Balance Warning',
            message: `Your available balance (${fmt(balance.availableBalance)}) is below your threshold of ${fmt(threshold)}.`,
            icon: '⚠️',
        });
    }
    // Budget usage
    if (budget && budget.overall > 0) {
        const pct = Math.round((thisMonthExpenses / budget.overall) * 100);
        if (pct >= 90 && pct < 100) {
            insights.push({
                id: 'budget-near-limit',
                type: 'warning',
                title: 'Approaching Budget Limit',
                message: `You've used ${pct}% of your monthly budget. Only ${fmt(budget.overall - thisMonthExpenses)} remaining.`,
                icon: '🔴',
            });
        }
        else if (pct >= 100) {
            insights.push({
                id: 'budget-exceeded',
                type: 'alert',
                title: 'Budget Exceeded',
                message: `Your spending has exceeded your monthly budget by ${fmt(thisMonthExpenses - budget.overall)}.`,
                icon: '🚨',
            });
        }
    }
    // Savings insight
    if (thisMonthIncome > 0 && thisMonthExpenses > 0) {
        const savingsRate = Math.round(((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100);
        if (savingsRate >= 20) {
            insights.push({
                id: 'good-savings',
                type: 'success',
                title: 'Great Savings Rate!',
                message: `You're saving ${savingsRate}% of your income this month. Keep it up!`,
                icon: '💪',
            });
        }
        else if (savingsRate < 0) {
            insights.push({
                id: 'deficit',
                type: 'warning',
                title: 'Spending Exceeds Income',
                message: `Your expenses this month exceed your income by ${fmt(thisMonthExpenses - thisMonthIncome)}.`,
                icon: '⚠️',
            });
        }
    }
    return insights.slice(0, 6);
}
// ─── Full Dashboard ───────────────────────────────────────────────────────────
async function getFinancialDashboard(userId, from, to) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const [summary, balance, categoryBreakdown, dailySpending, budgetStatus, insights, velocity, settings] = await Promise.all([
        getFinancialSummary(userId, from, to),
        getAvailableBalance(userId),
        getCategoryBreakdown(userId, from, to),
        getDailySpending(userId, from, to),
        getBudgetStatus(userId, year, month),
        generateFinancialInsights(userId),
        getSpendingVelocity(userId, year, month),
        FinancialSettings_1.FinancialSettings.findOne({ userId }),
    ]);
    // Recent transactions (expenses + income combined)
    const [recentExpenses, recentIncomes] = await Promise.all([
        Expense_1.Expense.find({ userId, deletedAt: { $exists: false } })
            .sort({ date: -1, createdAt: -1 })
            .limit(10)
            .populate('categoryId', 'name icon color')
            .populate('paymentMethodId', 'name icon')
            .lean(),
        Income_1.Income.find({ userId, deletedAt: { $exists: false } })
            .sort({ date: -1, createdAt: -1 })
            .limit(5)
            .populate('categoryId', 'name icon color')
            .lean(),
    ]);
    const recentTransactions = [
        ...recentExpenses.map((e) => ({ ...e, transactionType: 'expense' })),
        ...recentIncomes.map((i) => ({ ...i, transactionType: 'income' })),
    ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    // Average daily spending
    const days = Math.max(1, (0, date_fns_1.differenceInDays)(to, from) + 1);
    const averageDailySpending = Math.round(summary.totalExpenses / days);
    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;
    return {
        period: { from, to },
        summary,
        balance,
        budgetStatus,
        categoryBreakdown,
        dailySpending,
        recentTransactions,
        insights,
        velocity,
        averageDailySpending,
        topCategory,
        currencySymbol: settings?.currencySymbol ?? '₹',
    };
}
// ─── Calendar Data ────────────────────────────────────────────────────────────
async function getCalendarData(userId, year, month) {
    const from = new Date(year, month - 1, 1);
    const to = (0, date_fns_1.endOfMonth)(from);
    const [expenses, incomes] = await Promise.all([
        Expense_1.Expense.aggregate([
            {
                $match: {
                    userId,
                    status: 'confirmed',
                    isRefund: false,
                    deletedAt: { $exists: false },
                    date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]),
        Income_1.Income.aggregate([
            {
                $match: {
                    userId,
                    status: 'confirmed',
                    deletedAt: { $exists: false },
                    date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    amount: { $sum: '$amount' },
                },
            },
        ]),
    ]);
    const expenseMap = new Map(expenses.map((e) => [e._id, { amount: e.amount, count: e.count }]));
    const incomeMap = new Map(incomes.map((i) => [i._id, i.amount]));
    const days = (0, date_fns_1.eachDayOfInterval)({ start: from, end: to });
    return days.map((day) => {
        const key = (0, date_fns_1.format)(day, 'yyyy-MM-dd');
        const exp = expenseMap.get(key) ?? { amount: 0, count: 0 };
        return {
            date: key,
            expenseAmount: exp.amount,
            incomeAmount: incomeMap.get(key) ?? 0,
            transactionCount: exp.count,
        };
    });
}
// ─── Unusual Spending Detection ───────────────────────────────────────────────
async function detectUnusualSpending(userId, categoryId, amount) {
    // Get last 90 days of expenses for this category
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const history = await Expense_1.Expense.find({
        userId,
        categoryId,
        status: 'confirmed',
        isRefund: false,
        deletedAt: { $exists: false },
        date: { $gte: ninetyDaysAgo },
    }).lean();
    if (history.length < 3) {
        return { isUnusual: false, averageAmount: 0 };
    }
    const amounts = history.map((e) => e.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / amounts.length);
    const threshold = avg + 2 * stdDev;
    if (amount > threshold && amount > avg * 2) {
        return {
            isUnusual: true,
            averageAmount: Math.round(avg),
            message: `This amount is significantly higher than your typical spending in this category (avg: ₹${Math.round(avg)}).`,
        };
    }
    return { isUnusual: false, averageAmount: Math.round(avg) };
}
//# sourceMappingURL=financialAnalytics.service.js.map