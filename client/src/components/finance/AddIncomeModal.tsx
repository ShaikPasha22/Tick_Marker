import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { incomeApi, expenseCategoriesApi } from '../../api/finance';
import type { Income, ExpenseCategory } from '../../types';

interface FormData {
  amount: string;
  date: string;
  time: string;
  categoryId: string;
  description: string;
  notes: string;
  status: 'confirmed' | 'pending';
}

interface AddIncomeModalProps {
  onClose: () => void;
  income?: Income | null;
}

export default function AddIncomeModal({ onClose, income }: AddIncomeModalProps) {
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories', 'income'],
    queryFn: () => expenseCategoriesApi.getAll({ type: 'income' }),
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    defaultValues: {
      amount: income ? String(income.amount) : '',
      date: income ? income.date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
      time: income?.time ?? format(new Date(), 'HH:mm'),
      categoryId: income
        ? (typeof income.categoryId === 'object' ? (income.categoryId as ExpenseCategory)._id : income.categoryId)
        : '',
      description: income?.description ?? '',
      notes: income?.notes ?? '',
      status: income?.status === 'pending' ? 'pending' : 'confirmed',
    },
  });

  const { mutateAsync } = useMutation({
    mutationFn: (data: any) =>
      income ? incomeApi.update(income._id, data) : incomeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await mutateAsync({
        ...data,
        amount: parseFloat(data.amount),
        date: new Date(data.date).toISOString(),
        time: data.time || undefined,
        description: data.description || undefined,
        notes: data.notes || undefined,
      });
      toast.success(income ? 'Income updated!' : 'Income added!');
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Failed to save income');
    }
  };

  const selectedCategoryId = watch('categoryId');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-custom sticky top-0 bg-white dark:bg-surface-900">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {income ? 'Edit Income' : '+ Add Income'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" id="add-income-form">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-surface-400">₹</span>
                <input
                  {...register('amount', { required: 'Required', min: { value: 0.01, message: 'Must be > 0' } })}
                  type="number"
                  step="0.01"
                  id="income-amount"
                  className="input pl-9 text-2xl font-bold h-14"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                Source / Category *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setValue('categoryId', cat._id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                      ${selectedCategoryId === cat._id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-transparent hover:border-surface-200 dark:hover:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800'
                      }`}
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </span>
                    <span className="text-[10px] font-medium text-surface-600 dark:text-surface-400 leading-tight text-center">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Date *</label>
                <input {...register('date', { required: true })} type="date" id="income-date" className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Time</label>
                <input {...register('time')} type="time" id="income-time" className="input" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Description</label>
              <input {...register('description')} type="text" id="income-description" className="input" placeholder="e.g. Monthly salary" />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Status</label>
              <div className="flex gap-2">
                {(['confirmed', 'pending'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue('status', s)}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold capitalize transition-all
                      ${watch('status') === s
                        ? s === 'confirmed'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                          : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                        : 'border-surface-200 dark:border-surface-700 text-surface-500'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isSubmitting || !selectedCategoryId}
                className="btn-primary flex-1 justify-center bg-emerald-500 hover:bg-emerald-600"
                id="income-save-btn"
              >
                {isSubmitting ? 'Saving…' : income ? 'Update' : '+ Add Income'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
