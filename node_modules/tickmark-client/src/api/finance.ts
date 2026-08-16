import api from './axios';
import type {
  FinancialDashboard, FinancialSettings, Expense, Income, Budget,
  ExpenseCategory, ExpenseTag, PaymentMethod, CategoryBreakdownItem,
  DailySpendingItem, MonthlyDataItem, BudgetStatus, PaymentMethodBreakdown,
  SpendingVelocity, FinancialInsight, CalendarDay,
} from '../types';

const fmt = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

// ─── Settings ─────────────────────────────────────────────────────────────────

export const financeSettingsApi = {
  get: () => api.get<{ settings: FinancialSettings }>('/finance/settings').then((r) => r.data.settings),
  update: (data: Partial<FinancialSettings>) =>
    api.patch<{ settings: FinancialSettings }>('/finance/settings', data).then((r) => r.data.settings),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const financeDashboardApi = {
  get: (params?: { from?: string; to?: string }) =>
    api.get<FinancialDashboard>(`/finance/dashboard?${fmt(params ?? {})}`).then((r) => r.data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const financeAnalyticsApi = {
  getSummary: (params?: { from?: string; to?: string }) =>
    api
      .get<{ summary: any; balance: any }>(`/finance/analytics/summary?${fmt(params ?? {})}`)
      .then((r) => r.data),

  getCategories: (params?: { from?: string; to?: string }) =>
    api
      .get<{ breakdown: CategoryBreakdownItem[] }>(`/finance/analytics/categories?${fmt(params ?? {})}`)
      .then((r) => r.data.breakdown),

  getDaily: (params?: { from?: string; to?: string }) =>
    api
      .get<{ daily: DailySpendingItem[] }>(`/finance/analytics/daily?${fmt(params ?? {})}`)
      .then((r) => r.data.daily),

  getMonthly: (months?: number) =>
    api
      .get<{ monthly: MonthlyDataItem[] }>(`/finance/analytics/monthly?months=${months ?? 12}`)
      .then((r) => r.data.monthly),

  getPaymentMethods: (params?: { from?: string; to?: string }) =>
    api
      .get<{ breakdown: PaymentMethodBreakdown[] }>(`/finance/analytics/payment-methods?${fmt(params ?? {})}`)
      .then((r) => r.data.breakdown),

  getInsights: () =>
    api.get<{ insights: FinancialInsight[] }>('/finance/analytics/insights').then((r) => r.data.insights),

  getVelocity: (params?: { year?: number; month?: number }) =>
    api
      .get<{ velocity: SpendingVelocity | null }>(`/finance/analytics/velocity?${fmt(params ?? {})}`)
      .then((r) => r.data.velocity),
};

// ─── Calendar ─────────────────────────────────────────────────────────────────

export const financeCalendarApi = {
  get: (year: number, month: number) =>
    api
      .get<{ calendar: CalendarDay[]; year: number; month: number }>(`/finance/calendar?year=${year}&month=${month}`)
      .then((r) => r.data),
};

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const expensesApi = {
  getAll: (params?: {
    from?: string; to?: string; categoryId?: string; status?: string;
    paymentMethodId?: string; search?: string; page?: number; limit?: number;
  }) =>
    api
      .get<{ expenses: Expense[]; total: number; page: number; limit: number; pages: number }>(
        `/finance/expenses?${fmt(params ?? {})}`
      )
      .then((r) => r.data),

  create: (data: Partial<Expense> & { categoryId: string }) =>
    api.post<{ expense: Expense; unusualWarning: any }>('/finance/expenses', data).then((r) => r.data),

  get: (id: string) =>
    api.get<{ expense: Expense }>(`/finance/expenses/${id}`).then((r) => r.data.expense),

  update: (id: string, data: Partial<Expense>) =>
    api.patch<{ expense: Expense }>(`/finance/expenses/${id}`, data).then((r) => r.data.expense),

  delete: (id: string) =>
    api.delete(`/finance/expenses/${id}`).then((r) => r.data),

  createRefund: (id: string, data: { amount?: number; date?: string; description?: string }) =>
    api.post<{ refund: Expense }>(`/finance/expenses/${id}/refund`, data).then((r) => r.data.refund),
};

// ─── Income ───────────────────────────────────────────────────────────────────

export const incomeApi = {
  getAll: (params?: { from?: string; to?: string; categoryId?: string; status?: string; page?: number }) =>
    api
      .get<{ incomes: Income[]; total: number }>(`/finance/income?${fmt(params ?? {})}`)
      .then((r) => r.data),

  create: (data: Partial<Income> & { categoryId: string }) =>
    api.post<{ income: Income }>('/finance/income', data).then((r) => r.data.income),

  update: (id: string, data: Partial<Income>) =>
    api.patch<{ income: Income }>(`/finance/income/${id}`, data).then((r) => r.data.income),

  delete: (id: string) => api.delete(`/finance/income/${id}`).then((r) => r.data),
};

// ─── Budget ───────────────────────────────────────────────────────────────────

export const budgetApi = {
  get: (params?: { year?: number; month?: number }) =>
    api
      .get<{ budget: Budget | null; status: BudgetStatus | null }>(`/finance/budget?${fmt(params ?? {})}`)
      .then((r) => r.data),

  upsert: (data: { year: number; month: number; overall: number; categoryBudgets: any[] }) =>
    api.put<{ budget: Budget; status: BudgetStatus | null }>('/finance/budget', data).then((r) => r.data),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const expenseCategoriesApi = {
  getAll: (params?: { type?: string; status?: string }) =>
    api
      .get<{ categories: ExpenseCategory[] }>(`/finance/categories?${fmt(params ?? {})}`)
      .then((r) => r.data.categories),

  create: (data: Partial<ExpenseCategory> & { name: string; type: string }) =>
    api.post<{ category: ExpenseCategory }>('/finance/categories', data).then((r) => r.data.category),

  update: (id: string, data: Partial<ExpenseCategory>) =>
    api.patch<{ category: ExpenseCategory }>(`/finance/categories/${id}`, data).then((r) => r.data.category),

  archive: (id: string) =>
    api.delete<{ category: ExpenseCategory }>(`/finance/categories/${id}`).then((r) => r.data.category),
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const expenseTagsApi = {
  getAll: () => api.get<{ tags: ExpenseTag[] }>('/finance/tags').then((r) => r.data.tags),
  create: (data: { name: string; color?: string }) =>
    api.post<{ tag: ExpenseTag }>('/finance/tags', data).then((r) => r.data.tag),
  delete: (id: string) => api.delete(`/finance/tags/${id}`).then((r) => r.data),
};

// ─── Payment Methods ──────────────────────────────────────────────────────────

export const paymentMethodsApi = {
  getAll: () =>
    api.get<{ methods: PaymentMethod[] }>('/finance/payment-methods').then((r) => r.data.methods),
  create: (data: { name: string; icon?: string }) =>
    api.post<{ method: PaymentMethod }>('/finance/payment-methods', data).then((r) => r.data.method),
  update: (id: string, data: Partial<PaymentMethod>) =>
    api.patch<{ method: PaymentMethod }>(`/finance/payment-methods/${id}`, data).then((r) => r.data.method),
  delete: (id: string) => api.delete(`/finance/payment-methods/${id}`).then((r) => r.data),
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const financeExportApi = {
  exportJSON: (params?: { from?: string; to?: string }) =>
    api
      .get(`/finance/export?format=json&${fmt(params ?? {})}`)
      .then((r) => r.data),

  exportCSV: async (params?: { from?: string; to?: string }) => {
    const response = await api.get(`/finance/export?format=csv&${fmt(params ?? {})}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tickmark-finance-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
