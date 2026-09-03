import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { goalsApi } from '../../api/goals';
import { habitsApi } from '../../api/habits';
import type { Habit, Goal } from '../../types';
import { HABIT_CATEGORIES, HABIT_ICONS, HABIT_COLORS } from '../../types';

interface TrackerFormData {
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  priority: string;
  type: string;
  target: number;
  unit: string;
  frequency: string;
  days: number[];
  timesPerWeek: number;
  timesPerMonth: number;
  everyXDays: number;
  reminderEnabled: boolean;
  reminderTime: string;
  startDate: string;
  showOnDashboard: boolean;
}

const TYPE_INFO: Record<string, { label: string; defaultUnit: string; defaultTarget: number; description: string }> = {
  binary: { label: '✅ Binary', defaultUnit: 'times', defaultTarget: 1, description: 'Simple yes/no completion' },
  quantity: { label: '📊 Quantity', defaultUnit: 'litres', defaultTarget: 2, description: 'Track a measurable amount' },
  count: { label: '🔢 Count', defaultUnit: 'reps', defaultTarget: 10, description: 'Count repetitions or occurrences' },
  duration: { label: '⏱️ Duration', defaultUnit: 'minutes', defaultTarget: 30, description: 'Track time spent' },
  avoidance: { label: '🚫 Avoidance', defaultUnit: 'day', defaultTarget: 1, description: 'Track something to avoid' },
};

export default function GoalTrackerFormModal({
  goal,
  tracker,
  onClose,
  onSave,
}: {
  goal: Goal;
  tracker: Habit | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!tracker;
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<TrackerFormData>({
    defaultValues: {
      name: tracker?.name ?? '',
      description: tracker?.description ?? '',
      category: tracker?.category ?? goal.category ?? 'Fitness',
      icon: tracker?.icon ?? '🎯',
      color: tracker?.color ?? '#6366f1',
      priority: tracker?.priority ?? 'medium',
      type: tracker?.type ?? 'binary',
      target: tracker?.target ?? 1,
      unit: tracker?.unit ?? 'times',
      frequency: tracker?.schedule.frequency ?? 'daily',
      days: tracker?.schedule.days ?? [],
      timesPerWeek: tracker?.schedule.timesPerWeek ?? 3,
      timesPerMonth: tracker?.schedule.timesPerMonth ?? 10,
      everyXDays: tracker?.schedule.everyXDays ?? 2,
      reminderEnabled: tracker?.reminder.enabled ?? false,
      reminderTime: tracker?.reminder.times?.[0] ?? '08:00',
      startDate: tracker?.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      showOnDashboard: tracker?.showOnDashboard ?? false, // Defaults to goal-specific (hidden on dashboard)
    },
  });

  const trackerType = watch('type');
  const frequency = watch('frequency');
  const selectedDays = watch('days');

  useEffect(() => {
    const info = TYPE_INFO[trackerType];
    if (info && !isEdit) {
      setValue('unit', info.defaultUnit);
      setValue('target', info.defaultTarget);
    }
  }, [trackerType]);

  const { mutate } = useMutation<any, Error, TrackerFormData>({
    mutationFn: async (data: TrackerFormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        category: data.category,
        icon: data.icon,
        color: data.color,
        priority: data.priority,
        type: data.type,
        target: Number(data.target),
        unit: data.unit,
        schedule: {
          frequency: data.frequency,
          days: data.frequency === 'specific_days' ? data.days : undefined,
          timesPerWeek: data.frequency === 'x_per_week' ? Number(data.timesPerWeek) : undefined,
          timesPerMonth: data.frequency === 'x_per_month' ? Number(data.timesPerMonth) : undefined,
          everyXDays: data.frequency === 'every_x_days' ? Number(data.everyXDays) : undefined,
        },
        reminder: {
          enabled: data.reminderEnabled,
          times: data.reminderEnabled ? [data.reminderTime] : [],
          snoozeMins: 10,
        },
        startDate: data.startDate,
        showOnDashboard: data.showOnDashboard,
        isGoalTracker: true,
      } as any;

      if (isEdit) {
        return habitsApi.update(tracker!._id, payload);
      } else {
        const res = await goalsApi.createTracker(goal._id, payload);
        return res.habit;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      queryClient.invalidateQueries({ queryKey: ['habit-streak'] });
      queryClient.invalidateQueries({ queryKey: ['goal-completions'] });
      queryClient.invalidateQueries({ queryKey: ['goal-heatmap'] });
      toast.success(isEdit ? 'Tracker updated!' : 'Tracker added to Goal!');
      onSave();
    },
    onError: () => toast.error('Failed to save tracker'),
  });

  const toggleDay = (day: number) => {
    const current = selectedDays ?? [];
    setValue('days', current.includes(day) ? current.filter((d) => d !== day) : [...current, day]);
  };

  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-700" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800">
          <div>
            <h3 className="font-bold text-surface-900 dark:text-surface-50 text-base">
              {isEdit ? 'Edit Tracker' : 'Add Tracker to Goal'}
            </h3>
            <p className="text-xs text-surface-400">Goal: {goal.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutate(d))} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-1.5">Tracker Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="input w-full"
              placeholder="e.g. 10 push-ups, drink 3L water"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-1.5">Category</label>
              <select {...register('category')} className="input w-full">
                {HABIT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-1.5">Priority</label>
              <select {...register('priority')} className="input w-full">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-2">Select Icon</label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
              {HABIT_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setValue('icon', emoji)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border shrink-0 transition-all ${
                    watch('icon') === emoji
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-600 scale-105'
                      : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-2">Select Color</label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
              {HABIT_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setValue('color', hex)}
                  className={`w-7 h-7 rounded-full shrink-0 transition-transform ${
                    watch('color') === hex ? 'scale-125 ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-surface-900' : ''
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-surface-100 dark:border-surface-800 pt-4">
            <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-2">Tracker Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(TYPE_INFO).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => !isEdit && setValue('type', key)}
                  disabled={isEdit}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center gap-1 transition-all ${
                    watch('type') === key
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-700 dark:text-primary-300 font-semibold'
                      : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400'
                  } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className="text-xs">{info.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-surface-400 mt-1.5">{TYPE_INFO[trackerType]?.description}</p>
          </div>

          {trackerType !== 'binary' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-1.5">Daily Target</label>
                <input
                  {...register('target', { min: 1 })}
                  type="number"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-1.5">Unit</label>
                <input
                  {...register('unit')}
                  className="input w-full"
                  placeholder="e.g. km, mins, glasses"
                />
              </div>
            </div>
          )}

          <div className="border-t border-surface-100 dark:border-surface-800 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-1.5">Frequency</label>
              <select {...register('frequency')} className="input w-full">
                <option value="daily">Every day</option>
                <option value="specific_days">Specific days of the week</option>
                <option value="x_per_week">X times per week</option>
                <option value="x_per_month">X times per month</option>
                <option value="every_x_days">Every X days</option>
              </select>
            </div>

            {frequency === 'specific_days' && (
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-2">Repeat on</label>
                <div className="flex gap-1.5">
                  {DAYS.map((label, idx) => {
                    const isSelected = selectedDays?.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`w-9 h-9 rounded-lg border text-xs font-bold transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-600'
                            : 'border-surface-200 dark:border-surface-800 text-surface-500'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {frequency === 'x_per_week' && (
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-1.5">Times per week</label>
                <input {...register('timesPerWeek', { min: 1, max: 7 })} type="number" className="input w-32" />
              </div>
            )}

            {frequency === 'x_per_month' && (
              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wide mb-1.5">Times per month</label>
                <input {...register('timesPerMonth', { min: 1, max: 31 })} type="number" className="input w-32" />
              </div>
            )}

            {frequency === 'every_x_days' && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Every</span>
                <input {...register('everyXDays', { min: 1 })} type="number" className="input w-20 text-center" />
                <span className="text-sm">days</span>
              </div>
            )}
          </div>

          <div className="border-t border-surface-100 dark:border-surface-800 pt-4 flex items-center justify-between">
            <div>
              <label className="block text-sm font-semibold text-surface-800 dark:text-surface-200">Show on Main Dashboard</label>
              <p className="text-xs text-surface-400">If enabled, this tracker will also appear on your main habits list &amp; dashboard.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('showOnDashboard')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="border-t border-surface-100 dark:border-surface-800 pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center gap-2">
              <Save size={16} />
              <span>{isSubmitting ? 'Saving...' : 'Save Tracker'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
