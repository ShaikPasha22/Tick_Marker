import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Target, Trash2, X, Calendar, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, getDaysInMonth, getDay, addMonths, subMonths, isToday, startOfWeek, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { goalsApi } from '../../api/goals';
import { habitsApi } from '../../api/habits';
import { completionsApi } from '../../api/completions';
import { analyticsApi } from '../../api/analytics';
import type { Goal } from '../../types';


function GoalCard({
  goal,
  onEdit,
  onDelete,
  onProgressChange,
  isDoneToday,
  onToggleDoneToday,
  onOpenDetails,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onProgressChange: (val: number) => void;
  isDoneToday: boolean;
  onToggleDoneToday: () => void;
  onOpenDetails: () => void;
}) {
  const progress = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
  const remaining = Math.max(0, goal.targetValue - goal.currentValue);


  // Fetch streak if linked to a habit
  const { data: streak } = useQuery({
    queryKey: ['habit-streak', goal.habitId],
    queryFn: () => habitsApi.getStreak(goal.habitId!),
    enabled: !!goal.habitId,
    staleTime: 60 * 1000,
  });



  const statusColors = {
    active: 'border-primary-200 dark:border-primary-800',
    completed: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10',
    paused: 'border-amber-200 dark:border-amber-800',
    abandoned: 'border-surface-200 opacity-60',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onOpenDetails}
      className={`card p-5 border cursor-pointer hover:shadow-md transition-shadow ${statusColors[goal.status]}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Target size={18} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-bold text-surface-900 dark:text-surface-100">{goal.title}</h3>
            {goal.category && (
              <span className="badge bg-surface-100 dark:bg-surface-800 text-surface-500 text-[10px]">{goal.category}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Done Today checkoff button */}
          {goal.habitId ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleDoneToday(); }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all
                ${isDoneToday
                  ? 'bg-emerald-500 text-white border-transparent shadow-sm'
                  : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                }`}
              title="Click to toggle check-in for today"
            >
              {isDoneToday ? '✓ Done Today' : 'Mark Done Today'}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onProgressChange(goal.currentValue + 1);
                toast.success('Goal progress updated! +1');
              }}
              className="px-3 py-1.5 rounded-xl border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            >
              Log Progress
            </button>
          )}

          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
            <Edit2 size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-surface-500 mb-4">{goal.description}</p>
      )}

      {/* Progress & Quick Controls */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {goal.currentValue}
              <span className="text-base font-normal text-surface-400"> / {goal.targetValue} {goal.unit}</span>
            </span>

            {/* Quick progress update buttons */}
            <div className="flex items-center gap-1.5 ml-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onProgressChange(Math.max(0, goal.currentValue - 1)); }}
                className="w-7 h-7 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center text-sm font-semibold text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                title="Decrease"
              >
                -
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onProgressChange(Math.min(goal.targetValue, goal.currentValue + 1)); }}
                className="w-7 h-7 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center justify-center text-sm font-semibold text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                title="Increase"
              >
                +
              </button>
            </div>
          </div>
          <span className={`text-lg font-bold ${progress >= 100 ? 'text-emerald-500' : 'text-primary-600 dark:text-primary-400'}`}>
            {progress}%
          </span>
        </div>
        <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary-500 to-purple-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-surface-400 flex-wrap">
        {remaining > 0 && (
          <span>📌 {remaining} {goal.unit} remaining</span>
        )}
        {goal.deadline && (
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {format(new Date(goal.deadline), 'MMM d, yyyy')}
          </span>
        )}
        {goal.habitId && (
          <span className="flex items-center gap-1 text-primary-500 font-medium">
            🔄 Syncing to Habit
          </span>
        )}
        {streak && streak.current > 0 && (
          <span className="flex items-center gap-1 text-orange-500 font-bold bg-orange-50 dark:bg-orange-950/20 px-2 py-0.5 rounded-lg text-[10px]">
            🔥 {streak.current} day streak
          </span>
        )}
        {progress >= 100 && (
          <span className="text-emerald-500 font-semibold">🎉 Goal achieved!</span>
        )}
      </div>
    </motion.div>
  );
}

function GoalOverviewView({
  goal: initialGoal,
  onBack,
  isDoneToday,
  onToggleDoneToday,
}: {
  goal: Goal;
  onBack: () => void;
  isDoneToday: boolean;
  onToggleDoneToday: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: freshGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.getAll,
  });
  const goal = freshGoals?.find((g: Goal) => g._id === initialGoal._id) || initialGoal;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [trackerTab, setTrackerTab] = useState<'weekly' | 'monthly' | 'heatmap'>('monthly');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const startDayOfWeek = (getDay(monthStart) + 6) % 7; // Monday = 0

  const fromStr = format(monthStart, 'yyyy-MM-dd');
  const toStr = format(monthEnd, 'yyyy-MM-dd');

  // Query habit completions for this month
  const { data: completions } = useQuery({
    queryKey: ['goal-completions', goal._id, fromStr, toStr],
    queryFn: () => completionsApi.getRange(fromStr, toStr, goal.habitId),
    enabled: !!goal.habitId,
  });

  // Query habit streak
  const { data: streak } = useQuery({
    queryKey: ['habit-streak', goal.habitId],
    queryFn: () => habitsApi.getStreak(goal.habitId!),
    enabled: !!goal.habitId,
  });

  // Query heatmap data
  const { data: heatmapData } = useQuery({
    queryKey: ['goal-heatmap', goal.habitId, heatmapYear],
    queryFn: () => analyticsApi.getHeatmap(heatmapYear, goal.habitId!),
    enabled: !!goal.habitId && trackerTab === 'heatmap',
  });

  const getDayStatus = (day: number) => {
    if (!completions) return null;
    const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
    return completions.find((c) => c.date.slice(0, 10) === dateStr)?.status;
  };

  const getCompletionRecordForDate = (date: Date) => {
    if (!completions) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return completions.find((c) => c.date.slice(0, 10) === dateStr);
  };

  const handleCellClick = (date: Date) => {
    if (!goal.habitId) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = getCompletionRecordForDate(date);

    const refreshQueries = () => {
      queryClient.invalidateQueries({ queryKey: ['goal-completions'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      queryClient.invalidateQueries({ queryKey: ['goal-heatmap'] });
    };

    if (!existing) {
      completionsApi.log(goal.habitId, dateStr, 'completed').then(refreshQueries);
    } else if (existing.status === 'completed') {
      completionsApi.log(goal.habitId, dateStr, 'missed').then(refreshQueries);
    } else {
      completionsApi.delete(existing._id).then(refreshQueries);
    }
  };

  const totalTrackedDays = completions?.filter((c) => c.status === 'completed').length ?? 0;
  const progressPct = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
  const daysLeft = goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;

  // Circular progress stroke helpers
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  // Weekly view days
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Heatmap rendering helpers
  const getHeatmapColor = (rate: number) => {
    if (rate === 0) return 'var(--cell-bg, #f3f4f6)';
    if (rate < 25) return '#dcfce7'; // green-100
    if (rate < 50) return '#bbf7d0'; // green-200
    if (rate < 75) return '#4ade80'; // green-400
    return '#16a34a'; // green-600
  };

  // Slice heatmap data for a compact 12-week tracker (last 84 days ending on today)
  const getCompactWeeks = () => {
    if (!heatmapData?.heatmap) return [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayIdx = heatmapData.heatmap.findIndex((day) => day.date === todayStr);

    const endIdx = todayIdx !== -1 ? todayIdx + 1 : heatmapData.heatmap.length;
    const startIdx = Math.max(0, endIdx - 84);
    const recent = heatmapData.heatmap.slice(startIdx, endIdx);

    const grid: (typeof recent[0])[][] = [];
    for (let i = 0; i < recent.length; i += 7) {
      grid.push(recent.slice(i, i + 7));
    }
    return grid;
  };

  const compactWeeks = getCompactWeeks();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header back bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-ghost flex items-center gap-1.5 text-sm font-semibold text-surface-600 dark:text-surface-300"
        >
          ← Back to Goals
        </button>
        <span className="text-xs font-bold text-surface-400 uppercase">Goal Overview</span>
      </div>

      {/* Broad Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Circular progress & primary actions */}
        <div className="card p-6 border flex flex-col items-center justify-center text-center space-y-4 md:col-span-1">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Circle Progress */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-surface-100 dark:stroke-surface-800 fill-transparent"
                strokeWidth={strokeWidth}
              />
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-primary-500 fill-transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
                transform="rotate(-90 72 72)"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-surface-900 dark:text-surface-50">{progressPct}%</span>
              <span className="text-[10px] uppercase font-bold text-surface-400 tracking-wider">completed</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-surface-900 dark:text-surface-50">{goal.title}</h3>
            {goal.category && (
              <span className="badge mt-1.5 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-xs px-2.5">
                {goal.category}
              </span>
            )}
          </div>

          <div className="text-sm font-medium text-surface-600 dark:text-surface-300">
            <span>{goal.currentValue}</span>
            <span className="text-surface-400"> / {goal.targetValue} {goal.unit}</span>
          </div>

          {/* Quick Check-in — always shown, works for all goals */}
          <button
            onClick={onToggleDoneToday}
            className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all
              ${isDoneToday
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
          >
            {isDoneToday ? '✓ Done Today' : 'Mark Done Today'}
          </button>
        </div>

        {/* Right: Streaks, details and custom views */}
        <div className="card p-6 border md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wide">Flame Streak</span>
              <span className="text-xl font-black text-orange-500 mt-1 flex items-center gap-1">
                🔥 {streak?.current ?? 0} days
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wide">Longest Streak</span>
              <span className="text-xl font-black text-surface-800 dark:text-surface-100 mt-1">
                ⚡ {streak?.longest ?? 0} days
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wide">Tracked Days</span>
              <span className="text-xl font-black text-emerald-500 mt-1">
                ✓ {totalTrackedDays} days
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wide">Time Remaining</span>
              <span className="text-xl font-black text-blue-500 mt-1">
                ⏰ {daysLeft !== null ? `${daysLeft} days` : '∞'}
              </span>
            </div>
          </div>

          {goal.description && (
            <div className="p-3 bg-surface-50 dark:bg-surface-800/40 rounded-xl border">
              <p className="text-[10px] font-bold text-surface-400 uppercase mb-1">Goal Description</p>
              <p className="text-sm text-surface-600 dark:text-surface-300">{goal.description}</p>
            </div>
          )}

          {/* Selector Tab for Weekly/Monthly/Heatmap — always shown */}
          <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1 w-full sm:w-auto">
            {(['weekly', 'monthly', 'heatmap'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTrackerTab(tab)}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  trackerTab === tab
                    ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                    : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
              >
                {tab === 'heatmap' ? 'Heatmap 📊' : `${tab} View`}
              </button>
            ))}
          </div>

          {/* Selected tracker layout */}
          <div className="space-y-4 pt-2 border-t">
            {trackerTab === 'weekly' ? (
              /* WEEKLY CHECK-IN TIMELINE */
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Weekly Activity</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {weekDays.map((day) => {
                    const record = getCompletionRecordForDate(day);
                    const isDone = record?.status === 'completed';
                    const isGoalStart = format(day, 'yyyy-MM-dd') === goal.createdAt.slice(0, 10);
                    const isGoalEnd = goal.deadline && format(day, 'yyyy-MM-dd') === goal.deadline.slice(0, 10);

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => handleCellClick(day)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/40
                          ${isDone ? 'border-emerald-100 bg-emerald-50/10 text-emerald-800 font-medium' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold
                            ${isToday(day) ? 'bg-primary-500 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600'}`}>
                            <span>{format(day, 'EEE')}</span>
                            <span className="text-xs -mt-1">{format(day, 'd')}</span>
                          </span>
                          <div>
                            <span className="text-xs font-semibold">
                              {isDone ? '🎯 Checked in for Goal' : 'No Activity'}
                            </span>
                            <div className="flex gap-1 mt-0.5">
                              {isGoalStart && <span className="text-[7px] text-blue-500 font-bold bg-blue-50 px-1 rounded">🚩 Start</span>}
                              {isGoalEnd && <span className="text-[7px] text-red-500 font-bold bg-red-50 px-1 rounded">🏁 Target</span>}
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs ${isDone ? 'text-emerald-500 font-bold' : 'text-surface-300'}`}>✓</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : trackerTab === 'monthly' ? (
              /* MONTHLY INTERACTIVE CALENDAR */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Monthly Calendar</h4>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-surface-100">
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs font-bold text-surface-800 dark:text-surface-200 min-w-[80px] text-center">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-surface-100">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="border rounded-xl p-3 bg-white dark:bg-surface-900">
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((h, i) => (
                      <span key={i} className="text-[10px] font-bold text-surface-400">{h}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const status = getDayStatus(day);
                      const isGoalStart = format(dateObj, 'yyyy-MM-dd') === goal.createdAt.slice(0, 10);
                      const isGoalEnd = goal.deadline && format(dateObj, 'yyyy-MM-dd') === goal.deadline.slice(0, 10);

                      const statusColors = {
                        completed: 'bg-emerald-500 text-white font-bold',
                        missed: 'bg-red-100 dark:bg-red-950/20 text-red-500 font-bold',
                        skipped: 'bg-amber-100 dark:bg-amber-950/20 text-amber-500 font-bold',
                      };
                      const isCellToday = isToday(dateObj);

                      return (
                        <button
                          key={day}
                          onClick={() => handleCellClick(dateObj)}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition-all hover:scale-105 active:scale-95 relative
                            ${status 
                              ? statusColors[status as keyof typeof statusColors] 
                              : 'bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 text-surface-700 dark:text-surface-300'
                            } ${isCellToday ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900' : ''}`}
                        >
                          <span>{day}</span>
                          <div className="absolute bottom-0.5 flex gap-0.5">
                            {isGoalStart && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Goal Started" />}
                            {isGoalEnd && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Goal Target Deadline" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 justify-between mt-3 pt-3 border-t text-[9px] text-surface-400 flex-wrap">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded" /> Completed</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-100 rounded" /> Missed</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-100 rounded" /> Skipped</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Started</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> Deadline</div>
                  </div>
                </div>
              </div>
            ) : (
              /* COMPACT HEATMAP CONTRIBUTION GRID (12-WEEKS) */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider">Goal Heatmap (Last 12 Weeks)</h4>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setHeatmapYear((y) => y - 1)} className="p-1 rounded hover:bg-surface-100">
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs font-bold text-surface-800 dark:text-surface-200">{heatmapYear}</span>
                    <button onClick={() => setHeatmapYear((y) => y + 1)} className="p-1 rounded hover:bg-surface-100" disabled={heatmapYear >= new Date().getFullYear()}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="border rounded-xl p-4 bg-white dark:bg-surface-900 overflow-x-auto scrollbar-hide">
                  {compactWeeks.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-[3px]">
                        {compactWeeks.map((week, colIdx) => (
                          <div key={colIdx} className="flex flex-col gap-[3px]">
                            {week.map((day) => {
                              if (!day) return null;
                              const isGoalStart = day.date === goal.createdAt.slice(0, 10);
                              const isGoalEnd = goal.deadline && day.date === goal.deadline.slice(0, 10);

                              return (
                                <div
                                  key={day.date}
                                  title={`${day.date}: ${day.completed ? 'Goal Pursued ✓' : 'No Check-in'} (${day.rate}%)`}
                                  className={`w-[11px] h-[11px] rounded-sm transition-all hover:scale-110 relative
                                    ${isGoalStart ? 'ring-1 ring-blue-500 ring-offset-1' : ''}
                                    ${isGoalEnd ? 'ring-1 ring-red-500 ring-offset-1' : ''}`}
                                  style={{
                                    backgroundColor: getHeatmapColor(day.rate),
                                  }}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-surface-400 mt-3">
                        <span>Less</span>
                        {[0, 25, 50, 75, 100].map((v) => (
                          <div key={v} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getHeatmapColor(v) }} />
                        ))}
                        <span>More</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-surface-400">Loading heatmap...</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
function GoalFormModal({
  goal,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      title: goal?.title ?? '',
      description: goal?.description ?? '',
      targetValue: goal?.targetValue ?? 10,
      currentValue: goal?.currentValue ?? 0,
      unit: goal?.unit ?? 'times',
      deadline: goal?.deadline ? goal.deadline.slice(0, 10) : '',
      category: goal?.category ?? '',
      status: goal?.status ?? 'active',
      // Always auto-create a linked habit for every new goal so full tracking features are available
      createLinkedHabit: !goal,
    },
  });

  const { mutate } = useMutation({
    mutationFn: (data: any) =>
      goal ? goalsApi.update(goal._id, data) : goalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success(goal ? 'Goal updated!' : 'Goal created!');
      onSave();
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">{goal ? 'Edit Goal' : 'New Goal'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4" id="goal-form">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Goal Title *</label>
            <input {...register('title', { required: true })} id="goal-title" className="input" placeholder="Read 20 books this year" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Target</label>
              <input {...register('targetValue')} type="number" id="goal-target" className="input" min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Unit</label>
              <input {...register('unit')} id="goal-unit" className="input" placeholder="books, hours…" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Current Progress</label>
            <input {...register('currentValue')} type="number" id="goal-current" className="input" min={0} />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Deadline (optional)</label>
            <input {...register('deadline')} type="date" id="goal-deadline" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Description (optional)</label>
            <textarea {...register('description')} id="goal-description" rows={2} className="input resize-none" placeholder="Why is this goal important?" />
          </div>

          {!goal && (
            <div className="flex items-center gap-2 mt-2 border-t border-surface-100 dark:border-surface-800 pt-3 text-xs text-surface-400">
              <span>🎯</span>
              <span>A daily tracking habit will be auto-created so you can track this goal on the calendar &amp; heatmap.</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center" id="goal-save-btn">
              {isSubmitting ? 'Saving…' : goal ? 'Update Goal' : 'Create Goal'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function GoalsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [selectedDetailsGoal, setSelectedDetailsGoal] = useState<Goal | null>(null);
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.getAll,
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: todayView } = useQuery({
    queryKey: ['completions', 'day', todayStr],
    queryFn: () => completionsApi.getDay(todayStr),
  });

  const logCompletionMutation = useMutation({
    mutationFn: ({ habitId, status }: { habitId: string; status: 'completed' | 'missed' }) =>
      completionsApi.log(habitId, todayStr, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['habit-streak'] });
      queryClient.invalidateQueries({ queryKey: ['goal-completions'] });
      queryClient.invalidateQueries({ queryKey: ['goal-heatmap'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Goal> }) => goalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); toast.success('Goal deleted'); },
  });

  const checkIsDoneToday = (habitId?: string) => {
    if (!habitId || !todayView) return false;
    return todayView.habits.some(
      (h) => h.habit._id === habitId && h.completion?.status === 'completed'
    );
  };

  const handleToggleDoneToday = async (goal: Goal) => {
    let habitId = goal.habitId;

    // Auto-create a linked habit for existing goals that don't have one yet
    if (!habitId) {
      try {
        const updatedGoal = await goalsApi.update(goal._id, { createLinkedHabit: true } as any);
        habitId = updatedGoal?.habitId;
        await queryClient.invalidateQueries({ queryKey: ['goals'] });
        if (!habitId) { toast.error('Could not create tracking habit'); return; }
      } catch {
        toast.error('Could not create tracking habit'); return;
      }
    }

    const isDone = checkIsDoneToday(habitId);
    logCompletionMutation.mutate({
      habitId,
      status: isDone ? 'missed' : 'completed',
    });
  };

  const handleProgressAdjustment = (goal: Goal, newProgress: number) => {
    if (goal.habitId) {
      const isDone = checkIsDoneToday(goal.habitId);
      const isIncrease = newProgress > goal.currentValue;
      if (isIncrease && !isDone) {
        logCompletionMutation.mutate({ habitId: goal.habitId, status: 'completed' });
        toast.success('Goal check-in completed for today!');
      } else if (!isIncrease && isDone) {
        logCompletionMutation.mutate({ habitId: goal.habitId, status: 'missed' });
        toast.success('Goal check-in removed for today!');
      } else {
        toast.error(isIncrease ? 'Already checked in for today!' : 'Not checked in for today!');
      }
    } else {
      updateMutation.mutate({ id: goal._id, data: { currentValue: newProgress } });
    }
  };

  const active = goals?.filter((g) => g.status === 'active') ?? [];
  const completed = goals?.filter((g) => g.status === 'completed') ?? [];

  if (selectedDetailsGoal) {
    return (
      <GoalOverviewView
        goal={selectedDetailsGoal}
        onBack={() => setSelectedDetailsGoal(null)}
        isDoneToday={checkIsDoneToday(selectedDetailsGoal.habitId)}
        onToggleDoneToday={() => handleToggleDoneToday(selectedDetailsGoal)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Goals</h2>
          <p className="text-sm text-surface-400">{active.length} active goal{active.length !== 1 ? 's' : ''}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setEditGoal(null); setShowForm(true); }}
          className="btn-primary"
          id="goals-create-btn"
        >
          <Plus size={16} /> New Goal
        </motion.button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
      ) : active.length === 0 && completed.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-5xl mb-4">🎯</p>
          <h3 className="font-bold text-surface-900 dark:text-surface-100 text-lg mb-2">No goals yet</h3>
          <p className="text-surface-400 mb-5 text-sm">Set long-term goals to stay motivated and track progress.</p>
          <button onClick={() => { setEditGoal(null); setShowForm(true); }} className="btn-primary">
            <Plus size={16} /> Create Your First Goal
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-surface-700 dark:text-surface-300 text-sm uppercase tracking-wide">Active</h3>
              <AnimatePresence>
                {active.map((goal) => (
                  <GoalCard
                    key={goal._id}
                    goal={goal}
                    onEdit={() => { setEditGoal(goal); setShowForm(true); }}
                    onDelete={() => { if (confirm('Delete this goal?')) deleteMutation.mutate(goal._id); }}
                    onProgressChange={(newProgress) => handleProgressAdjustment(goal, newProgress)}
                    isDoneToday={checkIsDoneToday(goal.habitId)}
                    onToggleDoneToday={() => handleToggleDoneToday(goal)}
                    onOpenDetails={() => setSelectedDetailsGoal(goal)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-surface-700 dark:text-surface-300 text-sm uppercase tracking-wide">Completed 🎉</h3>
              {completed.map((goal) => (
                <GoalCard
                  key={goal._id}
                  goal={goal}
                  onEdit={() => { setEditGoal(goal); setShowForm(true); }}
                  onDelete={() => deleteMutation.mutate(goal._id)}
                  onProgressChange={(newProgress) => handleProgressAdjustment(goal, newProgress)}
                  isDoneToday={checkIsDoneToday(goal.habitId)}
                  onToggleDoneToday={() => handleToggleDoneToday(goal)}
                  onOpenDetails={() => setSelectedDetailsGoal(goal)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showForm && (
          <GoalFormModal
            goal={editGoal}
            onClose={() => { setShowForm(false); setEditGoal(null); }}
            onSave={() => { setShowForm(false); setEditGoal(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
