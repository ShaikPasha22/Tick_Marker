import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { X, AlertTriangle, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { expensesApi, expenseCategoriesApi, paymentMethodsApi } from '../../api/finance';
import type { ExpenseCategory, PaymentMethod, Expense } from '../../types';
import { useCurrency } from '../../store/financeStore';

interface FormData {
  amount: string;
  date: string;
  time: string;
  categoryId: string;
  paymentMethodId: string;
  description: string;
  notes: string;
  status: 'confirmed' | 'pending';
}

interface AddExpenseModalProps {
  onClose: () => void;
  expense?: Expense | null; // for editing
  prefilledDate?: string;
}

export default function AddExpenseModal({ onClose, expense, prefilledDate }: AddExpenseModalProps) {
  useCurrency();
  const queryClient = useQueryClient();
  const [unusualWarning, setUnusualWarning] = useState<string | null>(null);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🍿');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const EMOJI_PRESETS = ['🍿', '☕', '🎮', '🏋️', '🐶', '🍕', '🚗', '🎁', '💊', '⚡', '💡', '✈️', '🛒', '🛍️', '📦'];
  const COLOR_PRESETS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#71717a'];

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setIsCreatingCategory(true);
      const newCat = await expenseCategoriesApi.create({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
        type: 'expense',
      });
      await queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      setValue('categoryId', newCat._id);
      toast.success(`Category "${newCat.name}" created!`);
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories', 'expense'],
    queryFn: () => expenseCategoriesApi.getAll({ type: 'expense' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    defaultValues: {
      amount: expense ? String(expense.amount) : '',
      date: expense
        ? expense.date.slice(0, 10)
        : prefilledDate ?? format(new Date(), 'yyyy-MM-dd'),
      time: expense?.time ?? format(new Date(), 'HH:mm'),
      categoryId: expense
        ? (typeof expense.categoryId === 'object' ? (expense.categoryId as ExpenseCategory)._id : expense.categoryId)
        : '',
      paymentMethodId: expense?.paymentMethodId
        ? typeof expense.paymentMethodId === 'object'
          ? (expense.paymentMethodId as PaymentMethod)._id
          : expense.paymentMethodId
        : (paymentMethods.find((m) => m.isDefault)?._id ?? ''),
      description: expense?.description ?? '',
      notes: expense?.notes ?? '',
      status: expense?.status === 'pending' ? 'pending' : 'confirmed',
    },
  });

  // Set default payment method when loaded
  useEffect(() => {
    if (!expense && paymentMethods.length > 0) {
      const def = paymentMethods.find((m) => m.isDefault);
      if (def) setValue('paymentMethodId', def._id);
    }
  }, [paymentMethods, expense, setValue]);

  // Auto-select first category if none is selected and categories have loaded
  useEffect(() => {
    if (!expense && categories.length > 0 && !getValues('categoryId')) {
      setValue('categoryId', categories[0]._id);
    }
  }, [categories, expense, setValue, getValues]);

  const { mutateAsync } = useMutation({
    mutationFn: (data: any): Promise<{ expense: Expense; unusualWarning: any }> =>
      expense
        ? expensesApi.update(expense._id, data).then((exp) => ({ expense: exp, unusualWarning: null }))
        : expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['finance-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        date: new Date(data.date).toISOString(),
        paymentMethodId: data.paymentMethodId || undefined,
        time: data.time || undefined,
        description: data.description || undefined,
        notes: data.notes || undefined,
      };

      const result = await mutateAsync(payload) as any;

      if (result?.unusualWarning?.isUnusual) {
        setUnusualWarning(result.unusualWarning.message);
      }

      toast.success(expense ? 'Expense updated!' : 'Expense added!');
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Failed to save expense');
    }
  };

  const selectedCategoryId = watch('categoryId');
  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);

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
          className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-custom sticky top-0 bg-white dark:bg-surface-900 z-10">
            <div className="flex items-center gap-3">
              {selectedCategory && (
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${selectedCategory.color}20` }}
                >
                  {selectedCategory.icon}
                </span>
              )}
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                {expense ? 'Edit Expense' : '+ Add Expense'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4" id="add-expense-form">
            {/* Amount — prominent */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-surface-400">₹</span>
                <input
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Must be greater than 0' },
                  })}
                  type="number"
                  step="0.01"
                  id="expense-amount"
                  className="input pl-9 text-2xl font-bold h-14"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Category — quick select grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-medium"
                  id="add-custom-category-toggle"
                >
                  <Plus size={13} /> Custom Category
                </button>
              </div>

              {/* Inline Custom Category Creator */}
              <AnimatePresence>
                {showAddCategory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/80 border border-primary-200 dark:border-primary-800 space-y-2.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-surface-800 dark:text-surface-200">Add Customized Category</span>
                      <button type="button" onClick={() => setShowAddCategory(false)} className="text-surface-400 hover:text-surface-600">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category Name (e.g. Snacks, Coffee)"
                        className="input py-1.5 text-xs flex-1"
                        id="custom-category-name-input"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim() || isCreatingCategory}
                        className="btn-primary py-1.5 px-3 text-xs bg-primary-600 hover:bg-primary-700 text-white shrink-0"
                        id="save-custom-category-btn"
                      >
                        {isCreatingCategory ? 'Adding...' : 'Add'}
                      </button>
                    </div>

                    {/* Emoji Preset selection */}
                    <div>
                      <span className="text-[10px] text-surface-400 font-medium block mb-1">Choose Icon</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {EMOJI_PRESETS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewCategoryIcon(emoji)}
                            className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                              newCategoryIcon === emoji
                                ? 'bg-white dark:bg-surface-700 shadow ring-2 ring-primary-500 scale-105'
                                : 'hover:bg-surface-200 dark:hover:bg-surface-700'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Palette selection */}
                    <div>
                      <span className="text-[10px] text-surface-400 font-medium block mb-1">Choose Color</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewCategoryColor(color)}
                            className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${
                              newCategoryColor === color ? 'ring-2 ring-offset-1 ring-primary-500 scale-110' : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          >
                            {newCategoryColor === color && <Check size={12} className="text-white drop-shadow" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {categories.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    No expense categories found.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="text-xs text-primary-600 dark:text-primary-400 underline mt-1 inline-block"
                  >
                    + Create a custom category
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => setValue('categoryId', cat._id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center
                        ${selectedCategoryId === cat._id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-transparent hover:border-surface-200 dark:hover:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800'
                        }`}
                      id={`category-${cat.name.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-[10px] font-medium text-surface-600 dark:text-surface-400 leading-tight truncate w-full">
                        {cat.name.split('/')[0].trim()}
                      </span>
                    </button>
                  ))}

                  {/* + Custom Category Tile */}
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-all text-center"
                    id="add-custom-category-tile"
                  >
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-primary-100 dark:bg-primary-900/40">
                      <Plus size={16} />
                    </span>
                    <span className="text-[10px] font-medium leading-tight">+ Custom</span>
                  </button>
                </div>
              )}
              {!selectedCategoryId && (
                <p className="text-xs text-surface-400 mt-1">Select a category</p>
              )}
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                  Date *
                </label>
                <input
                  {...register('date', { required: true })}
                  type="date"
                  id="expense-date"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                  Time
                </label>
                <input
                  {...register('time')}
                  type="time"
                  id="expense-time"
                  className="input"
                />
              </div>
            </div>

            {/* Payment Method */}
            {paymentMethods.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <div className="flex gap-2 flex-wrap">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm._id}
                      type="button"
                      onClick={() => setValue('paymentMethodId', pm._id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all
                        ${watch('paymentMethodId') === pm._id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 text-surface-600 dark:text-surface-400'
                        }`}
                      id={`pm-${pm.name.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <span>{pm.icon}</span> {pm.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <input
                {...register('description')}
                type="text"
                id="expense-description"
                className="input"
                placeholder="What did you spend on?"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                Notes (optional)
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                id="expense-notes"
                className="input resize-none"
                placeholder="Additional notes..."
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
                Status
              </label>
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

            {/* Unusual warning */}
            {unusualWarning && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{unusualWarning}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isSubmitting || !selectedCategoryId}
                className="btn-primary flex-1 justify-center bg-red-500 hover:bg-red-600"
                id="expense-save-btn"
              >
                {isSubmitting
                  ? 'Saving…'
                  : expense
                  ? 'Update'
                  : '+ Add Expense'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
