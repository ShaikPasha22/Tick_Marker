import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, isToday, isFuture } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Grid2X2, LayoutGrid, AlignLeft, Check, X, SkipForward, Plus, Minus as MinusIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { completionsApi } from '../../api/completions';
import { habitsApi } from '../../api/habits';
import type { Habit, HabitCompletion, CompletionStatus, DayHabitEntry } from '../../types';
import WeekMatrix from './WeekMatrix';
import MonthCalendar from './MonthCalendar';
import YearHeatmap from './YearHeatmap';

type ViewMode = 'day' | 'week' | 'month' | 'year';

const VIEW_TABS: { mode: ViewMode; label: string; icon: React.ElementType }[] = [
  { mode: 'day', label: 'Day', icon: AlignLeft },
  { mode: 'week', label: 'Week', icon: Grid2X2 },
  { mode: 'month', label: 'Month', icon: Calendar },
  { mode: 'year', label: 'Year', icon: LayoutGrid },
];

function HabitCompletionCard({
  habit,
  completion,
  date,
  onUpdate,
}: {
  habit: Habit;
  completion: HabitCompletion | null;
  date: string;
  onUpdate: () => void;
}) {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState<number>(completion?.value ?? 0);
  const [showInput, setShowInput] = useState(false);
  const status = completion?.status;

  const { mutate: logCompletion, isPending } = useMutation({
    mutationFn: ({ s, v, note }: { s: CompletionStatus; v?: number; note?: string }) =>
      completionsApi.log(habit._id, date, s, v, note),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['completions'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); onUpdate(); },
    onError: () => toast.error('Failed to update'),
  });

  const handleBinaryToggle = () => {
    if (status === 'completed') {
      logCompletion({ s: 'missed' });
    } else {
      logCompletion({ s: 'completed', v: habit.target });
      toast.success(`${habit.name} ✓`, { duration: 1500 });
    }
  };

  const handleQuantitySubmit = (value: number) => {
    const s: CompletionStatus = value >= habit.target ? 'completed' : value > 0 ? 'partial' : 'missed';
    logCompletion({ s, v: value });
    setShowInput(false);
    if (s === 'completed') toast.success(`${habit.name} ✓`, { duration: 1500 });
  };

  const handleSkip = () => logCompletion({ s: 'skipped' });

  const statusColors: Record<string, string> = {
    completed: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20',
    partial: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20',
    skipped: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20',
    missed: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
  };

  const completionPct = habit.target > 0 ? Math.min(100, Math.round(((completion?.value ?? 0) / habit.target) * 100)) : (status === 'completed' ? 100 : 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-4 border transition-all ${status ? statusColors[status] : 'hover:border-surface-300'}`}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${habit.color}25` }}>
          {habit.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-surface-900 dark:text-surface-100 truncate">{habit.name}</p>
            {status === 'skipped' && <span className="badge bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Skipped</span>}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs text-surface-400">
              {habit.type === 'binary' || habit.type === 'avoidance'
                ? habit.name
                : `${completion?.value ?? 0} / ${habit.target} ${habit.unit}`}
            </p>
            {status === 'completed' && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Done</span>}
          </div>

          {/* Progress bar for quantity/duration */}
          {['quantity', 'duration', 'count'].includes(habit.type) && (
            <div className="mt-2 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Binary / Avoidance */}
          {(habit.type === 'binary' || habit.type === 'avoidance') && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBinaryToggle}
              disabled={isPending}
              id={`habit-complete-${habit._id}`}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all touch-target ${
                status === 'completed'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
              aria-label={status === 'completed' ? 'Mark as missed' : 'Mark as completed'}
            >
              <Check size={18} strokeWidth={2.5} />
            </motion.button>
          )}

          {/* Quantity / Duration / Count */}
          {['quantity', 'duration', 'count'].includes(habit.type) && (
            <div className="flex items-center gap-1">
              {showInput ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => setInputValue(Math.max(0, inputValue - 1))} className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-600">
                    <MinusIcon size={14} />
                  </button>
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(Number(e.target.value))}
                    className="w-16 text-center border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-900 text-sm py-1.5 px-2 font-medium"
                    min={0}
                    max={habit.target * 3}
                  />
                  <button onClick={() => setInputValue(Math.min(habit.target * 3, inputValue + 1))} className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-600">
                    <Plus size={14} />
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleQuantitySubmit(inputValue)}
                    className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center"
                  >
                    <Check size={14} />
                  </motion.button>
                  <button onClick={() => setShowInput(false)} className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 flex items-center justify-center">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setInputValue(completion?.value ?? 0); setShowInput(true); }}
                  id={`habit-update-${habit._id}`}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all touch-target ${
                    status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                  aria-label="Update progress"
                >
                  {status === 'completed' ? <Check size={18} strokeWidth={2.5} /> : <Plus size={18} />}
                </motion.button>
              )}
            </div>
          )}

          {/* Skip */}
          {status !== 'skipped' && (
            <button
              onClick={handleSkip}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors touch-target"
              aria-label="Skip habit"
              title="Skip"
            >
              <SkipForward size={15} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function TrackPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const queryClient = useQueryClient();
  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const { data: dayView, isLoading } = useQuery({
    queryKey: ['completions', 'day', dateStr],
    queryFn: () => completionsApi.getDay(dateStr),
    enabled: viewMode === 'day',
  });

  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsApi.getAll(),
  });

  const goBack = () => setCurrentDate((d) => subDays(d, 1));
  const goForward = () => setCurrentDate((d) => addDays(d, 1));
  const goToday = () => setCurrentDate(new Date());

  const completed = dayView?.habits.filter((h) => h.completion?.status === 'completed').length ?? 0;
  const total = dayView?.totalScheduled ?? 0;

  return (
    <div className="space-y-5">
      {/* View tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
          {VIEW_TABS.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              id={`track-view-${mode}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === mode
                  ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Day view */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Date navigator */}
          <div className="flex items-center justify-between">
            <button onClick={goBack} className="btn-ghost px-3" id="track-prev-day">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="font-bold text-surface-900 dark:text-surface-50">
                {isToday(currentDate) ? 'Today' : format(currentDate, 'EEEE')}
              </p>
              <p className="text-sm text-surface-400">{format(currentDate, 'MMMM d, yyyy')}</p>
              {!isToday(currentDate) && (
                <button onClick={goToday} className="text-xs text-primary-600 dark:text-primary-400 hover:underline mt-0.5">
                  Jump to today
                </button>
              )}
            </div>
            <button onClick={goForward} className="btn-ghost px-3" id="track-next-day" disabled={isFuture(addDays(currentDate, 1)) && false}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Progress summary */}
          {total > 0 && (
            <div className="card p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-surface-700 dark:text-surface-300">{completed}/{total} habits</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {total > 0 ? Math.round((completed / total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                    animate={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Habits list */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
            </div>
          ) : dayView?.habits.length === 0 ? (
            <div className="text-center py-16 card">
              <p className="text-4xl mb-3">😴</p>
              <p className="font-semibold text-surface-900 dark:text-surface-100">No habits scheduled</p>
              <p className="text-sm text-surface-400 mt-1">No habits are scheduled for this day.</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-3">
                {dayView?.habits.map(({ habit, completion }: DayHabitEntry) => (
                  <HabitCompletionCard
                    key={habit._id}
                    habit={habit}
                    completion={completion}
                    date={dateStr}
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ['completions', 'day', dateStr] })}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      )}

      {viewMode === 'week' && <WeekMatrix habits={habits ?? []} />}
      {viewMode === 'month' && <MonthCalendar habits={habits ?? []} />}
      {viewMode === 'year' && <YearHeatmap habits={habits ?? []} />}
    </div>
  );
}
