import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { completionsApi } from '../../api/completions';
import type { Habit, CompletionStatus } from '../../types';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';


const STATUS_EMOJI: Record<string, string> = {
  completed: '✓',
  partial: '~',
  missed: '✕',
  skipped: '—',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  partial: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  missed: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  skipped: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
};

export default function WeekMatrix({ habits }: { habits: Habit[] }) {
  const queryClient = useQueryClient();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const fromStr = format(weekDays[0], 'yyyy-MM-dd');
  const toStr = format(weekDays[6], 'yyyy-MM-dd');

  const { data: completions } = useQuery({
    queryKey: ['completions', 'week', fromStr],
    queryFn: () => completionsApi.getRange(fromStr, toStr),
  });

  const getCompletionRecord = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions?.find(
      (c) => c.habitId === habitId && c.date.slice(0, 10) === dateStr
    );
  };

  const getStatus = (habitId: string, date: Date) => {
    return getCompletionRecord(habitId, date)?.status;
  };

  const logMutation = useMutation({
    mutationFn: ({ habitId, dateStr, status }: { habitId: string; dateStr: string; status: CompletionStatus }) =>
      completionsApi.log(habitId, dateStr, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => completionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleCellClick = (habit: Habit, day: Date) => {
    const record = getCompletionRecord(habit._id, day);
    const dateStr = format(day, 'yyyy-MM-dd');

    if (!record) {
      logMutation.mutate({ habitId: habit._id, dateStr, status: 'completed' });
      toast.success(`${habit.name} checked! ✓`);
    } else if (record.status === 'completed') {
      logMutation.mutate({ habitId: habit._id, dateStr, status: 'missed' });
      toast.error(`${habit.name} missed ✕`);
    } else if (record.status === 'missed') {
      logMutation.mutate({ habitId: habit._id, dateStr, status: 'skipped' });
      toast.success(`${habit.name} skipped —`);
    } else if (record.status === 'skipped') {
      deleteMutation.mutate(record._id);
      toast.success(`${habit.name} cleared`);
    }
  };

  const activeHabits = habits.filter((h) => h.status !== 'archived');

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-surface-100 dark:border-surface-800">
              <th className="text-left p-4 text-sm font-semibold text-surface-700 dark:text-surface-300 w-40">Habit</th>
              {weekDays.map((day) => (
                <th key={day.toISOString()} className={`p-3 text-center ${isToday(day) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                  <div className={`text-xs font-medium ${isToday(day) ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500'}`}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-sm font-bold mt-0.5 ${isToday(day) ? 'text-primary-600 dark:text-primary-400' : 'text-surface-700 dark:text-surface-300'}`}>
                    {format(day, 'd')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeHabits.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-surface-400 text-sm">
                  No active habits. Create some habits to see the week matrix!
                </td>
              </tr>
            ) : (
              activeHabits.map((habit, idx) => (
                <motion.tr
                  key={habit._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-surface-50 dark:border-surface-800/50 last:border-0"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{habit.icon}</span>
                      <span className="text-sm font-medium text-surface-800 dark:text-surface-200 truncate max-w-[100px]">{habit.name}</span>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const status = getStatus(habit._id, day);
                    return (
                      <td key={day.toISOString()} className={`p-2 text-center ${isToday(day) ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                        <button
                          type="button"
                          onClick={() => handleCellClick(habit, day)}
                          className="w-9 h-9 rounded-lg mx-auto flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
                          title="Click to toggle status (Completed -> Missed -> Skipped -> None)"
                        >
                          {status ? (
                            <div className={`w-full h-full rounded-lg flex items-center justify-center text-xs font-bold ${STATUS_COLORS[status]}`}>
                              {STATUS_EMOJI[status]}
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-lg bg-surface-100 dark:bg-surface-800 border border-transparent hover:border-surface-300 dark:hover:border-surface-700" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap px-4 py-3 border-t border-surface-100 dark:border-surface-800">
        {Object.entries(STATUS_EMOJI).map(([status, emoji]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-surface-500">
            <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${STATUS_COLORS[status]}`}>{emoji}</div>
            <span className="capitalize">{status}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-surface-500">
          <div className="w-5 h-5 rounded bg-surface-100 dark:bg-surface-800" />
          <span>Not scheduled</span>
        </div>
      </div>
    </div>
  );
}
