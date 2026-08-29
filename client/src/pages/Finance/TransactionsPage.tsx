import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Plus, Download, TrendingDown, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { expensesApi, incomeApi, expenseCategoriesApi, financeExportApi } from '../../api/finance';
import { useCurrency, useFinanceStore } from '../../store/financeStore';
import FinanceSubNav from '../../components/finance/FinanceSubNav';
import TransactionCard from '../../components/finance/TransactionCard';
import AddExpenseModal from '../../components/finance/AddExpenseModal';
import AddIncomeModal from '../../components/finance/AddIncomeModal';
import type { Expense, Income, ExpenseCategory } from '../../types';

type ViewMode = 'all' | 'expenses' | 'income';

export default function TransactionsPage() {
  useCurrency();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<ViewMode>('all');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editIncome, setEditIncome] = useState<Income | null>(null);

  const LIMIT = 25;

  const expenseParams = {
    search: search || undefined,
    categoryId: categoryId || undefined,
    status: status || undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    page,
    limit: LIMIT,
  };

  const incomeParams = {
    categoryId: categoryId || undefined,
    status: status || undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    page,
    limit: LIMIT,
  };

  const { data: expenseData, isLoading: expLoading } = useQuery<{ expenses: Expense[]; total: number; pages: number }>({
    queryKey: ['finance-transactions', 'expenses', expenseParams],
    queryFn: () => expensesApi.getAll(expenseParams),
    enabled: mode !== 'income',
  } as any);

  const { data: incomeData, isLoading: incLoading } = useQuery<{ incomes: Income[]; total: number; pages: number }>({
    queryKey: ['finance-transactions', 'income', incomeParams],
    queryFn: () => incomeApi.getAll(incomeParams),
    enabled: mode !== 'expenses',
  } as any);

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expenseCategoriesApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const deleteExpense = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      toast.success('Expense deleted');
    },
  });

  const deleteIncome = useMutation({
    mutationFn: incomeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      toast.success('Income deleted');
    },
  });

  const hasFilters = search || categoryId || status || dateFrom || dateTo;
  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const totalPages = Math.max(
    expenseData?.pages ?? 1,
    Math.ceil((incomeData?.total ?? 0) / LIMIT)
  );

  const isLoading = expLoading || incLoading;

  return (
    <div className="space-y-4">
      <FinanceSubNav />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Transactions</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => financeExportApi.exportCSV()}
            className="btn-ghost text-xs"
            id="transactions-export-btn"
          >
            <Download size={13} /> Export
          </button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowAddIncome(true)}
            className="btn-ghost border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-xs"
            id="transactions-add-income-btn"
          >
            <Plus size={13} /> Income
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowAddExpense(true)}
            className="btn-primary bg-red-500 hover:bg-red-600 text-xs"
            id="transactions-add-expense-btn"
          >
            <Plus size={13} /> Expense
          </motion.button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
        {(['all', 'expenses', 'income'] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
              ${mode === m
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            id={`transactions-tab-${m}`}
          >
            {m === 'income' ? '↑ Income' : m === 'expenses' ? '↓ Expenses' : 'All'}
          </button>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search transactions…"
            id="transactions-search"
            className="input pl-9 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost py-2 px-3 relative ${hasFilters ? 'text-primary-600 dark:text-primary-400' : ''}`}
          id="transactions-filter-btn"
        >
          <Filter size={15} />
          {hasFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary-500" />
          )}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="btn-ghost py-2 px-3 text-red-500">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  id="filter-date-from"
                  className="input py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  id="filter-date-to"
                  className="input py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
                  id="filter-category"
                  className="input py-2 text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  id="filter-status"
                  className="input py-2 text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <div className="card divide-y divide-surface-100 dark:divide-surface-800 overflow-hidden">
          {/* Income entries */}
          {mode !== 'expenses' && incomeData?.incomes?.map((income: Income) => (
            <TransactionCard
              key={income._id}
              transaction={income}
              type="income"
              onClick={() => setEditIncome(income)}
              onDelete={() => {
                if (confirm('Delete this income record?')) deleteIncome.mutate(income._id);
              }}
            />
          ))}

          {/* Expense entries */}
          {mode !== 'income' && expenseData?.expenses?.map((expense: Expense) => (
            <TransactionCard
              key={expense._id}
              transaction={expense}
              type="expense"
              onClick={() => setEditExpense(expense)}
              onDelete={() => {
                if (confirm('Delete this expense?')) deleteExpense.mutate(expense._id);
              }}
            />
          ))}

          {/* Empty state */}
          {(!expenseData?.expenses?.length && !incomeData?.incomes?.length) && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🧾</p>
              <p className="font-semibold text-surface-900 dark:text-surface-100">No transactions found</p>
              <p className="text-sm text-surface-400 mt-1">
                {hasFilters ? 'Try adjusting your filters.' : 'Start by adding an expense or income.'}
              </p>
              {!hasFilters && (
                <button onClick={() => setShowAddExpense(true)} className="btn-primary mt-4">
                  <Plus size={15} /> Add Expense
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost py-1.5 px-3 disabled:opacity-40"
            id="transactions-prev-page"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm text-surface-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-ghost py-1.5 px-3 disabled:opacity-40"
            id="transactions-next-page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {(showAddExpense || editExpense) && (
          <AddExpenseModal
            expense={editExpense}
            onClose={() => { setShowAddExpense(false); setEditExpense(null); }}
          />
        )}
        {(showAddIncome || editIncome) && (
          <AddIncomeModal
            income={editIncome}
            onClose={() => { setShowAddIncome(false); setEditIncome(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
