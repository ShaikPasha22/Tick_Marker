import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, startOfMonth } from 'date-fns';


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

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({

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
