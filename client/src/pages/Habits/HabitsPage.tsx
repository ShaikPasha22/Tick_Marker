import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Pause, Play, MoreVertical, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { habitsApi } from '../../api/habits';
import { goalsApi } from '../../api/goals';
import type { Habit } from '../../types';
import HabitForm from './HabitForm';

function HabitCard({
  habit,
  linkedGoal,
  onEdit,
  onDelete,
  onPause,
  onResume,
}: {
  habit: Habit;
  linkedGoal?: any;
  onEdit: () => void;
  onDelete: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const frequencyLabel = {
    daily: 'Every day',
    specific_days: `${(habit.schedule.days ?? []).map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`,
    x_per_week: `${habit.schedule.timesPerWeek}x/week`,
    x_per_month: `${habit.schedule.timesPerMonth}x/month`,
    every_x_days: `Every ${habit.schedule.everyXDays} days`,
    monthly: 'Monthly',
  }[habit.schedule.frequency] || habit.schedule.frequency;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`card p-4 ${habit.status === 'archived' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: `${habit.color}25` }}>
          {habit.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">{habit.name}</h3>
            <span className="badge bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-[10px]">
              {habit.category}
            </span>
            {linkedGoal && (
              <Link
                to={`/goals?details=${linkedGoal._id}`}
                className="badge bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[10px] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
              >
                🎯 Goal: {linkedGoal.title}
              </Link>
            )}
            {habit.status === 'paused' && (
              <span className="badge bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px]">Paused</span>
            )}
            {habit.status === 'archived' && (
              <span className="badge bg-surface-200 dark:bg-surface-700 text-surface-500 text-[10px]">Archived</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
            <span>{habit.type}</span>
            <span>·</span>
            <span>
              {habit.type === 'binary' || habit.type === 'avoidance'
                ? habit.unit
                : `${habit.target} ${habit.unit}`}
            </span>
            <span>·</span>
            <span>{frequencyLabel}</span>
          </div>
        </div>

        {/* Priority dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${
          habit.priority === 'high' ? 'bg-red-400' :
          habit.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
        }`} title={`${habit.priority} priority`} />

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400"
            id={`habit-menu-${habit._id}`}
          >
            <MoreVertical size={16} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute right-0 top-full mt-1 w-44 card border border-surface-200 dark:border-surface-700 shadow-xl z-20 overflow-hidden py-1"
                onBlur={() => setMenuOpen(false)}
              >
                <button onClick={() => { onEdit(); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300">
                  <Edit2 size={14} /> Edit
                </button>
                {habit.status === 'active' ? (
                  <button onClick={() => { onPause(); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 text-amber-600 dark:text-amber-400">
                    <Pause size={14} /> Pause
                  </button>
                ) : habit.status === 'paused' ? (
                  <button onClick={() => { onResume(); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 text-emerald-600">
                    <Play size={14} /> Resume
                  </button>
                ) : null}
                <button onClick={() => { onDelete(); setMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                  <Archive size={14} /> Archive
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function HabitsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const queryClient = useQueryClient();

  // Open form if ?create=1 in URL
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setShowForm(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits', statusFilter],
    queryFn: () => habitsApi.getAll({ status: statusFilter === 'all' ? undefined : statusFilter }),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); toast.success('Habit archived'); },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => habitsApi.pause(id, new Date().toISOString(), new Date(Date.now() + 7 * 86400000).toISOString(), 'Temporary pause'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); toast.success('Habit paused for 7 days'); },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => habitsApi.resume(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); toast.success('Habit resumed'); },
  });

  const filtered = habits?.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.category.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">My Habits</h2>
          <p className="text-sm text-surface-400">{filtered.length} habit{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setEditHabit(null); setShowForm(true); }}
          className="btn-primary"
          id="habits-create-btn"
        >
          <Plus size={16} /> New Habit
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search habits..."
            className="input pl-9 py-2"
            id="habits-search"
          />
        </div>
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
          {['active', 'paused', 'archived', 'all'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              id={`habits-filter-${s}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                  : 'text-surface-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Habits grid */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="font-bold text-surface-900 dark:text-surface-100 text-lg mb-2">No habits yet</h3>
          <p className="text-surface-400 mb-5 text-sm">Create your first habit and start building consistency.</p>
          <button onClick={() => { setEditHabit(null); setShowForm(true); }} className="btn-primary">
            <Plus size={16} /> Create Your First Habit
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filtered.map((habit) => {
              const linkedGoal = goals?.find((g) => g._id === habit.goalId);
              return (
                <HabitCard
                  key={habit._id}
                  habit={habit}
                  linkedGoal={linkedGoal}
                  onEdit={() => { setEditHabit(habit); setShowForm(true); }}
                  onDelete={() => deleteMutation.mutate(habit._id)}
                  onPause={() => pauseMutation.mutate(habit._id)}
                  onResume={() => resumeMutation.mutate(habit._id)}
                />
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Habit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <HabitForm
            habit={editHabit}
            onClose={() => { setShowForm(false); setEditHabit(null); }}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ['habits'] });
              setShowForm(false);
              setEditHabit(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
