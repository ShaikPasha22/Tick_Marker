import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Trash2, ArrowUpRight, ArrowDownRight, RotateCcw } from 'lucide-react';
import type { Expense, Income, ExpenseCategory, PaymentMethod } from '../../types';
import { useCurrency } from '../../store/financeStore';

type TransactionType = 'expense' | 'income';

interface TransactionCardProps {
  transaction: Expense | Income;
  type: TransactionType;
  onDelete?: () => void;
  onClick?: () => void;
  compact?: boolean;
}

function getCategory(tx: Expense | Income): ExpenseCategory | null {
  const cat = tx.categoryId;
  if (cat && typeof cat === 'object') return cat as ExpenseCategory;
  return null;
}

function getPaymentMethod(tx: Expense): PaymentMethod | null {
  const pm = tx.paymentMethodId;
  if (pm && typeof pm === 'object') return pm as PaymentMethod;
  return null;
}

export default function TransactionCard({
  transaction,
  type,
  onDelete,
  onClick,
  compact = false,
}: TransactionCardProps) {
  const { fmt } = useCurrency();
  const isExpense = type === 'expense';
  const expense = transaction as Expense;
  const isRefund = isExpense && expense.isRefund;

  const category = getCategory(transaction);
  const paymentMethod = isExpense ? getPaymentMethod(expense) : null;

  const amountColor = isRefund
    ? 'text-blue-600 dark:text-blue-400'
    : isExpense
    ? 'text-red-600 dark:text-red-400'
    : 'text-emerald-600 dark:text-emerald-400';

  const AmountIcon = isRefund ? RotateCcw : isExpense ? ArrowDownRight : ArrowUpRight;

  const statusBadgeColor =
    transaction.status === 'confirmed'
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
      : transaction.status === 'pending'
      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
      : 'bg-surface-100 dark:bg-surface-800 text-surface-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 
                  transition-colors cursor-pointer group ${compact ? 'py-2' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Category icon */}
      <div
        className={`${compact ? 'w-9 h-9' : 'w-10 h-10'} rounded-xl flex items-center justify-center shrink-0 text-base`}
        style={{ backgroundColor: `${category?.color ?? '#71717a'}20` }}
      >
        {category?.icon ?? (isExpense ? '📦' : '💰')}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
              {transaction.description ?? category?.name ?? (isExpense ? 'Expense' : 'Income')}
              {isRefund && (
                <span className="ml-1.5 text-xs font-normal text-blue-500">(Refund)</span>
              )}
            </p>
            {!compact && (
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {category && (
                  <span className="text-xs text-surface-400">{category.name}</span>
                )}
                {paymentMethod && (
                  <span className="text-xs text-surface-400">
                    {paymentMethod.icon} {paymentMethod.name}
                  </span>
                )}
                {transaction.status !== 'confirmed' && (
                  <span className={`badge text-[10px] ${statusBadgeColor}`}>
                    {transaction.status}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className={`flex items-center gap-0.5 justify-end font-bold text-sm ${amountColor}`}>
              <AmountIcon size={12} />
              {fmt(transaction.amount)}
            </div>
            <p className="text-xs text-surface-400 mt-0.5">
              {format(new Date(transaction.date), 'MMM d')}
            </p>
          </div>
        </div>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20
                     text-surface-400 hover:text-red-500 transition-all shrink-0"
          aria-label="Delete transaction"
        >
          <Trash2 size={13} />
        </button>
      )}
    </motion.div>
  );
}
