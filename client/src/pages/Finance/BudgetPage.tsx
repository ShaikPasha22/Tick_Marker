import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PiggyBank, Save, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { budgetApi, expenseCategoriesApi } from '../../api/finance';
import { useCurrency } from '../../store/financeStore';
import FinanceSubNav from '../../components/finance/FinanceSubNav';
import BudgetProgressBar from '../../components/finance/BudgetProgressBar';

export default function BudgetPage() {
  const { fmt } = useCurrency();
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [overallBudget, setOverallBudget] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);

  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['finance-budget', year, month],
    queryFn: () => budgetApi.get({ year, month }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories', 'expense'],
    queryFn: () => expenseCategoriesApi.getAll({ type: 'expense' }),
    staleTime: 5 * 60 * 1000,
  });

  // Sync form with loaded budget
  useEffect(() => {
    if (budgetData?.budget) {
      setOverallBudget(String(budgetData.budget.overall || ''));
      const cbMap: Record<string, string> = {};
      budgetData.budget.categoryBudgets?.forEach((cb) => {
        cbMap[cb.categoryId] = String(cb.amount);
      });
      setCategoryBudgets(cbMap);
    }
  }, [budgetData]);

  const upsertMutation = useMutation({
    mutationFn: (data: any) => budgetApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-budget'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      toast.success('Budget saved!');
    },
    onError: () => toast.error('Failed to save budget'),
  });

  const handleSave = () => {
    const categoryBudgetsPayload = categories
      .filter((c) => categoryBudgets[c._id] && parseFloat(categoryBudgets[c._id]) > 0)
      .map((c) => ({ categoryId: c._id, amount: parseFloat(categoryBudgets[c._id]) }));

    const sumCategoryBudgets = categoryBudgetsPayload.reduce((s, cb) => s + cb.amount, 0);
    const overall = parseFloat(overallBudget) || sumCategoryBudgets;

    upsertMutation.mutate({ year, month, overall, categoryBudgets: categoryBudgetsPayload });
  };

  const status = budgetData?.status;
  const totalCatBudget = Object.values(categoryBudgets).reduce(
    (s, v) => s + (parseFloat(v) || 0), 0
  );
  const budgetTotal = parseFloat(overallBudget) || totalCatBudget;
  const unallocated = Math.max(0, budgetTotal - totalCatBudget);

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  const displayedCategories = showAll ? categories : categories.slice(0, 8);

  return (
    <div className="space-y-5">
      <FinanceSubNav />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank size={20} className="text-purple-500" />
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Budget</h2>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="input py-1.5 text-xs w-28"
            id="budget-month-select"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(year, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="input py-1.5 text-xs w-20"
            id="budget-year-select"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Current status */}
      {status && !isLoading && (
        <div className="card p-5">
          <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4">
            {monthName} {year} — Status
          </h3>

          {/* Overall bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">Overall Budget</span>
              <span className={`text-sm font-bold ${status.overall.percentage >= 100 ? 'text-red-500' : status.overall.percentage >= 90 ? 'text-orange-500' : 'text-emerald-500'}`}>
                {status.overall.percentage}%
              </span>
            </div>
            <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden mb-1">
              <motion.div
                className={`h-full rounded-full ${status.overall.percentage >= 100 ? 'bg-red-500' : status.overall.percentage >= 90 ? 'bg-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, status.overall.percentage)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <div className="flex justify-between text-xs text-surface-400">
              <span>Spent: {fmt(status.overall.spent)}</span>
              <span>Remaining: {fmt(status.overall.remaining)}</span>
              <span>Budget: {fmt(status.overall.budgeted)}</span>
            </div>
          </div>

          {/* Category status */}
          {status.categories.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-surface-600 dark:text-surface-400">By Category</h4>
              {status.categories.map((item) => (
                <BudgetProgressBar key={item.categoryId} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      <div className="card p-5 space-y-5">
        <h3 className="font-bold text-surface-900 dark:text-surface-50">
          Set Budget — {monthName} {year}
        </h3>

        {/* Overall budget */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
            Overall Monthly Budget
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-surface-400">₹</span>
            <input
              type="number"
              value={overallBudget}
              onChange={(e) => setOverallBudget(e.target.value)}
              id="budget-overall-input"
              className="input pl-9 text-lg font-bold h-12"
              placeholder="e.g. 40000"
            />
          </div>
          {totalCatBudget > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: budgetTotal > 0 ? `${Math.min(100, (totalCatBudget / budgetTotal) * 100)}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-surface-400 shrink-0">
                {fmt(totalCatBudget)} allocated · {fmt(unallocated)} unallocated
              </span>
            </div>
          )}
        </div>

        {/* Category budgets */}
        <div>
          <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
            Per-Category Budgets (optional)
          </h4>
          <div className="space-y-3">
            {displayedCategories.map((cat) => (
              <div key={cat._id} className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  {cat.icon}
                </span>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300 flex-1 min-w-0 truncate">
                  {cat.name}
                </span>
                <div className="relative w-28 shrink-0">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-surface-400">₹</span>
                  <input
                    type="number"
                    value={categoryBudgets[cat._id] ?? ''}
                    onChange={(e) =>
                      setCategoryBudgets((prev) => ({
                        ...prev,
                        [cat._id]: e.target.value,
                      }))
                    }
                    id={`budget-cat-${cat.name.toLowerCase().replace(/\s/g, '-')}`}
                    className="input pl-7 py-1.5 text-sm w-full"
                    placeholder="0"
                    min={0}
                  />
                </div>
              </div>
            ))}
          </div>

          {categories.length > 8 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="btn-ghost mt-3 text-xs w-full justify-center"
            >
              {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {showAll ? 'Show less' : `Show ${categories.length - 8} more categories`}
            </button>
          )}
        </div>

        {/* Tip */}
        {!overallBudget && totalCatBudget === 0 && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Set an overall monthly budget or fill in per-category amounts. If both are set, the overall budget takes precedence.
            </p>
          </div>
        )}

        {/* Save */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={upsertMutation.isPending}
          className="btn-primary w-full justify-center"
          id="budget-save-btn"
        >
          <Save size={15} />
          {upsertMutation.isPending ? 'Saving…' : `Save Budget for ${monthName} ${year}`}
        </motion.button>
      </div>
    </div>
  );
}
