import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinanceStore } from '../../store/financeStore';

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
);

/**
 * Month picker shared by all finance pages — changing it here changes the month
 * shown on Overview, Calendar, Transactions, Analytics and Budget.
 */
export default function MonthSelector({ id = 'finance-month' }: { id?: string }) {
  const { selectedYear, selectedMonth, setSelectedMonth, shiftSelectedMonth } = useFinanceStore();

  const now = new Date();
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i);
  if (!years.includes(selectedYear)) years.push(selectedYear);
  years.sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => shiftSelectedMonth(-1)}
        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
        aria-label="Previous month"
        id={`${id}-prev`}
      >
        <ChevronLeft size={16} />
      </button>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(selectedYear, Number(e.target.value))}
        className="input py-1.5 text-xs w-32"
        aria-label="Month"
        id={`${id}-select`}
      >
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedMonth(Number(e.target.value), selectedMonth)}
        className="input py-1.5 text-xs w-24"
        aria-label="Year"
        id={`${id}-year-select`}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <button
        onClick={() => shiftSelectedMonth(1)}
        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
        aria-label="Next month"
        id={`${id}-next`}
      >
        <ChevronRight size={16} />
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => setSelectedMonth(now.getFullYear(), now.getMonth() + 1)}
          className="ml-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
          id={`${id}-today`}
        >
          This month
        </button>
      )}
    </div>
  );
}
