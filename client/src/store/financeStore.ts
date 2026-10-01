import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, startOfMonth, endOfMonth } from 'date-fns';


export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

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

  // Period selection
  periodType: PeriodType;
  dateRange: DateRange;
  setPeriodType: (type: PeriodType) => void;
  setDateRange: (range: DateRange) => void;
  setCustomRange: (from: string, to: string) => void;

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

function getDefaultRange(type: PeriodType): DateRange {
  const now = new Date();
  switch (type) {
    case 'day':
      return { from: format(now, 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1); // Monday
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: format(start, 'yyyy-MM-dd'), to: format(end, 'yyyy-MM-dd') };
    }
    case 'month':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(now, 'yyyy-MM-dd'),
      };
    case 'year':
      return {
        from: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
        to: format(now, 'yyyy-MM-dd'),
      };
    default:
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(now, 'yyyy-MM-dd'),
      };
  }
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

      periodType: 'month',
      dateRange: getDefaultRange('month'),
      filter: { page: 1 },
      showAddExpense: false,
      showAddIncome: false,
      currencySymbol: '₹',

      setPeriodType: (type) => {
        set({ periodType: type, dateRange: getDefaultRange(type) });
      },

      setDateRange: (range) => set({ dateRange: range }),

      setCustomRange: (from, to) => {
        set({ periodType: 'custom', dateRange: { from, to } });
      },

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
          periodType: 'month',
          dateRange: getDefaultRange('month'),
          filter: { page: 1 },
          showAddExpense: false,
          showAddIncome: false,
          currencySymbol: '₹',
        }),
    }),
    {
      name: 'tickmark-finance',
      partialize: (s) => ({
        periodType: s.periodType,
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
