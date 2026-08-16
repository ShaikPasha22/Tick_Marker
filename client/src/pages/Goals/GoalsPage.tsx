import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Target, Trash2, X, Calendar, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { goalsApi } from '../../api/goals';
import type { Goal } from '../../types';

function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const progress = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
  const remaining = Math.max(0, goal.targetValue - goal.currentValue);

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
      className={`card p-5 border ${statusColors[goal.status]}`}
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
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-surface-500 mb-4">{goal.description}</p>
      )}

      {/* Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {goal.currentValue}
            <span className="text-base font-normal text-surface-400"> / {goal.targetValue} {goal.unit}</span>
          </span>
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
        {progress >= 100 && (
          <span className="text-emerald-500 font-semibold">🎉 Goal achieved!</span>
        )}
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
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); toast.success('Goal deleted'); },
  });

  const active = goals?.filter((g) => g.status === 'active') ?? [];
  const completed = goals?.filter((g) => g.status === 'completed') ?? [];

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
