import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, parseISO } from 'date-fns';

/** Range shown on the finance Overview */
export type OverviewPeriod = 'week' | 'month' | 'all' | 'custom';

export interface DateRange {
  from: string;
  to: string;
}

export interface TransactionFilter {
  categoryId?: string;
  paymentMethodId?: string;
  status?: string;
  search?: string;
  page: number;
}

interface FinanceState {
  // Month shown across the finance pages (month is 1-12)
  selectedYear: number;
  selectedMonth: number;
  setSelectedMonth: (year: number, month: number) => void;
  shiftSelectedMonth: (delta: number) => void;

  // Overview range: the month above, a week (any day inside it), all time, or custom dates
  overviewPeriod: OverviewPeriod;
  setOverviewPeriod: (period: OverviewPeriod) => void;
  weekAnchor: string;
  shiftWeek: (delta: number) => void;
  resetWeek: () => void;
  customRange: DateRange;
  setCustomRange: (range: DateRange) => void;

  // Filter state
  filter: TransactionFilter;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  resetFilter: () => void;

  // Quick-add state
  showAddExpense: boolean;
  showAddIncome: boolean;
  setShowAddExpense: (v: boolean) => void;
  setShowAddIncome: (v: boolean) => void;

  // Currency symbol (cached from settings)
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;

  // Reset per-user state when the signed-in account changes
  resetForNewSession: () => void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

/** "yyyy-MM-dd" bounds of the week containing `anchor` (weekStartsOn: 0 = Sunday, 1 = Monday) */
export function getWeekRange(anchor: string, weekStartsOn: 0 | 1): DateRange {
  const day = parseISO(anchor);
  return {
    from: format(startOfWeek(day, { weekStartsOn }), 'yyyy-MM-dd'),
    to: format(endOfWeek(day, { weekStartsOn }), 'yyyy-MM-dd'),
  };
}

/** Default date for a new entry in a range: today if inside it, else the range's first day */
export function getDefaultEntryDateInRange(range: DateRange): string {
  const now = today();
  return now >= range.from && now <= range.to ? now : range.from;
}

/** "yyyy-MM-dd" bounds of a calendar month (month is 1-12) */
export function getMonthRange(year: number, month: number): DateRange {
  const first = new Date(year, month - 1, 1);
  return { from: format(first, 'yyyy-MM-dd'), to: format(endOfMonth(first), 'yyyy-MM-dd') };
}

/** Default date for a new entry: today if it falls in the month, else the 1st of that month */
export function getDefaultEntryDate(year: number, month: number): string {
  const now = new Date();
  if (now.getFullYear() === year && now.getMonth() + 1 === month) return format(now, 'yyyy-MM-dd');
  return format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
}

const currentMonth = () => ({ selectedYear: new Date().getFullYear(), selectedMonth: new Date().getMonth() + 1 });

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      ...currentMonth(),

      setSelectedMonth: (year, month) => set({ selectedYear: year, selectedMonth: month }),

      shiftSelectedMonth: (delta) =>
        set((s) => {
          const d = new Date(s.selectedYear, s.selectedMonth - 1 + delta, 1);
          return { selectedYear: d.getFullYear(), selectedMonth: d.getMonth() + 1 };
        }),

      overviewPeriod: 'month',
      weekAnchor: today(),
      customRange: { from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: today() },
      filter: { page: 1 },
      showAddExpense: false,
      showAddIncome: false,
      currencySymbol: '₹',

      setOverviewPeriod: (period) => set({ overviewPeriod: period }),

      shiftWeek: (delta) =>
        set((s) => ({ weekAnchor: format(addWeeks(parseISO(s.weekAnchor), delta), 'yyyy-MM-dd') })),

      resetWeek: () => set({ weekAnchor: today() }),

      setCustomRange: (range) => set({ customRange: range }),

      setFilter: (partial) => {
        set((s) => ({ filter: { ...s.filter, ...partial, page: partial.page ?? 1 } }));
      },

      resetFilter: () => set({ filter: { page: 1 } }),

      setShowAddExpense: (v) => set({ showAddExpense: v }),
      setShowAddIncome: (v) => set({ showAddIncome: v }),

      setCurrencySymbol: (symbol) => set({ currencySymbol: symbol }),

      resetForNewSession: () =>
        set({
          ...currentMonth(),
          overviewPeriod: 'month',
          weekAnchor: today(),
          customRange: { from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: today() },
          filter: { page: 1 },
          showAddExpense: false,
          showAddIncome: false,
          currencySymbol: '₹',
        }),
    }),
    {
      name: 'tickmark-finance',
      partialize: (s) => ({
        currencySymbol: s.currencySymbol,
      }),
    }
  )
);

// Utility hook for formatted currency
export function useCurrency() {
  const symbol = useFinanceStore((s) => s.currencySymbol);
  const fmt = (amount: number, decimals = 0) => {
    return `${symbol}${amount.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };
  return { symbol, fmt };
}
