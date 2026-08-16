import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, TrendingDown, TrendingUp, ChevronRight, AlertTriangle } from 'lucide-react';
import { financeDashboardApi } from '../../api/finance';
import { format, startOfMonth } from 'date-fns';
import { useCurrency } from '../../store/financeStore';

export default function FinancialSummaryWidget() {
  const { fmt, symbol } = useCurrency();
  const now = new Date();
  const from = format(startOfMonth(now), 'yyyy-MM-dd');
  const to = format(now, 'yyyy-MM-dd');

  const { data, isLoading, error } = useQuery({
    queryKey: ['finance-dashboard', from, to],
    queryFn: () => financeDashboardApi.get({ from, to }),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="card p-5 space-y-3">
        <div className="skeleton h-5 w-36 rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const { summary, balance, budgetStatus, topCategory } = data;

  const budgetPct = budgetStatus?.overall?.percentage ?? 0;
  const budgetColor =
    budgetPct >= 100 ? 'text-red-500' : budgetPct >= 90 ? 'text-orange-500' : budgetPct >= 75 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Wallet size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-bold text-surface-900 dark:text-surface-50">Financial Overview</h3>
        </div>
        <Link
          to="/finance"
          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-0.5"
          id="dashboard-finance-link"
        >
          Full view <ChevronRight size={12} />
        </Link>
      </div>

      {/* Low balance alert */}
      {balance.availableBalance < 10000 && balance.availableBalance >= 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 mb-3">
          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Low balance: {fmt(balance.availableBalance)}
          </p>
        </div>
      )}

      {/* Key metrics grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
          <p className="text-xs text-surface-400 mb-1">Available</p>
          <p className="font-bold text-surface-900 dark:text-surface-50 text-sm">
            {symbol}{(balance.availableBalance / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
          <div className="flex items-center justify-center gap-0.5 mb-1">
            <TrendingUp size={10} className="text-emerald-500" />
            <p className="text-xs text-surface-400">Income</p>
          </div>
          <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            {symbol}{(summary.totalIncome / 1000).toFixed(1)}k
          </p>
        </div>
        <div className="text-center p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
          <div className="flex items-center justify-center gap-0.5 mb-1">
            <TrendingDown size={10} className="text-red-500" />
            <p className="text-xs text-surface-400">Spent</p>
          </div>
          <p className="font-bold text-red-600 dark:text-red-400 text-sm">
            {symbol}{(summary.totalExpenses / 1000).toFixed(1)}k
          </p>
        </div>
      </div>

      {/* Budget bar */}
      {budgetStatus && budgetStatus.overall.budgeted > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-surface-500">Budget used</span>
            <span className={`font-semibold ${budgetColor}`}>{budgetPct}%</span>
          </div>
          <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 90 ? 'bg-orange-500' : budgetPct >= 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, budgetPct)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-surface-400">
            <span>{fmt(budgetStatus.overall.spent)} spent</span>
            <span>{fmt(budgetStatus.overall.budgeted)} budget</span>
          </div>
        </div>
      )}

      {/* Top category */}
      {topCategory && (
        <div className="mt-3 pt-3 border-t border-custom flex items-center justify-between">
          <span className="text-xs text-surface-400">Top expense</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-surface-700 dark:text-surface-300">
            <span>{topCategory.icon}</span>
            <span>{topCategory.name}</span>
            <span className="text-red-500">{fmt(topCategory.amount)}</span>
          </span>
        </div>
      )}
    </motion.div>
  );
}
