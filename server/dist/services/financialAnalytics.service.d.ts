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
export interface BudgetStatus {
    overall: {
        budgeted: number;
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
    period: {
        from: Date;
        to: Date;
    };
    summary: FinancialSummary;
    balance: AvailableBalance;
    budgetStatus: BudgetStatus | null;
    categoryBreakdown: CategoryBreakdownItem[];
    dailySpending: DailySpendingItem[];
    recentTransactions: any[];
    insights: FinancialInsight[];
    velocity: SpendingVelocity | null;
    averageDailySpending: number;
    topCategory: CategoryBreakdownItem | null;
    currencySymbol: string;
}
/**
 * Sum confirmed expenses in a date range.
 */
export declare function sumExpenses(userId: Types.ObjectId, from: Date, to: Date): Promise<number>;
/**
 * Sum confirmed income in a date range.
 */
export declare function sumIncome(userId: Types.ObjectId, from: Date, to: Date): Promise<number>;
export declare function getAvailableBalance(userId: Types.ObjectId): Promise<AvailableBalance>;
export declare function getFinancialSummary(userId: Types.ObjectId, from: Date, to: Date): Promise<FinancialSummary>;
export declare function getCategoryBreakdown(userId: Types.ObjectId, from: Date, to: Date): Promise<CategoryBreakdownItem[]>;
export declare function getDailySpending(userId: Types.ObjectId, from: Date, to: Date): Promise<DailySpendingItem[]>;
export declare function getMonthlyData(userId: Types.ObjectId, months?: number): Promise<MonthlyDataItem[]>;
export declare function getBudgetStatus(userId: Types.ObjectId, year: number, month: number): Promise<BudgetStatus | null>;
export declare function getPaymentMethodBreakdown(userId: Types.ObjectId, from: Date, to: Date): Promise<PaymentMethodBreakdown[]>;
export declare function getSpendingVelocity(userId: Types.ObjectId, year: number, month: number): Promise<SpendingVelocity | null>;
export declare function generateFinancialInsights(userId: Types.ObjectId): Promise<FinancialInsight[]>;
export declare function getFinancialDashboard(userId: Types.ObjectId, from: Date, to: Date): Promise<FinancialDashboard>;
export declare function getCalendarData(userId: Types.ObjectId, year: number, month: number): Promise<{
    date: string;
    expenseAmount: number;
    incomeAmount: number;
    transactionCount: number;
}[]>;
export declare function detectUnusualSpending(userId: Types.ObjectId, categoryId: Types.ObjectId, amount: number): Promise<{
    isUnusual: boolean;
    averageAmount: number;
    message?: string;
}>;
//# sourceMappingURL=financialAnalytics.service.d.ts.map