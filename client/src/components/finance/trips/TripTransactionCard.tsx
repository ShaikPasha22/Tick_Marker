import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Link as LinkIcon, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TripExpense } from '../../../types';

interface TripTransactionCardProps {
  expense: TripExpense;
  onEdit: (expense: TripExpense) => void;
  onDelete: (expense: TripExpense) => void;
  currency: string;
}

export default function TripTransactionCard({ expense, onEdit, onDelete, currency }: TripTransactionCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPaidByMe = expense.paidByType === 'CURRENT_USER';

  return (
    <div className={`relative flex items-center gap-3 p-3 rounded-xl border transition-colors ${
      isPaidByMe 
        ? 'bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-surface-200 dark:hover:border-surface-600' 
        : 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800 border-l-4 border-l-indigo-400'
    }`}>
      {/* Category Icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
        style={{ backgroundColor: `${typeof expense.categoryId === 'object' ? expense.categoryId.color : '#94a3b8'}20` }}
      >
        <span className="text-lg">{typeof expense.categoryId === 'object' ? expense.categoryId.icon : '📝'}</span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <p className="font-semibold text-surface-900 dark:text-surface-50 truncate text-sm">
            {typeof expense.categoryId === 'object' ? expense.categoryId.name : 'Unknown Category'}
          </p>
          <p className="font-bold text-surface-900 dark:text-surface-50 shrink-0 text-sm">
            {currency} {expense.amount.toLocaleString('en-IN')}
          </p>
        </div>
        
        {expense.description && (
          <p className="text-xs text-surface-500 truncate mt-0.5">{expense.description}</p>
        )}

        {/* Badges Row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {!isPaidByMe && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              <User size={10} /> Paid by {(expense.paidBy as any)?.name || 'Unknown'}
            </span>
          )}
          {expense.includeInMainFinance ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <LinkIcon size={10} /> Main Finance ✓
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400">
              Trip Only
            </span>
          )}
        </div>
      </div>

      {/* Action Menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
        >
          <MoreVertical size={16} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-100 dark:border-surface-700 z-10 overflow-hidden"
            >
              <button
                onClick={() => { setShowMenu(false); onEdit(expense); }}
                className="w-full text-left px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center gap-2"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={() => { setShowMenu(false); onDelete(expense); }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
