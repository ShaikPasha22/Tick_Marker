import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { analyticsApi } from '../../api/analytics';
import type { Habit } from '../../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getColor(rate: number, darkMode: boolean) {
  if (rate === 0) return darkMode ? '#1f2937' : '#f3f4f6';
  if (rate < 25) return '#bfdbfe';
  if (rate < 50) return '#93c5fd';
  if (rate < 75) return '#6366f1';
  return '#4338ca';
}

export default function YearHeatmap({ habits }: { habits: Habit[] }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedHabit, setSelectedHabit] = useState<string>('');

  const isDark = document.documentElement.classList.contains('dark');

  const { data, isLoading } = useQuery({
    queryKey: ['heatmap', year, selectedHabit],
    queryFn: () => analyticsApi.getHeatmap(year, selectedHabit || undefined),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <div className="skeleton h-48 rounded-2xl" />;

  const heatmap = data?.heatmap ?? [];

  // Build a grid: week columns, 7 rows (Mon=0...Sun=6)
  // Find the day of week for Jan 1
  const jan1DayOfWeek = (getDay(new Date(year, 0, 1)) + 6) % 7; // Mon=0

  const cells: (typeof heatmap[0] | null)[] = [
    ...Array(jan1DayOfWeek).fill(null),
    ...heatmap,
  ];

  const weeks: (typeof heatmap[0] | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Month label positions
  const monthPositions: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstReal = week.find((c) => c !== null);
    if (firstReal) {
      const month = parseISO(firstReal.date).getMonth();
      if (month !== lastMonth) {
        monthPositions.push({ label: MONTHS[month], col: wIdx });
        lastMonth = month;
      }
    }
  });

  const totalCompleted = heatmap.reduce((s, d) => s + d.completed, 0);
  const activeDays = heatmap.filter((d) => d.completed > 0).length;

  return (
    <div className="card p-5 space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setYear((y) => y - 1)} className="btn-ghost px-2" id="year-prev">
            <ChevronLeft size={16} />
          </button>
          <span className="font-bold text-surface-900 dark:text-surface-50">{year}</span>
          <button onClick={() => setYear((y) => y + 1)} className="btn-ghost px-2" id="year-next" disabled={year >= new Date().getFullYear()}>
            <ChevronRight size={16} />
          </button>
        </div>

        <select
          value={selectedHabit}
          onChange={(e) => setSelectedHabit(e.target.value)}
          id="year-habit-filter"
          className="input py-1.5 text-sm w-auto"
        >
          <option value="">All habits</option>
          {habits.filter((h) => h.status !== 'archived').map((h) => (
            <option key={h._id} value={h._id}>{h.icon} {h.name}</option>
          ))}
        </select>

        <div className="flex gap-4 text-sm text-surface-500">
          <span><strong className="text-surface-900 dark:text-surface-100">{totalCompleted}</strong> completions</span>
          <span><strong className="text-surface-900 dark:text-surface-100">{activeDays}</strong> active days</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="inline-flex gap-0" style={{ minWidth: 0 }}>
          {/* Weekday labels */}
          <div className="flex flex-col gap-[3px] mr-1.5 mt-5">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="h-[11px] text-[9px] text-surface-400 leading-none">{d}</div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex flex-col">
            {/* Month labels */}
            <div className="relative h-5 mb-1" style={{ width: weeks.length * 14 }}>
              {monthPositions.map(({ label, col }) => (
                <span
                  key={`${label}-${col}`}
                  className="absolute text-[10px] text-surface-400 font-medium"
                  style={{ left: col * 14 }}
                >
                  {label}
                </span>
              ))}
            </div>
            {/* Cells */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      title={day ? `${day.date}: ${day.completed}/${day.scheduled} (${day.rate}%)` : ''}
                      className="w-[11px] h-[11px] rounded-sm cursor-default"
                      style={{
                        backgroundColor: day
                          ? getColor(day.rate, isDark)
                          : isDark ? '#18181b' : '#f9fafb',
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-xs text-surface-400">
        <span>Less</span>
        {[0, 25, 50, 75, 100].map((v) => (
          <div key={v} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(v, isDark) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
