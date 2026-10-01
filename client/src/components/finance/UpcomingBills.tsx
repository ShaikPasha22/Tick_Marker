import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarClock, Check, AlertTriangle } from 'lucide-react';
import { recurringApi } from '../../api/finance';
import { useCurrency } from '../../store/financeStore';
import { RECURRING_QUERY_KEY, daysUntilDue, dueLabel, useRecurringActions } from './recurring';
import type { ExpenseCategory } from '../../types';

const WINDOW_DAYS = 30;

/** Bills and income due in the next 30 days (overdue first), with one-click "Mark paid" */
export default function UpcomingBills() {
  const { fmt } = useCurrency();
  const { pay } = useRecurringActions();
  const { data: items = [], isLoading } = useQuery({ queryKey: RECURRING_QUERY_KEY, queryFn: recurringApi.getAll });

  if (isLoading) return null;

  const upcoming = items
    .filter((r) => r.isActive && daysUntilDue(r) <= WINDOW_DAYS)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  const billsTotal = upcoming.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-primary-500" />
          <h3 className="font-bold text-surface-900 dark:text-surface-50">Upcoming</h3>
          {billsTotal > 0 && <span className="text-xs text-surface-400">{fmt(billsTotal)} in bills · next {WINDOW_DAYS} days</span>}
        </div>
        <Link to="/finance/recurring" className="text-xs text-primary-600 dark:text-primary-400">
          {items.length ? 'Manage →' : 'Add bills →'}
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-surface-400">
          {items.length
            ? `Nothing due in the next ${WINDOW_DAYS} days.`
            : 'Add rent, subscriptions or your salary as recurring entries to see them here before they are due.'}
        </p>
      ) : (
        <div className="space-y-1">
          {upcoming.slice(0, 6).map((r) => {
            const cat = typeof r.categoryId === 'object' ? (r.categoryId as ExpenseCategory) : null;
            const overdue = daysUntilDue(r) < 0;
            return (
              <div key={r._id} className="flex items-center gap-3 py-1.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0" style={{ backgroundColor: `${cat?.color ?? '#6366f1'}20` }}>
                  {cat?.icon ?? '🔁'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">{r.description}</p>
                  <p className={`text-xs ${overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-surface-400'}`}>
                    {overdue && <AlertTriangle size={11} className="inline -mt-0.5 mr-0.5" />}{dueLabel(r)}
                  </p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${r.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-900 dark:text-surface-50'}`}>
                  {r.type === 'income' ? '+' : ''}{fmt(r.amount)}
                </span>
                <button
                  onClick={() => pay.mutate(r)}
                  disabled={pay.isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-40"
                  id={`upcoming-pay-${r._id}`}
                >
                  <Check size={12} /> {r.type === 'income' ? 'Received' : 'Paid'}
                </button>
              </div>
            );
          })}
          {upcoming.length > 6 && (
            <Link to="/finance/recurring" className="block text-xs text-primary-600 dark:text-primary-400 pt-1">
              +{upcoming.length - 6} more →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
