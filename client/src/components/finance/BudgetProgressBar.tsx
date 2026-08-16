import { motion } from 'framer-motion';
import type { BudgetStatusItem } from '../../types';
import { useCurrency } from '../../store/financeStore';

interface BudgetProgressBarProps {
  item: BudgetStatusItem;
  showAmounts?: boolean;
}

export default function BudgetProgressBar({ item, showAmounts = true }: BudgetProgressBarProps) {
  const { fmt } = useCurrency();
  const pct = Math.min(100, item.percentage);

  const barColor =
    item.isOverBudget
      ? 'bg-red-500'
      : item.percentage >= 90
      ? 'bg-orange-500'
      : item.percentage >= 75
      ? 'bg-amber-500'
      : 'bg-gradient-to-r from-primary-500 to-purple-500';

  const textColor =
    item.isOverBudget
      ? 'text-red-600 dark:text-red-400'
      : item.percentage >= 90
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-surface-700 dark:text-surface-300';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm"
            style={{ backgroundColor: `${item.color}20` }}
          >
            {item.icon}
          </span>
          <span className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate">
            {item.name}
          </span>
          {item.isOverBudget && (
            <span className="badge bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px]">
              Over
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className={`text-sm font-semibold ${textColor}`}>{item.percentage}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {showAmounts && (
        <div className="flex items-center justify-between text-xs text-surface-400">
          <span>Spent: {fmt(item.spent)}</span>
          <span>Budget: {fmt(item.budgeted)}</span>
        </div>
      )}
    </div>
  );
}
