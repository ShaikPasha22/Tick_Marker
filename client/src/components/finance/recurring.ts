import { useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { recurringApi, invalidateFinanceQueries } from '../../api/finance';
import { useCurrency } from '../../store/financeStore';
import { notifyBudgetAlerts } from './budgetAlertToast';
import type { RecurringFrequency, RecurringTransaction } from '../../types';

export const RECURRING_QUERY_KEY = ['finance-recurring'];

export const FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

/** Average cost per month, to compare bills on different cycles */
export function monthlyEquivalent(r: Pick<RecurringTransaction, 'amount' | 'frequency'>): number {
  switch (r.frequency) {
    case 'daily': return (r.amount * 365) / 12;
    case 'weekly': return (r.amount * 52) / 12;
    case 'monthly': return r.amount;
    case 'yearly': return r.amount / 12;
  }
}

/** Due date as a calendar day ("yyyy-MM-dd"); stored as UTC midnight */
export const dueDay = (r: RecurringTransaction) => r.nextDueDate.slice(0, 10);

/** Days until due: negative when overdue, 0 today */
export function daysUntilDue(r: RecurringTransaction): number {
  return differenceInCalendarDays(parseISO(dueDay(r)), new Date());
}

/** "Overdue by 3 days", "Due today", "Due tomorrow", "Due in 5 days" or "Due 12 Nov" */
export function dueLabel(r: RecurringTransaction): string {
  const days = daysUntilDue(r);
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 14) return `Due in ${days} days`;
  return `Due ${format(parseISO(dueDay(r)), 'd MMM')}`;
}

/** Mark paid / Skip, refreshing every finance view and warning about budgets */
export function useRecurringActions() {
  const queryClient = useQueryClient();
  const { fmt } = useCurrency();

  const pay = useMutation({
    mutationFn: (r: RecurringTransaction) => recurringApi.pay(r._id),
    onSuccess: (result, r) => {
      invalidateFinanceQueries(queryClient);
      toast.success(`${r.description} recorded · next due ${format(parseISO(dueDay(result.recurring)), 'd MMM')}`);
      notifyBudgetAlerts(result.budgetAlerts, fmt);
    },
    onError: () => toast.error('Could not record this payment'),
  });

  const skip = useMutation({
    mutationFn: (r: RecurringTransaction) => recurringApi.skip(r._id),
    onSuccess: (next, r) => {
      invalidateFinanceQueries(queryClient);
      toast.success(`${r.description} skipped · next due ${format(parseISO(dueDay(next)), 'd MMM')}`);
    },
    onError: () => toast.error('Could not skip this payment'),
  });

  return { pay, skip };
}
