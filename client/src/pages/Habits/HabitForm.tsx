import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { habitsApi } from '../../api/habits';
import type { Habit } from '../../types';
import { HABIT_CATEGORIES, HABIT_ICONS, HABIT_COLORS } from '../../types';

interface HabitFormData {
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
}

const TYPE_INFO: Record<string, { label: string; defaultUnit: string; defaultTarget: number; description: string }> = {
  binary: { label: '✅ Binary', defaultUnit: 'times', defaultTarget: 1, description: 'Simple yes/no completion' },
  quantity: { label: '📊 Quantity', defaultUnit: 'litres', defaultTarget: 2, description: 'Track a measurable amount' },
  count: { label: '🔢 Count', defaultUnit: 'reps', defaultTarget: 10, description: 'Count repetitions or occurrences' },
  duration: { label: '⏱️ Duration', defaultUnit: 'minutes', defaultTarget: 30, description: 'Track time spent' },
  avoidance: { label: '🚫 Avoidance', defaultUnit: 'day', defaultTarget: 1, description: 'Track something to avoid' },
};

export default function HabitForm({
  habit,
  onClose,
  onSave,
}: {
  habit: Habit | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!habit;

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<HabitFormData>({
    defaultValues: {
      name: habit?.name ?? '',
      description: habit?.description ?? '',
      category: habit?.category ?? 'Health',
      icon: habit?.icon ?? '✅',
      color: habit?.color ?? '#6366f1',
      priority: habit?.priority ?? 'medium',
      type: habit?.type ?? 'binary',
      target: habit?.target ?? 1,
      unit: habit?.unit ?? 'times',
      frequency: habit?.schedule.frequency ?? 'daily',
      days: habit?.schedule.days ?? [],
      timesPerWeek: habit?.schedule.timesPerWeek ?? 3,
      timesPerMonth: habit?.schedule.timesPerMonth ?? 10,
      everyXDays: habit?.schedule.everyXDays ?? 2,
      reminderEnabled: habit?.reminder.enabled ?? false,
      reminderTime: habit?.reminder.times?.[0] ?? '08:00',
      startDate: habit?.startDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    },
  });

  const habitType = watch('type');
  const frequency = watch('frequency');
  const selectedDays = watch('days');

  // Auto-set unit when type changes
  useEffect(() => {
    const info = TYPE_INFO[habitType];
    if (info && !isEdit) {
      setValue('unit', info.defaultUnit);
      setValue('target', info.defaultTarget);
    }
  }, [habitType]);

  const { mutate } = useMutation({
    mutationFn: (data: HabitFormData) => {
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
      } as any;

      return isEdit ? habitsApi.update(habit!._id, payload) : habitsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Habit updated!' : 'Habit created! 🎉');
      onSave();
    },
    onError: () => toast.error('Failed to save habit'),
  });

  const toggleDay = (day: number) => {
    const current = selectedDays ?? [];
    setValue('days', current.includes(day) ? current.filter((d) => d !== day) : [...current, day]);
  };

  const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-surface-300 dark:bg-surface-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800 sticky top-0 bg-white dark:bg-surface-900">
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
            {isEdit ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800" id="habit-form-close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutate(d))} className="p-5 space-y-5" id="habit-form">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Habit Name *</label>
            <input {...register('name', { required: 'Name is required' })} id="habit-name" className="input" placeholder="e.g. Morning Meditation" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Icon + Color row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Icon</label>
              <div className="grid grid-cols-6 gap-1.5 max-h-28 overflow-y-auto scrollbar-hide">
                {HABIT_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue('icon', emoji)}
                    className={`text-xl p-1.5 rounded-xl transition-all ${watch('icon') === emoji ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : 'hover:bg-surface-100 dark:hover:bg-surface-800'}`}
                    id={`habit-icon-${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Color</label>
              <div className="grid grid-cols-5 gap-2">
                {HABIT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`w-8 h-8 rounded-xl transition-all ${watch('color') === color ? 'ring-2 ring-offset-2 ring-surface-400' : ''}`}
                    style={{ backgroundColor: color }}
                    id={`habit-color-${color}`}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Category</label>
              <select {...register('category')} id="habit-category" className="input">
                {HABIT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Priority</label>
              <select {...register('priority')} id="habit-priority" className="input">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>

          {/* Habit Type */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Habit Type</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(TYPE_INFO).map(([type, info]) => (
                <label key={type} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  habitType === type
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                }`}>
                  <input {...register('type')} type="radio" value={type} id={`habit-type-${type}`} className="hidden" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-surface-900 dark:text-surface-100">{info.label}</p>
                    <p className="text-xs text-surface-400">{info.description}</p>
                  </div>
                  {habitType === type && <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>}
                </label>
              ))}
            </div>
          </div>

          {/* Target + Unit (non-binary) */}
          {habitType !== 'binary' && habitType !== 'avoidance' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Target</label>
                <input {...register('target', { required: true, min: 0 })} type="number" step="0.1" id="habit-target" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Unit</label>
                <input {...register('unit')} id="habit-unit" className="input" placeholder="minutes, pages, litres…" />
              </div>
            </div>
          )}

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Schedule</label>
            <select {...register('frequency')} id="habit-frequency" className="input mb-3">
              <option value="daily">Every Day</option>
              <option value="specific_days">Specific Days</option>
              <option value="x_per_week">X Times Per Week</option>
              <option value="x_per_month">X Times Per Month</option>
              <option value="every_x_days">Every X Days</option>
              <option value="monthly">Monthly</option>
            </select>

            {frequency === 'specific_days' && (
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    id={`habit-day-${DAY_LABELS[i].toLowerCase()}`}
                    className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                      (selectedDays ?? []).includes(i)
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                    }`}
                    aria-label={DAY_LABELS[i]}
                    aria-pressed={(selectedDays ?? []).includes(i)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {frequency === 'x_per_week' && (
              <div className="flex items-center gap-2">
                <input {...register('timesPerWeek')} type="number" min={1} max={7} className="input w-24" id="habit-times-per-week" />
                <span className="text-sm text-surface-500">times per week</span>
              </div>
            )}

            {frequency === 'x_per_month' && (
              <div className="flex items-center gap-2">
                <input {...register('timesPerMonth')} type="number" min={1} max={31} className="input w-24" id="habit-times-per-month" />
                <span className="text-sm text-surface-500">times per month</span>
              </div>
            )}

            {frequency === 'every_x_days' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-surface-500">Every</span>
                <input {...register('everyXDays')} type="number" min={1} className="input w-24" id="habit-every-x-days" />
                <span className="text-sm text-surface-500">days</span>
              </div>
            )}
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-surface-100 dark:border-surface-800">
            <div className="flex-1">
              <p className="font-medium text-sm text-surface-900 dark:text-surface-100">Reminder</p>
              <p className="text-xs text-surface-400">Get notified to complete this habit</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input {...register('reminderEnabled')} type="checkbox" id="habit-reminder-enabled" className="sr-only peer" />
              <div className="w-10 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
            </label>
          </div>

          {watch('reminderEnabled') && (
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Reminder Time</label>
              <input {...register('reminderTime')} type="time" id="habit-reminder-time" className="input w-40" />
            </div>
          )}

          {/* Start date */}
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Start Date</label>
            <input {...register('startDate')} type="date" id="habit-start-date" className="input w-48" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1" id="habit-form-cancel">Cancel</button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
              id="habit-form-save"
            >
              <Save size={16} />
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Habit' : 'Create Habit'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
