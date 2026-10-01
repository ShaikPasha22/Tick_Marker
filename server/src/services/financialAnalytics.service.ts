/**
 * Financial Analytics Service
 * 
 * This is the single source of truth for all financial calculations.
 * All totals, dashboards, budgets, charts, insights, and alerts are
 * derived here from actual Income and Expense records.
 * 
 * NEVER maintain duplicate summary counters elsewhere.
 */

import { Types } from 'mongoose';
import { format, differenceInDays } from 'date-fns';
import { Expense } from '../models/Expense';
import { Income } from '../models/Income';
import { Budget } from '../models/Budget';
import { FinancialSettings } from '../models/FinancialSettings';
import { ExpenseCategory } from '../models/ExpenseCategory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
}

export interface AvailableBalance {
  openingBalance: number;
  totalConfirmedIncome: number;
  totalConfirmedExpenses: number;
  availableBalance: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DailySpendingItem {
  date: string;
  amount: number;
  incomeAmount: number;
  transactionCount: number;
}

export interface MonthlyDataItem {
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface BudgetStatusItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

/** A budget (overall or one category) that has reached one of the user's alert thresholds */
export interface BudgetAlert {
  scope: 'overall' | 'category';
  categoryId?: string;
  name: string;
  icon?: string;
  threshold: number; // highest threshold reached, e.g. 90
  percentage: number;
  spent: number;
  budgeted: number;
}

/** Average daily spending over every day before a period, since the user's first transaction */
export interface PriorDailyAverage {
  amount: number;
  days: number;
  from: Date;
  to: Date;
}

/** How much can still be spent per day for the rest of the current month */
export interface SafeToSpend {
  perDay: number;
  remaining: number;
  daysLeft: number;
}

export interface BudgetStatus {
  overall: {
    budgeted: number;
    carriedForward: number;
    spent: number;
    remaining: number;
    percentage: number;
  };
  categories: BudgetStatusItem[];
}

export interface PaymentMethodBreakdown {
  methodId: string | null;
  name: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface SpendingVelocity {
  daysElapsed: number;
  totalDaysInMonth: number;
  percentMonthElapsed: number;
  budgetedAmount: number;
  spentAmount: number;
  percentBudgetUsed: number;
  isOverPace: boolean;
  projectedMonthlySpend: number;
}

export interface FinancialInsight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  icon: string;
}

export interface FinancialDashboard {
  /** isFullMonth: the range is exactly one calendar month (budget, pace and insights apply) */
  period: { from: Date; to: Date; isFullMonth: boolean };
  summary: FinancialSummary;
  balance: AvailableBalance;
  /** Balance just before the period starts and at its last day */
  periodBalance: { startingBalance: number; endingBalance: number };
  budgetStatus: BudgetStatus | null;
  /** Month view only: budgets past an alert threshold, most-used first */
  budgetAlerts: BudgetAlert[];
  /** Current month with a budget only */
  safeToSpend: SafeToSpend | null;
  /** Usual spending per day before this period (first transaction day up to the day before it) */
  priorDailyAverage: PriorDailyAverage | null;
  categoryBreakdown: CategoryBreakdownItem[];
  dailySpending: DailySpendingItem[];
  recentTransactions: any[];
  insights: FinancialInsight[];
  velocity: SpendingVelocity | null;
  averageDailySpending: number;
  topCategory: CategoryBreakdownItem | null;
  currencySymbol: string;
}

// ─── Core Aggregation Helpers ─────────────────────────────────────────────────

// Transaction dates are stored as UTC midnight of the calendar day the user picked
// (the client sends "yyyy-MM-dd"), so every day/month boundary is computed in UTC,
// never in the server's local timezone, which would shift entries across months.
export function toUTCDayStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function toUTCDayEnd(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** First and last instant (UTC) of a calendar month; month is 1-12. */
export function utcMonthRange(year: number, month: number): { from: Date; to: Date } {
  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    to: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

/** Year/month (1-12) of the month `offset` months away from the given one. */
function shiftUTCMonth(year: number, month: number, offset: number): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/** "yyyy-MM-dd" keys for every UTC day in [from, to]. */
function utcDayKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const end = toUTCDayStart(to).getTime();
  for (let t = toUTCDayStart(from).getTime(); t <= end; t += 24 * 60 * 60 * 1000) {
    keys.push(new Date(t).toISOString().slice(0, 10));
  }
  return keys;
}

/**
 * Sum confirmed expenses in a date range.
 */
export async function sumExpenses(userId: Types.ObjectId, from: Date, to: Date): Promise<number> {
  const result = await Expense.aggregate([
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

  const refunds = await Expense.aggregate([
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
export async function sumIncome(userId: Types.ObjectId, from: Date, to: Date): Promise<number> {
  const result = await Income.aggregate([
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

/**
 * Opening balance plus confirmed income minus expenses: all time, or only
 * transactions dated on/before `asOf` when given.
 */
export async function getAvailableBalance(userId: Types.ObjectId, asOf?: Date): Promise<AvailableBalance> {
  const settings = await FinancialSettings.findOne({ userId });
  const openingBalance = settings?.openingBalance ?? 0;
  const dateFilter = asOf ? { date: { $lte: toUTCDayEnd(asOf) } } : {};

  // All-time confirmed income
  const incomeResult = await Income.aggregate([
    { $match: { userId, status: 'confirmed', deletedAt: { $exists: false }, ...dateFilter } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalConfirmedIncome = incomeResult[0]?.total ?? 0;

  // All-time confirmed expenses (net of refunds)
  const expenseResult = await Expense.aggregate([
    {
      $match: { userId, status: 'confirmed', isRefund: false, deletedAt: { $exists: false }, ...dateFilter },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const refundResult = await Expense.aggregate([
    {
      $match: { userId, status: 'confirmed', isRefund: true, deletedAt: { $exists: false }, ...dateFilter },
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

export async function getFinancialSummary(
  userId: Types.ObjectId,
  from: Date,
  to: Date
): Promise<FinancialSummary> {
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

export async function getCategoryBreakdown(
  userId: Types.ObjectId,
  from: Date,
  to: Date
): Promise<CategoryBreakdownItem[]> {
  const pipeline = await Expense.aggregate([
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

export async function getDailySpending(
  userId: Types.ObjectId,
  from: Date,
  to: Date
): Promise<DailySpendingItem[]> {
  const [expenses, incomes] = await Promise.all([
    Expense.aggregate([
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
    Income.aggregate([
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

  return utcDayKeys(from, to).map((key) => {
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

export async function getMonthlyData(
  userId: Types.ObjectId,
  months: number = 12
): Promise<MonthlyDataItem[]> {
  const now = new Date();
  const result: MonthlyDataItem[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const { year, month } = shiftUTCMonth(now.getUTCFullYear(), now.getUTCMonth() + 1, -i);
    const { from, to } = utcMonthRange(year, month);

    const [income, expenses] = await Promise.all([
      sumIncome(userId, from, to),
      sumExpenses(userId, from, to),
    ]);

    result.push({
      year,
      month,
      label: format(new Date(year, month - 1, 1), 'MMM yyyy'),
      income,
      expenses,
      netCashFlow: income - expenses,
    });
  }

  return result;
}

// ─── Budget Status ────────────────────────────────────────────────────────────

/**
 * Unspent budget brought into `year/month` from the previous month, when that month's
 * budget has "carry forward" switched on. Chains back while consecutive months keep it on.
 */
async function getCarriedForwardAmount(userId: Types.ObjectId, year: number, month: number): Promise<number> {
  const previous = shiftUTCMonth(year, month, -1);
  const previousBudget = await Budget.findOne({ userId, year: previous.year, month: previous.month });
  if (!previousBudget?.carryForward) return 0;

  const { from, to } = utcMonthRange(previous.year, previous.month);
  const [previousCarry, previousSpent] = await Promise.all([
    getCarriedForwardAmount(userId, previous.year, previous.month),
    sumExpenses(userId, from, to),
  ]);
  return Math.max(0, previousBudget.overall + previousCarry - previousSpent);
}

export async function getBudgetStatus(
  userId: Types.ObjectId,
  year: number,
  month: number
): Promise<BudgetStatus | null> {
  const budget = await Budget.findOne({ userId, year, month });
  const { from, to } = utcMonthRange(year, month);

  const carriedForward = await getCarriedForwardAmount(userId, year, month);
  const hasOwnBudget = !!budget && (budget.overall > 0 || budget.categoryBudgets.length > 0);
  if (!hasOwnBudget && carriedForward === 0) return null;

  // Overall budget status
  const totalSpent = await sumExpenses(userId, from, to);
  const effectiveBudget = (budget?.overall ?? 0) + carriedForward;
  const overallRemaining = Math.max(0, effectiveBudget - totalSpent);
  const overallPercentage = effectiveBudget > 0 ? Math.round((totalSpent / effectiveBudget) * 100) : 0;

  // Per-category budget status
  const categoryBudgets = budget?.categoryBudgets ?? [];
  const categoryIds = categoryBudgets.map((cb) => cb.categoryId);
  const categories = await ExpenseCategory.find({ _id: { $in: categoryIds } }).lean();
  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]));

  const categoryExpenses = await Expense.aggregate([
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

  const categoryStatuses: BudgetStatusItem[] = categoryBudgets.map((cb) => {
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
      budgeted: effectiveBudget,
      carriedForward,
      spent: totalSpent,
      remaining: overallRemaining,
      percentage: overallPercentage,
    },
    categories: categoryStatuses.sort((a, b) => b.percentage - a.percentage),
  };
}

// ─── Payment Method Breakdown ─────────────────────────────────────────────────

export async function getPaymentMethodBreakdown(
  userId: Types.ObjectId,
  from: Date,
  to: Date
): Promise<PaymentMethodBreakdown[]> {
  const pipeline = await Expense.aggregate([
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

export async function getSpendingVelocity(
  userId: Types.ObjectId,
  year: number,
  month: number
): Promise<SpendingVelocity | null> {
  const budgetStatus = await getBudgetStatus(userId, year, month);
  if (!budgetStatus || budgetStatus.overall.budgeted === 0) return null;

  const now = new Date();
  const { from: monthStart, to: monthEnd } = utcMonthRange(year, month);
  const totalDaysInMonth = monthEnd.getUTCDate();
  const daysElapsed = Math.max(0, Math.min(differenceInDays(now, monthStart) + 1, totalDaysInMonth));
  const percentMonthElapsed = Math.round((daysElapsed / totalDaysInMonth) * 100);

  const spentThrough = now < monthEnd ? now : monthEnd;
  const spentAmount = daysElapsed > 0 ? await sumExpenses(userId, monthStart, spentThrough) : 0;
  const percentBudgetUsed = budgetStatus.overall.budgeted > 0
    ? Math.round((spentAmount / budgetStatus.overall.budgeted) * 100)
    : 0;

  const dailyAvg = daysElapsed > 0 ? spentAmount / daysElapsed : 0;
  const projectedMonthlySpend = Math.round(dailyAvg * totalDaysInMonth);

  return {
    daysElapsed,
    totalDaysInMonth,
    percentMonthElapsed,
    budgetedAmount: budgetStatus.overall.budgeted,
    spentAmount,
    percentBudgetUsed,
    isOverPace: percentBudgetUsed > percentMonthElapsed,
    projectedMonthlySpend,
  };
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export async function generateFinancialInsights(
  userId: Types.ObjectId,
  periodFrom?: Date,
  periodTo?: Date
): Promise<FinancialInsight[]> {
  const insights: FinancialInsight[] = [];
  const now = new Date();
  const periodStart = periodFrom ?? now;
  const periodYear = periodStart.getUTCFullYear();
  const periodMonth = periodStart.getUTCMonth() + 1;
  const thisMonthStart = utcMonthRange(periodYear, periodMonth).from;
  const thisMonthEnd = periodTo && periodTo < now ? periodTo : now;
  const previous = shiftUTCMonth(periodYear, periodMonth, -1);
  const { from: lastMonthStart, to: lastMonthEnd } = utcMonthRange(previous.year, previous.month);

  // Check if there's enough data
  const expenseCount = await Expense.countDocuments({
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

  const [thisMonthExpenses, lastMonthExpenses, thisMonthIncome, balance, categories] =
    await Promise.all([
      sumExpenses(userId, thisMonthStart, thisMonthEnd),
      sumExpenses(userId, lastMonthStart, lastMonthEnd),
      sumIncome(userId, thisMonthStart, thisMonthEnd),
      getAvailableBalance(userId),
      getCategoryBreakdown(userId, thisMonthStart, thisMonthEnd),
    ]);

  const settings = await FinancialSettings.findOne({ userId });
  const budget = await Budget.findOne({
    userId,
    year: periodYear,
    month: periodMonth,
  });
  const currencySymbol = settings?.currencySymbol ?? '₹';
  const fmt = (n: number) => `${currencySymbol}${n.toLocaleString('en-IN')}`;

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
    } else if (diff < 0 && pct >= 10) {
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
  const threshold = settings?.lowBalanceThreshold ?? 0;
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
  const monthBudgetStatus = await getBudgetStatus(userId, periodYear, periodMonth);
  if (budget && monthBudgetStatus && monthBudgetStatus.overall.budgeted > 0) {
    const effectiveBudget = monthBudgetStatus.overall.budgeted;
    const pct = Math.round((thisMonthExpenses / effectiveBudget) * 100);
    if (pct >= 90 && pct < 100) {
      insights.push({
        id: 'budget-near-limit',
        type: 'warning',
        title: 'Approaching Budget Limit',
        message: `You've used ${pct}% of your monthly budget. Only ${fmt(effectiveBudget - thisMonthExpenses)} remaining.`,
        icon: '🔴',
      });
    } else if (pct >= 100) {
      insights.push({
        id: 'budget-exceeded',
        type: 'alert',
        title: 'Budget Exceeded',
        message: `Your spending has exceeded your monthly budget by ${fmt(thisMonthExpenses - effectiveBudget)}.`,
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
    } else if (savingsRate < 0) {
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

export const DEFAULT_BUDGET_ALERT_THRESHOLDS = [75, 90, 100];

/** Highest threshold reached by the overall budget and by each category budget. */
export function getBudgetAlerts(status: BudgetStatus, thresholds: number[]): BudgetAlert[] {
  const sorted = [...thresholds].filter((t) => t > 0).sort((a, b) => b - a);
  const reached = (pct: number) => sorted.find((t) => pct >= t);
  const alerts: BudgetAlert[] = [];

  const overallThreshold = status.overall.budgeted > 0 ? reached(status.overall.percentage) : undefined;
  if (overallThreshold !== undefined) {
    alerts.push({
      scope: 'overall', name: 'Overall budget', threshold: overallThreshold,
      percentage: status.overall.percentage, spent: status.overall.spent, budgeted: status.overall.budgeted,
    });
  }
  for (const c of status.categories) {
    const t = c.budgeted > 0 ? reached(c.percentage) : undefined;
    if (t !== undefined) {
      alerts.push({
        scope: 'category', categoryId: c.categoryId, name: c.name, icon: c.icon, threshold: t,
        percentage: c.percentage, spent: c.spent, budgeted: c.budgeted,
      });
    }
  }
  return alerts.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Thresholds that a just-added expense pushed its month's budgets past (overall, and the
 * expense's own category). Used to warn the user right after they save the expense.
 */
export async function getNewlyCrossedBudgetAlerts(
  userId: Types.ObjectId,
  expense: { date: Date; amount: number; categoryId?: Types.ObjectId | string }
): Promise<BudgetAlert[]> {
  const year = expense.date.getUTCFullYear();
  const month = expense.date.getUTCMonth() + 1;
  const [status, settings] = await Promise.all([
    getBudgetStatus(userId, year, month),
    FinancialSettings.findOne({ userId }),
  ]);
  if (!status) return [];

  const thresholds = settings?.budgetAlertThresholds?.length
    ? settings.budgetAlertThresholds
    : DEFAULT_BUDGET_ALERT_THRESHOLDS;
  const categoryId = expense.categoryId?.toString();
  const pctBefore = (spent: number, budgeted: number) =>
    budgeted > 0 ? Math.round(((spent - expense.amount) / budgeted) * 100) : 0;

  return getBudgetAlerts(status, thresholds).filter((a) => {
    if (a.scope === 'category' && a.categoryId !== categoryId) return false;
    return pctBefore(a.spent, a.budgeted) < a.threshold;
  });
}

/** Remaining budget spread over the days left in the current month (null for other months). */
function getSafeToSpend(budgetStatus: BudgetStatus | null, year: number, month: number): SafeToSpend | null {
  if (!budgetStatus || budgetStatus.overall.budgeted <= 0) return null;
  const now = new Date();
  if (now.getUTCFullYear() !== year || now.getUTCMonth() + 1 !== month) return null;
  const daysInMonth = utcMonthRange(year, month).to.getUTCDate();
  const daysLeft = daysInMonth - now.getUTCDate() + 1; // including today
  const remaining = budgetStatus.overall.remaining;
  return { perDay: Math.floor(remaining / daysLeft), remaining, daysLeft };
}

/**
 * Spending per day across all days before `periodStart`, counted from the user's first
 * transaction (so the empty start of their first month doesn't dilute it). Null when
 * nothing was recorded before the period.
 */
export async function getPriorDailyAverage(userId: Types.ObjectId, periodStart: Date): Promise<PriorDailyAverage | null> {
  const to = new Date(toUTCDayStart(periodStart).getTime() - 1);
  const { from } = await getAllTimeRange(userId);
  if (from > to) return null;
  const days = Math.round((toUTCDayStart(to).getTime() - from.getTime()) / 86400000) + 1;
  const total = await sumExpenses(userId, from, to);
  return { amount: Math.round(total / days), days, from, to: toUTCDayStart(to) };
}

/**
 * Range covering all of a user's transactions: first transaction day up to the later
 * of today and the last transaction day. Falls back to today when there are none.
 */
export async function getAllTimeRange(userId: Types.ObjectId): Promise<{ from: Date; to: Date }> {
  const match = { userId, deletedAt: { $exists: false } };
  const bounds = { _id: null, first: { $min: '$date' }, last: { $max: '$date' } };
  const [exp, inc] = await Promise.all([
    Expense.aggregate([{ $match: match }, { $group: bounds }]),
    Income.aggregate([{ $match: match }, { $group: bounds }]),
  ]);
  const now = new Date();
  const firsts = [exp[0]?.first, inc[0]?.first].filter(Boolean) as Date[];
  const lasts = [exp[0]?.last, inc[0]?.last, now].filter(Boolean) as Date[];
  const from = firsts.length ? new Date(Math.min(...firsts.map((d) => d.getTime()))) : now;
  const to = new Date(Math.max(...lasts.map((d) => d.getTime())));
  return { from: toUTCDayStart(from), to: toUTCDayEnd(to) };
}

export async function getFinancialDashboard(
  userId: Types.ObjectId,
  from: Date,
  to: Date
): Promise<FinancialDashboard> {
  const now = new Date();
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth() + 1;
  const dayBeforePeriod = new Date(toUTCDayStart(from).getTime() - 1);
  const monthRange = utcMonthRange(year, month);
  const isFullMonth =
    toUTCDayStart(from).getTime() === monthRange.from.getTime() &&
    toUTCDayEnd(to).getTime() === monthRange.to.getTime();

  const [summary, balance, startingBalance, endingBalance, categoryBreakdown, dailySpending, budgetStatus, insights, velocity, settings, priorDailyAverage] =
    await Promise.all([
      getFinancialSummary(userId, from, to),
      getAvailableBalance(userId),
      getAvailableBalance(userId, dayBeforePeriod),
      getAvailableBalance(userId, to),
      getCategoryBreakdown(userId, from, to),
      getDailySpending(userId, from, to),
      isFullMonth ? getBudgetStatus(userId, year, month) : Promise.resolve(null),
      isFullMonth ? generateFinancialInsights(userId, from, to) : Promise.resolve([]),
      isFullMonth ? getSpendingVelocity(userId, year, month) : Promise.resolve(null),
      FinancialSettings.findOne({ userId }),
      getPriorDailyAverage(userId, from),
    ]);

  // Recent transactions (expenses + income combined)
  const [recentExpenses, recentIncomes] = await Promise.all([
    Expense.find({
      userId,
      deletedAt: { $exists: false },
      date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .populate('categoryId', 'name icon color')
      .populate('paymentMethodId', 'name icon')
      .lean(),
    Income.find({
      userId,
      deletedAt: { $exists: false },
      date: { $gte: toUTCDayStart(from), $lte: toUTCDayEnd(to) },
    })
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
  const effectiveTo = to < now ? to : now;
  const days = Math.max(1, differenceInDays(effectiveTo, from) + 1);
  const averageDailySpending = Math.round(summary.totalExpenses / days);
  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  const budgetAlerts = budgetStatus
    ? getBudgetAlerts(
      budgetStatus,
      settings?.budgetAlertThresholds?.length ? settings.budgetAlertThresholds : DEFAULT_BUDGET_ALERT_THRESHOLDS
    )
    : [];

  return {
    period: { from, to, isFullMonth },
    summary,
    balance,
    budgetAlerts,
    safeToSpend: getSafeToSpend(budgetStatus, year, month),
    priorDailyAverage,
    periodBalance: {
      startingBalance: startingBalance.availableBalance,
      endingBalance: endingBalance.availableBalance,
    },
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

export async function getCalendarData(
  userId: Types.ObjectId,
  year: number,
  month: number
): Promise<{ date: string; expenseAmount: number; incomeAmount: number; transactionCount: number }[]> {
  const { from, to } = utcMonthRange(year, month);

  const [expenses, incomes] = await Promise.all([
    Expense.aggregate([
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
    Income.aggregate([
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

  return utcDayKeys(from, to).map((key) => {
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

export async function detectUnusualSpending(
  userId: Types.ObjectId,
  categoryId: Types.ObjectId,
  amount: number
): Promise<{ isUnusual: boolean; averageAmount: number; message?: string }> {
  // Get last 90 days of expenses for this category
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const history = await Expense.find({
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
