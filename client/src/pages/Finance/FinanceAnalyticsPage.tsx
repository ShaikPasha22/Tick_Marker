import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, subDays } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart2, Calendar } from 'lucide-react';
import {
  financeAnalyticsApi, expenseCategoriesApi,
} from '../../api/finance';
import { useCurrency } from '../../store/financeStore';
import FinanceSubNav from '../../components/finance/FinanceSubNav';
import type { CategoryBreakdownItem } from '../../types';

type Period = 'week' | 'month' | '3months' | 'year' | 'custom';

const CHART_COLORS = ['#6366f1', '#10b981', '#f97316', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#71717a'];

const CustomTooltip = ({ active, payload, label, symbol, valueKey }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-custom rounded-xl shadow-lg p-3 text-xs min-w-[120px]">
      <p className="font-semibold text-surface-700 dark:text-surface-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {symbol}{(p.value ?? 0).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

export default function FinanceAnalyticsPage() {
  const { fmt, symbol } = useCurrency();
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const now = new Date();
  const getRange = (): { from: string; to: string } => {
    switch (period) {
      case 'week':
        return { from: format(subDays(now, 7), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
      case 'month':
        return { from: format(startOfMonth(now), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
      case '3months':
        return { from: format(subMonths(now, 3), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
      case 'year':
        return { from: format(startOfYear(now), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
      case 'custom':
        return { from: customFrom || format(startOfMonth(now), 'yyyy-MM-dd'), to: customTo || format(now, 'yyyy-MM-dd') };
    }
  };

  const range = getRange();

  const { data: categories } = useQuery({
    queryKey: ['finance-analytics-categories', range],
    queryFn: () => financeAnalyticsApi.getCategories(range),
    staleTime: 60 * 1000,
  });

  const { data: daily } = useQuery({
    queryKey: ['finance-analytics-daily', range],
    queryFn: () => financeAnalyticsApi.getDaily(range),
    staleTime: 60 * 1000,
  });

  const { data: monthly } = useQuery({
    queryKey: ['finance-analytics-monthly'],
    queryFn: () => financeAnalyticsApi.getMonthly(12),
    staleTime: 5 * 60 * 1000,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['finance-analytics-pm', range],
    queryFn: () => financeAnalyticsApi.getPaymentMethods(range),
    staleTime: 60 * 1000,
  });

  const { data: summary } = useQuery({
    queryKey: ['finance-analytics-summary', range],
    queryFn: () => financeAnalyticsApi.getSummary(range),
    staleTime: 60 * 1000,
  });

  const totalExpenses = summary?.summary?.totalExpenses ?? 0;
  const totalIncome = summary?.summary?.totalIncome ?? 0;
  const netCashFlow = summary?.summary?.netCashFlow ?? 0;

  // Monthly comparison
  const thisMonth = monthly?.[monthly.length - 1];
  const lastMonth = monthly?.[monthly.length - 2];
  const momChange = lastMonth && lastMonth.expenses > 0
    ? Math.round(((thisMonth?.expenses ?? 0) - lastMonth.expenses) / lastMonth.expenses * 100)
    : null;

  return (
    <div className="space-y-5">
      <FinanceSubNav />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Analytics</h2>
      </div>

      {/* Period selector */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { key: 'week', label: '7 days' },
          { key: 'month', label: 'This month' },
          { key: '3months', label: '3 months' },
          { key: 'year', label: 'This year' },
          { key: 'custom', label: 'Custom' },
        ] as { key: Period; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
              ${period === key
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}
            id={`analytics-period-${key}`}
          >
            {label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">From</label>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="input py-2 text-sm" id="analytics-custom-from" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-500 mb-1">To</label>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="input py-2 text-sm" id="analytics-custom-to" />
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4 text-center">
          <TrendingUp size={18} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalIncome)}</p>
          <p className="text-xs text-surface-400 mt-0.5">Income</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="card p-4 text-center">
          <TrendingDown size={18} className="text-red-500 mx-auto mb-2" />
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{fmt(totalExpenses)}</p>
          <p className="text-xs text-surface-400 mt-0.5">Expenses</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card p-4 text-center">
          <BarChart2 size={18} className={`mx-auto mb-2 ${netCashFlow >= 0 ? 'text-primary-500' : 'text-red-500'}`} />
          <p className={`text-lg font-bold ${netCashFlow >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-red-600 dark:text-red-400'}`}>
            {fmt(Math.abs(netCashFlow))}
          </p>
          <p className="text-xs text-surface-400 mt-0.5">Net {netCashFlow >= 0 ? 'Savings' : 'Deficit'}</p>
        </motion.div>
      </div>

      {/* Daily spending chart */}
      {daily && daily.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4">Daily Spending & Income</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily.filter(d => d.amount > 0 || d.incomeAmount > 0)} barSize={6}>
              <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'dd MMM')} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={(p) => <CustomTooltip {...p} symbol={symbol} />} />
              <Bar dataKey="amount" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="incomeAmount" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category breakdown */}
      {categories && categories.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4">Spending by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie chart */}
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categories.slice(0, 8)}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {categories.slice(0, 8).map((cat, i) => (
                    <Cell key={cat.categoryId} fill={cat.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => fmt(value)} />
              </PieChart>
            </ResponsiveContainer>

            {/* Category list */}
            <div className="space-y-2">
              {categories.slice(0, 8).map((cat, i) => (
                <div key={cat.categoryId} className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    {cat.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-surface-700 dark:text-surface-300 truncate">{cat.name}</span>
                      <span className="font-semibold shrink-0 ml-2">{fmt(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color || CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-surface-400 w-8 text-right shrink-0">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {monthly && monthly.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-900 dark:text-surface-50">Monthly Trends (12 months)</h3>
            {momChange !== null && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${momChange >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {momChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(momChange)}% vs last month
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} barSize={12}>
              <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <Tooltip content={(p) => <CustomTooltip {...p} symbol={symbol} />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Monthly comparison table */}
          {thisMonth && lastMonth && (
            <div className="mt-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">This vs Last Month</h4>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <p className="text-surface-400 mb-1">Last Month</p>
                  <p className="font-bold text-surface-900 dark:text-surface-50">{fmt(lastMonth.expenses)}</p>
                </div>
                <div>
                  <p className="text-surface-400 mb-1">Change</p>
                  <p className={`font-bold ${momChange && momChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {momChange !== null ? `${momChange > 0 ? '+' : ''}${momChange}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-surface-400 mb-1">This Month</p>
                  <p className="font-bold text-surface-900 dark:text-surface-50">{fmt(thisMonth.expenses)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment methods */}
      {paymentMethods && paymentMethods.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4">By Payment Method</h3>
          <div className="space-y-3">
            {paymentMethods.map((pm, i) => (
              <div key={pm.methodId ?? i} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center shrink-0">{pm.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-surface-700 dark:text-surface-300">{pm.name}</span>
                    <span className="font-semibold">{fmt(pm.amount)} · {pm.count} txns</span>
                  </div>
                  <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pm.percentage}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
                <span className="text-xs text-surface-400 w-8 text-right">{pm.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Net cash flow chart */}
      {monthly && monthly.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4">Net Cash Flow</h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="cf-positive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={(p) => <CustomTooltip {...p} symbol={symbol} />} />
              <Area
                type="monotone" dataKey="netCashFlow" name="Net Cash Flow"
                stroke="#10b981" strokeWidth={2} fill="url(#cf-positive)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
