import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { completionsApi } from '../../api/completions';
import { goalsApi } from '../../api/goals';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { Habit } from '../../types';

export default function MonthCalendar({ habits }: { habits: Habit[] }) {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const fromStr = format(monthStart, 'yyyy-MM-dd');
  const toStr = format(monthEnd, 'yyyy-MM-dd');

  const { data: completions } = useQuery({
    queryKey: ['completions', 'month', fromStr],
    queryFn: () => completionsApi.getRange(fromStr, toStr),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.getAll(),
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
    if (rate === null) return 'border-transparent';
    if (rate >= 80) return 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-200';
    if (rate >= 50) return 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/10 text-amber-800 dark:text-amber-200';
    return 'border-red-400 bg-red-50/20 dark:bg-red-950/10 text-red-700 dark:text-red-300';
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
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = format(selectedDay, 'yyyy-MM-dd') === dateStr;

          // Get completed habits for this day to render visual dots
          const dayDoneCompletions = completions?.filter(
            (c) => c.date.slice(0, 10) === dateStr && c.status === 'completed'
          ) ?? [];

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 relative border transition-all hover:scale-[1.03] active:scale-95 cursor-pointer
                ${today ? 'ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-surface-900' : ''}
                ${isSelected ? 'ring-2 ring-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20' : ''}
                ${rate !== null ? getRateColor(rate) : 'border-surface-100 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800'}
              `}
            >
              <span className={`text-xs font-semibold ${today ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-surface-700 dark:text-surface-300'}`}>
                {format(day, 'd')}
              </span>
              
              {/* Colored Dots showing completed habits */}
              <div className="flex gap-0.5 justify-center flex-wrap max-w-full my-0.5">
                {dayDoneCompletions.slice(0, 4).map((c) => {
                  const habit = habits.find((h) => h._id === c.habitId);
                  return (
                    <span
                      key={c._id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: habit?.color ?? '#10b981' }}
                      title={habit?.name}
                    />
                  );
                })}
              </div>

              <span className="text-[8px] font-bold opacity-60">
                {rate !== null ? `${rate}%` : '-'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
        {[
          { color: 'border-emerald-500 bg-emerald-50/30', label: '≥80% great' },
          { color: 'border-amber-500 bg-amber-50/30', label: '50–79% ok' },
          { color: 'border-red-400 bg-red-50/20', label: '<50% needs work' },
          { color: 'border-surface-100 bg-surface-100 dark:bg-surface-800', label: 'No data' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-surface-500">
            <div className={`w-4 h-4 rounded border ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Selected Day Activity Details Drawer */}
      <div className="mt-6 border-t border-surface-100 dark:border-surface-800 pt-4 space-y-3">
        <h4 className="text-sm font-bold text-surface-800 dark:text-surface-200">
          Activity for {format(selectedDay, 'MMMM d, yyyy')}
        </h4>

        {/* Habits details */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wide">Completed Habits</p>
          {(() => {
            const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');
            const dayDone = completions?.filter((c) => c.date.slice(0, 10) === selectedDateStr && c.status === 'completed') ?? [];

            if (dayDone.length === 0) {
              return <p className="text-xs text-surface-400 italic">No habits completed on this day.</p>;
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dayDone.map((c) => {
                  const habit = habits.find((h) => h._id === c.habitId);
                  if (!habit) return null;
                  return (
                    <div key={c._id} className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-surface-50/40 dark:bg-surface-800/20 text-xs">
                      <span className="text-base">{habit.icon}</span>
                      <span className="font-semibold text-surface-800 dark:text-surface-200">{habit.name}</span>
                      <span className="ml-auto text-emerald-500 font-bold">✓ Done</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Goals details */}
        <div className="space-y-2 pt-2">
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wide">Goal Achievements & Progress</p>
          {(() => {
            const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');
            const dayDoneHabitIds = completions?.filter((c) => c.date.slice(0, 10) === selectedDateStr && c.status === 'completed').map((c) => c.habitId) ?? [];

            const linkedGoals = goals?.filter((g) => g.habitId && dayDoneHabitIds.includes(g.habitId)) ?? [];
            const startedGoals = goals?.filter((g) => g.createdAt.slice(0, 10) === selectedDateStr) ?? [];
            const deadlineGoals = goals?.filter((g) => g.deadline && g.deadline.slice(0, 10) === selectedDateStr) ?? [];

            if (linkedGoals.length === 0 && startedGoals.length === 0 && deadlineGoals.length === 0) {
              return <p className="text-xs text-surface-400 italic">No goal milestones or progress logged on this day.</p>;
            }

            return (
              <div className="space-y-2">
                {linkedGoals.map((g) => (
                  <div key={g._id} className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/10 dark:bg-emerald-950/5 text-xs">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-emerald-500" />
                      <span className="font-bold text-surface-800 dark:text-surface-200">{g.title}</span>
                    </div>
                    <span className="text-emerald-500 font-semibold">Progress Logged (+1)</span>
                  </div>
                ))}
                {startedGoals.map((g) => (
                  <div key={g._id} className="flex items-center justify-between p-2.5 rounded-xl border border-blue-100 bg-blue-50/10 dark:bg-blue-950/5 text-xs">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-blue-500" />
                      <span className="font-bold text-surface-800 dark:text-surface-200">{g.title}</span>
                    </div>
                    <span className="text-blue-500 font-semibold">🚩 Goal Started</span>
                  </div>
                ))}
                {deadlineGoals.map((g) => (
                  <div key={g._id} className="flex items-center justify-between p-2.5 rounded-xl border border-red-100 bg-red-50/10 dark:bg-red-950/5 text-xs">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-red-500" />
                      <span className="font-bold text-surface-800 dark:text-surface-200">{g.title}</span>
                    </div>
                    <span className="text-red-500 font-semibold">🏁 Target Deadline</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
