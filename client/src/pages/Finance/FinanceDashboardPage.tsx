import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, BarChart2,
  Plus, Minus, AlertCircle, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { financeDashboardApi, expensesApi, incomeApi, invalidateFinanceQueries } from '../../api/finance';
import {
  useCurrency, useFinanceStore, getMonthRange, getWeekRange, getDefaultEntryDateInRange, type DateRange,
} from '../../store/financeStore';
import { useAuthStore } from '../../store/authStore';
import AddExpenseModal from '../../components/finance/AddExpenseModal';
import AddIncomeModal from '../../components/finance/AddIncomeModal';
import TransactionCard from '../../components/finance/TransactionCard';
import BudgetProgressBar from '../../components/finance/BudgetProgressBar';
import FinanceSubNav from '../../components/finance/FinanceSubNav';
import OverviewPeriodPicker from '../../components/finance/OverviewPeriodPicker';
import type { FinancialInsight, Expense, Income, DailySpendingItem } from '../../types';

const dayLabel = (d: string) => format(parseISO(d), 'd MMM yyyy');

/** "1 – 7 Oct 2026", "28 Sep – 4 Oct 2026" or "15 Dec 2025 – 10 Jan 2026" */
function rangeLabel({ from, to }: DateRange): string {
  if (from === to) return dayLabel(from);
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return `${format(parseISO(from), sameYear ? 'd MMM' : 'd MMM yyyy')} – ${dayLabel(to)}`;
}

/** Spending chart points: per day, or per month for ranges longer than ~2 months */
function toChartData(daily: DailySpendingItem[]) {
  if (daily.length <= 62) {
    return { byMonth: false, points: daily.map((d) => ({ label: format(parseISO(d.date), 'd MMM'), amount: d.amount })) };
  }
  const months = new Map<string, number>();
  daily.forEach((d) => months.set(d.date.slice(0, 7), (months.get(d.date.slice(0, 7)) ?? 0) + d.amount));
  return {
    byMonth: true,
    points: [...months].map(([key, amount]) => ({ label: format(parseISO(`${key}-01`), 'MMM yy'), amount })),
  };
}

function MetricCard({
  label, value, sub, icon: Icon, iconColor, bgColor, trend, highlight
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconColor: string; bgColor: string;
  trend?: { value: number; label: string };
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-4 ${highlight ? 'ring-2 ring-emerald-500/30' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center`} style={{ backgroundColor: bgColor }}>
          <Icon size={17} style={{ color: iconColor }} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.value >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-surface-900 dark:text-surface-50 leading-tight">{value}</p>
      <p className="text-xs font-medium text-surface-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function InsightCard({ insight }: { insight: FinancialInsight }) {
  const colors = {
    info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    warning: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    success: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
    alert: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${colors[insight.type]}`}
    >
      <span className="text-xl shrink-0 mt-0.5">{insight.icon}</span>
      <div>
        <p className="text-xs font-bold mb-0.5">{insight.title}</p>
        <p className="text-xs leading-relaxed">{insight.message}</p>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label, symbol }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-custom rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-surface-700 dark:text-surface-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {symbol}{p.value?.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

export default function FinanceDashboardPage() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const {
    selectedYear: year, selectedMonth: month, overviewPeriod: period, weekAnchor, customRange,
  } = useFinanceStore();
  const weekStartsOn = useAuthStore((s) => s.user?.weekStartDay ?? 1);
  const { fmt, symbol } = useCurrency();
  const queryClient = useQueryClient();

  // Resolve the selected period to dates ('all' is resolved by the server)
  const range: DateRange | null =
    period === 'month' ? getMonthRange(year, month)
    : period === 'week' ? getWeekRange(weekAnchor, weekStartsOn)
    : period === 'custom' ? customRange
    : null;
  const rangeInvalid = period === 'custom' && (!customRange.from || !customRange.to || customRange.from > customRange.to);

  const { data, isPlaceholderData } = useQuery({
    queryKey: range ? ['finance-dashboard', range.from, range.to] : ['finance-dashboard', 'all'],
    queryFn: () => financeDashboardApi.get(range ?? { all: true }),
    enabled: !rangeInvalid,
    staleTime: 60 * 1000,
    // Keep the previous figures on screen (dimmed) while the next range loads
    placeholderData: keepPreviousData,
  });

  const allTimeFrom = period === 'all' && data ? data.period.from.slice(0, 10) : null;
  const periodLabel =
    period === 'month' ? format(new Date(year, month - 1, 1), 'MMMM yyyy')
    : period === 'all' ? 'All time'
    : rangeLabel(range!);
  const subtitle = allTimeFrom ? `All time · since ${dayLabel(allTimeFrom)}` : `${periodLabel} overview`;
  const balanceTitle =
    period === 'month' ? `Balance at end of ${format(new Date(year, month - 1, 1), 'MMMM')}`
    : period === 'week' ? 'Balance at end of week'
    : period === 'custom' ? `Balance on ${dayLabel(customRange.to)}`
    : 'Current balance';
  const startLabel =
    period === 'month' ? 'Start of month'
    : period === 'week' ? 'Start of week'
    : period === 'custom' ? 'Start of period'
    : 'Opening balance';
  const newEntryDate = range && !rangeInvalid ? getDefaultEntryDateInRange(range) : format(new Date(), 'yyyy-MM-dd');

  const deleteExpenseMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
      toast.success('Expense deleted');
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: incomeApi.delete,
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
      toast.success('Income deleted');
    },
  });

  const header = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Finance</h2>
          <p className="text-sm text-surface-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowAddIncome(true)}
            className="btn-ghost border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            id="finance-add-income-btn"
          >
            <Plus size={15} />
            Income
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowAddExpense(true)}
            className="btn-primary bg-red-500 hover:bg-red-600"
            id="finance-add-expense-btn"
          >
            <Minus size={15} />
            Expense
          </motion.button>
        </div>
      </div>
      <OverviewPeriodPicker />
    </div>
  );

  const modals = (
    <AnimatePresence>
      {(showAddExpense || editExpense) && (
        <AddExpenseModal
          expense={editExpense}
          onClose={() => { setShowAddExpense(false); setEditExpense(null); }}
          prefilledDate={newEntryDate}
        />
      )}
      {(showAddIncome || editIncome) && (
        <AddIncomeModal
          income={editIncome}
          onClose={() => { setShowAddIncome(false); setEditIncome(null); }}
          prefilledDate={newEntryDate}
        />
      )}
    </AnimatePresence>
  );

  if (rangeInvalid || !data) {
    return (
      <div className="space-y-5">
        <FinanceSubNav />
        {header}
        {rangeInvalid ? (
          <div className="card p-6 text-center text-sm text-surface-500">
            Choose a start date on or before the end date to see your figures.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
            <div className="skeleton h-48 rounded-2xl" />
          </>
        )}
        {modals}
      </div>
    );
  }

  const { summary, periodBalance, budgetStatus, categoryBreakdown, dailySpending, recentTransactions, insights, velocity, averageDailySpending, topCategory } = data;

  // Spending velocity bar
  const velocityPct = velocity?.percentBudgetUsed ?? 0;
  const monthPct = velocity?.percentMonthElapsed ?? 0;
  const chart = toChartData(dailySpending);

  return (
    <div className="space-y-5">
      <FinanceSubNav />
      {header}

      <div className={`space-y-5 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
      {/* Available Balance Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
        <div className="relative">
          <p className="text-sm font-medium text-emerald-100 mb-1">{balanceTitle}</p>
          <p className="text-4xl font-bold mb-1">{fmt(periodBalance.endingBalance)}</p>
          <div className="flex items-center gap-4 text-sm text-emerald-100 flex-wrap">
            <span>{startLabel}: {fmt(periodBalance.startingBalance)}</span>
            <span>+{fmt(summary.totalIncome)} income</span>
            <span>−{fmt(summary.totalExpenses)} spent</span>
          </div>
        </div>

        {/* Decorative blob */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
      </motion.div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Total Income" value={fmt(summary.totalIncome)}
          sub={periodLabel} icon={TrendingUp} iconColor="#10b981" bgColor="#10b98120"
        />
        <MetricCard
          label="Total Expenses" value={fmt(summary.totalExpenses)}
          sub={periodLabel} icon={TrendingDown} iconColor="#ef4444" bgColor="#ef444420"
        />
        <MetricCard
          label="Net Cash Flow" value={fmt(summary.netCashFlow)}
          sub="Income − Expenses"
          icon={Wallet}
          iconColor={summary.netCashFlow >= 0 ? '#10b981' : '#ef4444'}
          bgColor={summary.netCashFlow >= 0 ? '#10b98120' : '#ef444420'}
        />
        <MetricCard
          label="Avg Daily Spend" value={fmt(averageDailySpending)}
          sub={periodLabel} icon={BarChart2} iconColor="#6366f1" bgColor="#6366f120"
        />

        {budgetStatus && (
          <>
            <MetricCard
              label="Monthly Budget" value={fmt(budgetStatus.overall.budgeted)}
              sub={budgetStatus.overall.carriedForward > 0 ? `incl. ${fmt(budgetStatus.overall.carriedForward)} carried forward` : undefined}
              icon={PiggyBank} iconColor="#8b5cf6" bgColor="#8b5cf620"
            />
            <MetricCard
              label="Budget Used" value={`${budgetStatus.overall.percentage}%`}
              sub={fmt(budgetStatus.overall.spent) + ' spent'}
              icon={BarChart2}
              iconColor={budgetStatus.overall.percentage >= 90 ? '#ef4444' : '#f59e0b'}
              bgColor={budgetStatus.overall.percentage >= 90 ? '#ef444420' : '#f59e0b20'}
            />
            <MetricCard
              label="Budget Remaining" value={fmt(budgetStatus.overall.remaining)}
              icon={Zap}
              iconColor={budgetStatus.overall.remaining > 0 ? '#10b981' : '#ef4444'}
              bgColor={budgetStatus.overall.remaining > 0 ? '#10b98120' : '#ef444420'}
              highlight={budgetStatus.overall.remaining > 0}
            />
          </>
        )}

        {topCategory && (
          <MetricCard
            label="Top Category"
            value={fmt(topCategory.amount)}
            sub={`${topCategory.icon} ${topCategory.name} · ${topCategory.percentage}%`}
            icon={() => <span className="text-lg">{topCategory.icon}</span>}
            iconColor={topCategory.color}
            bgColor={`${topCategory.color}20`}
          />
        )}
      </div>

      {/* Spending Velocity */}
      {velocity && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-amber-500" />
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 text-sm">Spending Velocity</h3>
              {velocity.isOverPace && (
                <span className="badge bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px]">
                  Over pace
                </span>
              )}
            </div>
            <span className="text-xs text-surface-400">Day {velocity.daysElapsed}/{velocity.totalDaysInMonth}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-400">Budget pace (month {monthPct}% elapsed)</span>
              <span className="font-semibold text-surface-600 dark:text-surface-400">{monthPct}%</span>
            </div>
            <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden relative">
              {/* Month elapsed marker */}
              <div
                className="absolute top-0 h-full w-0.5 bg-surface-400 dark:bg-surface-600 z-10"
                style={{ left: `${monthPct}%` }}
              />
              {/* Budget used */}
              <motion.div
                className={`h-full rounded-full ${velocity.isOverPace ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, velocityPct)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-xs text-surface-500">
              {velocity.isOverPace
                ? `⚠️ You've used ${velocityPct}% of your budget but only ${monthPct}% of the month has passed.`
                : `✅ Spending is on track. Projected monthly spend: ${fmt(velocity.projectedMonthlySpend)}.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Daily spending chart */}
      {dailySpending.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-900 dark:text-surface-50">{chart.byMonth ? 'Monthly' : 'Daily'} Spending</h3>
            <Link to="/finance/analytics" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
              Full analytics →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chart.points}>
              <defs>
                <linearGradient id="expense-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={12} />
              <YAxis hide />
              <Tooltip content={(props) => <CustomTooltip {...props} symbol={symbol} />} />
              <Area
                type="monotone" dataKey="amount" name="Expense"
                stroke="#ef4444" strokeWidth={2}
                fill="url(#expense-gradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-900 dark:text-surface-50">By Category</h3>
              <Link to="/finance/analytics" className="text-xs text-primary-600 dark:text-primary-400">Details →</Link>
            </div>
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 5).map((cat) => (
                <div key={cat.categoryId} className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    {cat.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-surface-800 dark:text-surface-200 truncate">{cat.name}</span>
                      <span className="font-semibold text-surface-700 dark:text-surface-300 shrink-0 ml-2">{fmt(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.6, delay: 0.05 }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-surface-400 shrink-0 w-8 text-right">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget status */}
        {budgetStatus && budgetStatus.categories.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-surface-900 dark:text-surface-50">Budget Status</h3>
              <Link to="/finance/budget" className="text-xs text-primary-600 dark:text-primary-400">Manage →</Link>
            </div>
            <div className="space-y-4">
              {budgetStatus.categories.slice(0, 4).map((item) => (
                <BudgetProgressBar key={item.categoryId} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-amber-500" />
            <h3 className="font-bold text-surface-900 dark:text-surface-50">Financial Insights</h3>
          </div>
          <div className="space-y-2">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-surface-900 dark:text-surface-50">Recent Transactions</h3>
            <Link to="/finance/transactions" className="text-xs text-primary-600 dark:text-primary-400">
              View all →
            </Link>
          </div>
          <div className="space-y-1">
            {recentTransactions.slice(0, 8).map((tx: any) => (
              <TransactionCard
                key={tx._id}
                transaction={tx}
                type={tx.transactionType}
                compact
                onClick={() => {
                  if (tx.transactionType === 'expense') {
                    setEditExpense(tx);
                  } else {
                    setEditIncome(tx);
                  }
                }}
                onDelete={() => {
                  if (confirm('Delete this transaction?')) {
                    if (tx.transactionType === 'expense') {
                      deleteExpenseMutation.mutate(tx._id);
                    } else {
                      deleteIncomeMutation.mutate(tx._id);
                    }
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      </div>

      {modals}
    </div>
  );
}
