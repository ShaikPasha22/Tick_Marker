import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinanceStore, getWeekRange, type OverviewPeriod } from '../../store/financeStore';
import { useAuthStore } from '../../store/authStore';
import MonthSelector from './MonthSelector';

const PERIODS: { key: OverviewPeriod; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'Overall' },
  { key: 'custom', label: 'Custom' },
];

/** Week / Month / Overall / Custom switch for the finance Overview, plus the matching range control */
export default function OverviewPeriodPicker() {
  const {
    overviewPeriod, setOverviewPeriod,
    weekAnchor, shiftWeek, resetWeek,
    customRange, setCustomRange,
  } = useFinanceStore();
  const weekStartsOn = useAuthStore((s) => s.user?.weekStartDay ?? 1);

  const week = getWeekRange(weekAnchor, weekStartsOn);
  const isCurrentWeek = getWeekRange(format(new Date(), 'yyyy-MM-dd'), weekStartsOn).from === week.from;
  const customInvalid = !customRange.from || !customRange.to || customRange.from > customRange.to;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1" role="tablist" aria-label="Overview period">
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={overviewPeriod === key}
            onClick={() => setOverviewPeriod(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${overviewPeriod === key
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-sm'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            id={`overview-period-${key}`}
          >
            {label}
          </button>
        ))}
      </div>

      {overviewPeriod === 'month' && <MonthSelector />}

      {overviewPeriod === 'week' && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftWeek(-1)}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
            aria-label="Previous week"
            id="overview-week-prev"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-surface-700 dark:text-surface-300 min-w-[9.5rem] text-center">
            {format(parseISO(week.from), 'd MMM')} – {format(parseISO(week.to), 'd MMM yyyy')}
          </span>
          <button
            onClick={() => shiftWeek(1)}
            className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
            aria-label="Next week"
            id="overview-week-next"
          >
            <ChevronRight size={16} />
          </button>
          {!isCurrentWeek && (
            <button
              onClick={resetWeek}
              className="ml-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              id="overview-week-today"
            >
              This week
            </button>
          )}
        </div>
      )}

      {overviewPeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={customRange.from}
            max={customRange.to || undefined}
            onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
            className="input py-1.5 text-xs w-36"
            aria-label="From date"
            id="overview-custom-from"
          />
          <span className="text-xs text-surface-400">to</span>
          <input
            type="date"
            value={customRange.to}
            min={customRange.from || undefined}
            onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
            className="input py-1.5 text-xs w-36"
            aria-label="To date"
            id="overview-custom-to"
          />
          {customInvalid && (
            <span className="text-xs text-red-500">Pick a start date on or before the end date</span>
          )}
        </div>
      )}
    </div>
  );
}
