import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { completionsApi } from '../../api/completions';
import type { Habit } from '../../types';

export default function MonthCalendar({ habits }: { habits: Habit[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const fromStr = format(monthStart, 'yyyy-MM-dd');
  const toStr = format(monthEnd, 'yyyy-MM-dd');

  const { data: completions } = useQuery({
    queryKey: ['completions', 'month', fromStr],
    queryFn: () => completionsApi.getRange(fromStr, toStr),
  });

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = (getDay(monthStart) + 6) % 7; // Monday=0

  const getCompletionRate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayCompletions = completions?.filter((c) => c.date.slice(0, 10) === dateStr) ?? [];
    const completed = dayCompletions.filter((c) => c.status === 'completed').length;
    const activeHabits = habits.filter((h) => h.status !== 'archived').length;
    if (activeHabits === 0 || dayCompletions.length === 0) return null;
    return Math.round((completed / activeHabits) * 100);
  };

  const getRateColor = (rate: number | null) => {
    if (rate === null) return '';
    if (rate >= 80) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200';
    if (rate >= 50) return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  };

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="btn-ghost px-3" id="month-prev">
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-bold text-lg text-surface-900 dark:text-surface-50">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="btn-ghost px-3" id="month-next">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-surface-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const rate = getCompletionRate(day);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative cursor-default transition-all
                ${today ? 'ring-2 ring-primary-500' : ''}
                ${rate !== null ? getRateColor(rate) : 'hover:bg-surface-100 dark:hover:bg-surface-800'}
              `}
            >
              <span className={`text-sm font-semibold ${today ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                {format(day, 'd')}
              </span>
              {rate !== null && (
                <span className="text-[9px] font-medium opacity-70">{rate}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
        {[
          { color: 'bg-emerald-100 dark:bg-emerald-900/40', label: '≥80% great' },
          { color: 'bg-amber-100 dark:bg-amber-900/40', label: '50–79% ok' },
          { color: 'bg-red-100 dark:bg-red-900/30', label: '<50% needs work' },
          { color: 'bg-surface-100 dark:bg-surface-800', label: 'No data' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-surface-500">
            <div className={`w-4 h-4 rounded ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
