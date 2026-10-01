import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Repeat, Check, SkipForward, Pencil, Pause, Play, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { recurringApi, invalidateFinanceQueries } from '../../api/finance';
import { useCurrency } from '../../store/financeStore';
import FinanceSubNav from '../../components/finance/FinanceSubNav';
import RecurringModal from '../../components/finance/RecurringModal';
import {
  RECURRING_QUERY_KEY, FREQUENCY_LABEL, monthlyEquivalent, daysUntilDue, dueLabel, useRecurringActions,
} from '../../components/finance/recurring';
import type { ExpenseCategory, RecurringTransaction } from '../../types';

function SummaryTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-surface-400">{label}</p>
      <p className="text-xl font-bold text-surface-900 dark:text-surface-50 tabular-nums mt-1">{value}</p>
      <p className="text-xs text-surface-400 mt-0.5">{sub}</p>
    </div>
  );
}

function IconButton({ onClick, label, children, disabled, tone = 'neutral' }: {
  onClick: () => void; label: string; children: React.ReactNode; disabled?: boolean; tone?: 'neutral' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40
        ${tone === 'danger' ? 'text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'}`}
    >
      {children}
    </button>
  );
}

export default function RecurringPage() {
  const { fmt } = useCurrency();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { pay, skip } = useRecurringActions();

  const { data: items = [], isLoading } = useQuery({
    queryKey: RECURRING_QUERY_KEY,
    queryFn: recurringApi.getAll,
  });

  const toggle = useMutation({
    mutationFn: (r: RecurringTransaction) => recurringApi.update(r._id, { isActive: !r.isActive }),
    onSuccess: (r) => { invalidateFinanceQueries(queryClient); toast.success(r.isActive ? `${r.description} resumed` : `${r.description} paused`); },
  });
  const remove = useMutation({
    mutationFn: (r: RecurringTransaction) => recurringApi.delete(r._id),
    onSuccess: () => { invalidateFinanceQueries(queryClient); toast.success('Recurring entry deleted'); },
  });

  const active = items.filter((r) => r.isActive);
  const paused = items.filter((r) => !r.isActive);
  const bills = active.filter((r) => r.type === 'expense');
  const monthlyBills = bills.reduce((s, r) => s + monthlyEquivalent(r), 0);
  const monthlyIncome = active.filter((r) => r.type === 'income').reduce((s, r) => s + monthlyEquivalent(r), 0);
  const dueSoon = bills.filter((r) => daysUntilDue(r) <= 7);

  const busy = pay.isPending || skip.isPending;

  const row = (r: RecurringTransaction) => {
    const cat = typeof r.categoryId === 'object' ? (r.categoryId as ExpenseCategory) : null;
    const days = daysUntilDue(r);
    const overdue = r.isActive && days < 0;
    return (
      <div key={r._id} className="flex items-center gap-3 py-3 px-1 border-b border-custom last:border-0">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${cat?.color ?? '#6366f1'}20` }}
        >
          {cat?.icon ?? '🔁'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">{r.description}</p>
          <p className="text-xs text-surface-400 truncate">
            {cat?.name ?? 'Uncategorised'} · {FREQUENCY_LABEL[r.frequency]}
            {r.isActive && (
              <span className={overdue ? 'text-red-600 dark:text-red-400 font-semibold' : days <= 3 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>
                {' · '}{overdue && <AlertTriangle size={11} className="inline -mt-0.5 mr-0.5" />}{dueLabel(r)}
              </span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold tabular-nums ${r.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-900 dark:text-surface-50'}`}>
            {r.type === 'income' ? '+' : ''}{fmt(r.amount)}
          </p>
          {r.frequency !== 'monthly' && <p className="text-[11px] text-surface-400">≈ {fmt(Math.round(monthlyEquivalent(r)))}/mo</p>}
        </div>
        <div className="flex items-center shrink-0">
          {r.isActive && (
            <>
              <button
                onClick={() => pay.mutate(r)}
                disabled={busy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-40"
                id={`recurring-pay-${r._id}`}
              >
                <Check size={13} /> {r.type === 'income' ? 'Received' : 'Mark paid'}
              </button>
              <IconButton onClick={() => skip.mutate(r)} label="Skip this time" disabled={busy}><SkipForward size={14} /></IconButton>
            </>
          )}
          <IconButton onClick={() => { setEditing(r); setShowModal(true); }} label="Edit"><Pencil size={14} /></IconButton>
          <IconButton onClick={() => toggle.mutate(r)} label={r.isActive ? 'Pause' : 'Resume'}>
            {r.isActive ? <Pause size={14} /> : <Play size={14} />}
          </IconButton>
          <IconButton
            onClick={() => { if (confirm(`Delete "${r.description}"? Payments already recorded are kept.`)) remove.mutate(r); }}
            label="Delete"
            tone="danger"
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <FinanceSubNav />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Repeat size={20} className="text-primary-500" />
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Recurring</h2>
            <p className="text-sm text-surface-400">Bills, subscriptions and regular income</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="btn-primary"
          id="recurring-add-btn"
        >
          <Plus size={15} /> Add recurring
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryTile label="Bills per month" value={fmt(Math.round(monthlyBills))} sub={`${bills.length} active bill${bills.length === 1 ? '' : 's'}`} />
        <SummaryTile label="Recurring income per month" value={fmt(Math.round(monthlyIncome))} sub="Salary and other regular income" />
        <SummaryTile
          label="Due in the next 7 days"
          value={fmt(dueSoon.reduce((s, r) => s + r.amount, 0))}
          sub={dueSoon.length ? `${dueSoon.length} bill${dueSoon.length === 1 ? '' : 's'}, including overdue` : 'Nothing due this week'}
        />
      </div>

      {isLoading ? (
        <div className="skeleton h-48 rounded-2xl" />
      ) : items.length === 0 ? (
        <div className="card p-8 text-center space-y-2">
          <p className="text-3xl">🔁</p>
          <p className="font-semibold text-surface-900 dark:text-surface-50">No recurring entries yet</p>
          <p className="text-sm text-surface-400">Add rent, subscriptions, EMIs or your salary. You'll see them on the Overview before they're due, and can record each payment in one click.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="card px-4 py-1">{active.map(row)}</div>
          )}
          {paused.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 px-1">Paused</h3>
              <div className="card px-4 py-1 opacity-75">{paused.map(row)}</div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <RecurringModal recurring={editing} onClose={() => { setShowModal(false); setEditing(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
