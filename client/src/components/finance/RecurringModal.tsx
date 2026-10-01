import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  recurringApi, expenseCategoriesApi, paymentMethodsApi, invalidateFinanceQueries, type RecurringInput,
} from '../../api/finance';
import { useCurrency } from '../../store/financeStore';
import { FREQUENCY_LABEL, dueDay } from './recurring';
import type { RecurringFrequency, RecurringTransaction } from '../../types';

const idOf = (v: { _id: string } | string | undefined) => (typeof v === 'object' ? v._id : v ?? '');

/** Add or edit a repeating bill/subscription or repeating income */
export default function RecurringModal({ onClose, recurring }: { onClose: () => void; recurring?: RecurringTransaction | null }) {
  const queryClient = useQueryClient();
  const { symbol } = useCurrency();
  const isEdit = !!recurring;

  const [type, setType] = useState<'expense' | 'income'>(recurring?.type ?? 'expense');
  const [amount, setAmount] = useState(recurring ? String(recurring.amount) : '');
  const [description, setDescription] = useState(recurring?.description ?? '');
  const [categoryId, setCategoryId] = useState(idOf(recurring?.categoryId as any));
  const [paymentMethodId, setPaymentMethodId] = useState(idOf(recurring?.paymentMethodId as any));
  const [frequency, setFrequency] = useState<RecurringFrequency>(recurring?.frequency ?? 'monthly');
  // New: first due date. Edit: the next due date (lets the user correct it)
  const [dueDate, setDueDate] = useState(recurring ? dueDay(recurring) : format(new Date(), 'yyyy-MM-dd'));

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories', type],
    queryFn: () => expenseCategoriesApi.getAll({ type }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const save = useMutation({
    mutationFn: (data: RecurringInput) =>
      isEdit ? recurringApi.update(recurring!._id, data) : recurringApi.create(data),
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
      toast.success(isEdit ? 'Recurring entry updated' : 'Recurring entry added');
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Could not save'),
  });

  const parsedAmount = parseFloat(amount);
  const canSave = parsedAmount > 0 && description.trim() && categoryId && dueDate && !save.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    save.mutate({
      type,
      amount: parsedAmount,
      description: description.trim(),
      categoryId,
      paymentMethodId: type === 'expense' ? paymentMethodId || undefined : undefined,
      frequency,
      ...(isEdit ? { nextDueDate: dueDate } : { startDate: dueDate }),
    } as RecurringInput);
  };

  const label = 'block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5';

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
              {isEdit ? 'Edit recurring entry' : 'New recurring entry'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="p-5 space-y-4" id="recurring-form">
            {/* Bill or income (type is fixed once created) */}
            {!isEdit && (
              <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setCategoryId(''); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                      ${type === t ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-sm' : 'text-surface-500'}`}
                    id={`recurring-type-${t}`}
                  >
                    {t === 'expense' ? 'Bill / subscription' : 'Income'}
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className={label} htmlFor="recurring-amount">Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-surface-400">{symbol}</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number" step="0.01" min="0.01"
                  id="recurring-amount"
                  className="input pl-9 text-2xl font-bold h-14"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className={label} htmlFor="recurring-description">Name *</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                id="recurring-description"
                className="input"
                placeholder={type === 'expense' ? 'e.g. Netflix, Rent, Phone bill' : 'e.g. Salary'}
              />
            </div>

            <div>
              <label className={label}>Category *</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setCategoryId(cat._id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
                      ${categoryId === cat._id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-transparent hover:border-surface-200 dark:hover:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800'
                      }`}
                  >
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${cat.color}20` }}>
                      {cat.icon}
                    </span>
                    <span className="text-[10px] font-medium text-surface-600 dark:text-surface-400 leading-tight text-center">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="recurring-frequency">Repeats *</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                  id="recurring-frequency"
                  className="input"
                >
                  {(Object.keys(FREQUENCY_LABEL) as RecurringFrequency[]).map((f) => (
                    <option key={f} value={f}>{FREQUENCY_LABEL[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="recurring-due">{isEdit ? 'Next due *' : 'First due *'}</label>
                <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" id="recurring-due" className="input" />
              </div>
            </div>

            {type === 'expense' && paymentMethods.length > 0 && (
              <div>
                <label className={label} htmlFor="recurring-payment">Paid with</label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  id="recurring-payment"
                  className="input"
                >
                  <option value="">Not set</option>
                  {paymentMethods.map((m) => (
                    <option key={m._id} value={m._id}>{m.icon} {m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={!canSave}
                className="btn-primary flex-1 justify-center"
                id="recurring-save-btn"
              >
                {save.isPending ? 'Saving…' : isEdit ? 'Update' : 'Add'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
