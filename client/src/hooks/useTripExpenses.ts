import { useQuery } from '@tanstack/react-query';
import { tripApi } from '../api/trip';
import type { TripExpense } from '../types';

export interface DailyTripExpenses {
  date: string; // ISO date string (YYYY-MM-DD)
  total: number;
  expenses: TripExpense[];
}

export function useTripExpenses(tripId: string | undefined, filters?: any) {
  return useQuery({
    queryKey: ['tripExpenses', tripId, filters],
    queryFn: async () => {
      if (!tripId) return [];
      
      const res = await tripApi.listExpenses({ tripId, filters });
      return res.expenses || [];
    },
    select: (expenses) => {
      // Group by date
      const grouped = expenses.reduce((acc: Record<string, DailyTripExpenses>, expense) => {
        const dateStr = new Date(expense.date).toISOString().split('T')[0];
        
        if (!acc[dateStr]) {
          acc[dateStr] = { date: dateStr, total: 0, expenses: [] };
        }
        
        acc[dateStr].expenses.push(expense);
        acc[dateStr].total += expense.amount;
        return acc;
      }, {});

      // Sort dates descending (newest first)
      return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!tripId,
  });
}
