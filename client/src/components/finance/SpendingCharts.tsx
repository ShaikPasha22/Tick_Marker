import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { financeDashboardApi } from '../../api/finance';
import { useCurrency, getMonthRange } from '../../store/financeStore';
import { useUIStore } from '../../store/uiStore';

// Validated (light + dark) against the card surfaces: indigo marks spending, red only overspending
const SPENT = '#6366f1';
const OVER = '#ef4444';
const THEME = {
  light: { surface: '#ffffff', track: '#e0e7ff', grid: '#f4f4f5', muted: '#71717a' },
  dark: { surface: '#1c1c2e', track: '#312e81', grid: '#27272a', muted: '#a1a1aa' },
};

function ChartTooltip({ active, payload, children }: { active?: boolean; payload?: unknown[]; children: React.ReactNode }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-surface-800 border border-custom rounded-xl shadow-lg px-3 py-2 text-xs">
      {children}
    </div>
  );
}

function LegendRow({ swatch, label, value, icon }: { swatch: string; label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-surface-500">
        {icon ?? <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: swatch }} />}
        {label}
      </span>
      <span className="font-semibold text-surface-900 dark:text-surface-50 tabular-nums">{value}</span>
    </div>
  );
}

/** Spent-vs-remaining ring and daily spending line (with dotted average) for one month */
export default function SpendingCharts({ year, month }: { year: number; month: number }) {
  const { fmt, symbol } = useCurrency();
  const colors = THEME[useUIStore((s) => s.resolvedTheme)];
  const { from, to } = getMonthRange(year, month);

  // Same query as the Overview's month view, so switching pages reuses the cache
  const { data, isLoading } = useQuery({
    queryKey: ['finance-dashboard', from, to],
    queryFn: () => financeDashboardApi.get({ from, to }),
    staleTime: 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="skeleton h-64 rounded-2xl lg:col-span-2" />
        <div className="skeleton h-64 rounded-2xl lg:col-span-3" />
      </div>
    );
  }

  // ── Ring: what was spent against the month's budget, else against its income ──
  const budget = data.budgetStatus?.overall.budgeted ?? 0;
  const spent = data.summary.totalExpenses;
  const limit = budget > 0 ? budget : data.summary.totalIncome;
  const basis = budget > 0 ? 'budget' : 'income';
  const over = Math.max(0, spent - limit);
  const remaining = Math.max(0, limit - spent);
  const pctUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const ring = over > 0
    ? [{ name: `Within ${basis}`, value: limit, color: SPENT }, { name: 'Over', value: over, color: OVER }]
    : [{ name: 'Spent', value: spent, color: SPENT }, { name: 'Remaining', value: remaining, color: colors.track }];

  // ── Line: each day up to today (later days haven't happened yet) ──
  const today = format(new Date(), 'yyyy-MM-dd');
  const days = data.dailySpending.filter((d) => d.date <= today);
  const monthAverage = days.length ? days.reduce((sum, d) => sum + d.amount, 0) / days.length : 0;
  // The dotted line is the usual daily spend across all earlier months, so each day compares to normal
  const usual = data.priorDailyAverage;
  const usualSince = usual ? format(parseISO(usual.from.slice(0, 10)), 'MMM yyyy') : null;
  const points = days.map((d) => ({ date: d.date, label: format(parseISO(d.date), 'd'), amount: d.amount }));
  const compact = (n: number) =>
    n >= 1000 ? `${symbol}${(n / 1000).toLocaleString('en-IN', { maximumFractionDigits: 1 })}k` : `${symbol}${n}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" id="spending-charts">
      {/* Spent vs remaining */}
      <div className="card p-5 lg:col-span-2">
        <h3 className="font-bold text-surface-900 dark:text-surface-50">Spent vs remaining</h3>
        <p className="text-xs text-surface-400 mb-3">
          {limit > 0 ? `Against this month's ${basis}` : 'No budget or income this month yet'}
        </p>

        {limit > 0 ? (
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4">
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ring} dataKey="value" nameKey="name"
                    innerRadius="72%" outerRadius="100%" startAngle={90} endAngle={-270}
                    cornerRadius={4} stroke={colors.surface} strokeWidth={2} isAnimationActive={false}
                  >
                    {ring.map((slice) => <Cell key={slice.name} fill={slice.color} />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => (
                      <ChartTooltip active={active} payload={payload}>
                        <p className="font-semibold text-surface-700 dark:text-surface-200">{payload?.[0]?.name}</p>
                        <p className="text-surface-500">{fmt(Number(payload?.[0]?.value ?? 0))}</p>
                      </ChartTooltip>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-surface-900 dark:text-surface-50 tabular-nums">{pctUsed}%</span>
                <span className="text-[11px] text-surface-400">of {basis} used</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <LegendRow swatch={SPENT} label="Spent" value={fmt(spent)} />
              {over > 0 ? (
                <LegendRow
                  swatch={OVER}
                  label={`Over ${basis}`}
                  value={fmt(over)}
                  icon={<AlertTriangle size={12} className="text-red-500 shrink-0" />}
                />
              ) : (
                <LegendRow swatch={colors.track} label="Remaining" value={fmt(remaining)} />
              )}
              <div className="border-t border-custom pt-2">
                <LegendRow swatch="transparent" label={basis === 'budget' ? 'Budget' : 'Income'} value={fmt(limit)} icon={<span className="w-2.5" />} />
              </div>
              {data.safeToSpend && data.safeToSpend.perDay > 0 && (
                <p className="text-xs text-surface-500 pt-1">
                  Safe to spend: <span className="font-semibold text-surface-700 dark:text-surface-200">{fmt(data.safeToSpend.perDay)}/day</span> for {data.safeToSpend.daysLeft} days
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-2">
            <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{fmt(spent)}</p>
            <p className="text-xs text-surface-400">spent this month</p>
            <Link to="/finance/budget" className="text-xs font-semibold text-primary-600 dark:text-primary-400">
              Set a budget to see what's left →
            </Link>
          </div>
        )}
      </div>

      {/* Daily spending with average */}
      <div className="card p-5 lg:col-span-3">
        <h3 className="font-bold text-surface-900 dark:text-surface-50">Daily spending</h3>
        <p className="text-xs text-surface-400 mb-3">
          {!points.length
            ? 'This month hasn’t started yet'
            : `This month ${fmt(Math.round(monthAverage))}/day` +
              (usual ? ` · usually ${fmt(usual.amount)}/day (earlier months since ${usualSince})` : ' · no earlier months to compare yet')}
        </p>

        {points.length > 0 && (
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.grid} strokeWidth={1} />
              <XAxis
                dataKey="label" tick={{ fontSize: 10, fill: colors.muted }} axisLine={false} tickLine={false}
                interval="preserveStartEnd" minTickGap={10}
              />
              <YAxis
                tickFormatter={compact} tick={{ fontSize: 10, fill: colors.muted }} axisLine={false} tickLine={false}
                width={44} allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: colors.muted, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as { date: string; amount: number } | undefined;
                  if (!p) return null;
                  const diff = usual ? p.amount - usual.amount : null;
                  return (
                    <ChartTooltip active={active} payload={payload}>
                      <p className="font-semibold text-surface-700 dark:text-surface-200">{format(parseISO(p.date), 'EEE, d MMM')}</p>
                      <p className="text-surface-500">Spent {fmt(p.amount)}</p>
                      {diff !== null && (
                        <p className="text-surface-400">
                          {Math.abs(diff) < 1 ? 'Same as usual' : `${fmt(Math.round(Math.abs(diff)))} ${diff > 0 ? 'above' : 'below'} usual`}
                        </p>
                      )}
                    </ChartTooltip>
                  );
                }}
              />
              {usual && <ReferenceLine y={usual.amount} stroke={colors.muted} strokeDasharray="4 4" strokeWidth={1.5} ifOverflow="extendDomain" />}
              <Line
                type="monotone" dataKey="amount" name="Spent" stroke={SPENT} strokeWidth={2}
                dot={points.length === 1 ? { r: 4, fill: SPENT, stroke: colors.surface, strokeWidth: 2 } : false}
                activeDot={{ r: 5, fill: SPENT, stroke: colors.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        {points.length > 0 && (
          <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
            <span className="flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden><line x1="0" y1="3" x2="18" y2="3" stroke={SPENT} strokeWidth="2" /></svg>
              Daily spending
            </span>
            {usual && (
              <span className="flex items-center gap-1.5">
                <svg width="18" height="6" aria-hidden><line x1="0" y1="3" x2="18" y2="3" stroke={colors.muted} strokeWidth="1.5" strokeDasharray="4 4" /></svg>
                Usual {fmt(usual.amount)}/day · earlier months
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
