import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { financeCalendarApi, expensesApi, incomeApi } from '../../api/finance';
import { useCurrency } from '../../store/financeStore';
import FinanceSubNav from '../../components/finance/FinanceSubNav';
import TransactionCard from '../../components/finance/TransactionCard';
import AddExpenseModal from '../../components/finance/AddExpenseModal';
import type { CalendarDay } from '../../types';

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function DayCell({
  day, calData, isToday, onClick
}: {
  day: number | null;
  calData?: CalendarDay;
  isToday: boolean;
  onClick: () => void;
}) {
  if (!day) return <div />;

  const hasExpense = (calData?.expenseAmount ?? 0) > 0;
  const hasIncome = (calData?.incomeAmount ?? 0) > 0;
  const intensity = calData?.expenseAmount ?? 0;

  // Color intensity based on spending
  const getIntensity = (amount: number) => {
    if (amount === 0) return 'bg-transparent';
    if (amount < 500) return 'bg-red-100 dark:bg-red-900/20';
    if (amount < 1500) return 'bg-red-200 dark:bg-red-800/30';
    if (amount < 3000) return 'bg-red-300 dark:bg-red-700/40';
    return 'bg-red-400 dark:bg-red-600/50';
  };

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-start p-1 rounded-xl min-h-[56px] md:min-h-[68px]
                  border-2 transition-all hover:border-primary-300 dark:hover:border-primary-700
                  ${isToday ? 'border-primary-500' : 'border-transparent'}
                  ${hasExpense ? getIntensity(intensity) : ''}
                  hover:bg-surface-100 dark:hover:bg-surface-800`}
      id={`calendar-day-${day}`}
    >
      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                        ${isToday ? 'bg-primary-500 text-white' : 'text-surface-700 dark:text-surface-300'}`}>
        {day}
      </span>
      {hasExpense && (
        <span className="text-[9px] font-semibold text-red-600 dark:text-red-400 leading-tight mt-0.5">
          −{calData!.expenseAmount >= 1000
            ? `${(calData!.expenseAmount / 1000).toFixed(1)}k`
            : calData!.expenseAmount}
        </span>
      )}
      {hasIncome && (
        <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight">
          +{calData!.incomeAmount >= 1000
            ? `${(calData!.incomeAmount / 1000).toFixed(1)}k`
            : calData!.incomeAmount}
        </span>
      )}
      {calData && calData.transactionCount > 0 && (
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-400" />
      )}
    </button>
  );
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const { fmt } = useCurrency();
  const queryClient = useQueryClient();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data, isLoading } = useQuery({
    queryKey: ['finance-calendar', year, month],
    queryFn: () => financeCalendarApi.get(year, month),
    staleTime: 60 * 1000,
  });

  const { data: dayExpenses } = useQuery({
    queryKey: ['finance-transactions', 'expenses', selectedDate],
    queryFn: () => expensesApi.getAll({ from: selectedDate!, to: selectedDate!, limit: 50 }),
    enabled: !!selectedDate,
  });

  const { data: dayIncomes } = useQuery({
    queryKey: ['finance-transactions', 'income', selectedDate],
    queryFn: () => incomeApi.getAll({ from: selectedDate!, to: selectedDate! }),
    enabled: !!selectedDate,
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      toast.success('Expense deleted');
    },
  });

  // Build calendar grid
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
  const firstDayOfMonth = getDay(startOfMonth(new Date(year, month - 1, 1)));
  // Adjust for Monday start (0=Mon, 6=Sun)
  const startOffset = (firstDayOfMonth + 6) % 7;

  const calMap = new Map(data?.calendar?.map((d) => [d.date, d]) ?? []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const selectedDayData = selectedDate ? calMap.get(selectedDate) : null;

  const totalIncome = data?.calendar?.reduce((s, d) => s + d.incomeAmount, 0) ?? 0;
  const totalExpense = data?.calendar?.reduce((s, d) => s + d.expenseAmount, 0) ?? 0;

  return (
    <div className="space-y-4">
      <FinanceSubNav />

      {/* Month navigation */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            id="calendar-prev-month"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-3 mt-1 justify-center text-xs">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={10} /> {fmt(totalIncome)}
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown size={10} /> {fmt(totalExpense)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            id="calendar-next-month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-surface-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before month starts */}
            {[...Array(startOffset)].map((_, i) => <div key={`empty-${i}`} />)}
            {/* Day cells */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <DayCell
                  key={day}
                  day={day}
                  calData={calMap.get(dateStr)}
                  isToday={dateStr === today}
                  onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 text-xs text-surface-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/20" />Low spend
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-300 dark:bg-red-700/40" />High spend
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />Has transactions
        </span>
      </div>

      {/* Day detail panel */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-surface-900 dark:text-surface-50">
                  {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d')}
                </h3>
                <div className="flex items-center gap-3 mt-0.5 text-xs">
                  {(selectedDayData?.expenseAmount ?? 0) > 0 && (
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      −{fmt(selectedDayData!.expenseAmount)} spent
                    </span>
                  )}
                  {(selectedDayData?.incomeAmount ?? 0) > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{fmt(selectedDayData!.incomeAmount)} received
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowAddExpense(true); }}
                  className="btn-ghost text-xs py-1.5"
                  id="calendar-add-expense-btn"
                >
                  <Plus size={13} /> Expense
                </button>
                <button onClick={() => setSelectedDate(null)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Income entries */}
            {dayIncomes && dayIncomes.incomes.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">Income</p>
                {dayIncomes.incomes.map((income) => (
                  <TransactionCard key={income._id} transaction={income} type="income" compact />
                ))}
              </div>
            )}

            {/* Expense entries */}
            {dayExpenses && dayExpenses.expenses.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">Expenses</p>
                {dayExpenses.expenses.map((expense) => (
                  <TransactionCard
                    key={expense._id}
                    transaction={expense}
                    type="expense"
                    compact
                    onDelete={() => {
                      if (confirm('Delete this expense?')) deleteExpenseMutation.mutate(expense._id);
                    }}
                  />
                ))}
              </div>
            ) : (
              !dayIncomes?.incomes.length && (
                <div className="text-center py-6">
                  <p className="text-sm text-surface-400">No transactions on this day</p>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="btn-ghost mt-2 text-xs"
                    id="calendar-empty-add-btn"
                  >
                    <Plus size={13} /> Add Expense
                  </button>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddExpense && (
          <AddExpenseModal
            onClose={() => setShowAddExpense(false)}
            prefilledDate={selectedDate ?? undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
