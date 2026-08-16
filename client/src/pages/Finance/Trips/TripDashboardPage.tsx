import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, MapPin, Calendar as CalendarIcon, 
  TrendingDown, Check, Activity, Wallet, PieChart, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { tripApi } from '../../../api/trip';
import AddTripExpenseModal from '../../../components/finance/trips/AddTripExpenseModal';
import TripTransactionCard from '../../../components/finance/trips/TripTransactionCard';
import { useTripExpenses } from '../../../hooks/useTripExpenses';
import type { TripExpense } from '../../../types';
import toast from 'react-hot-toast';

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card p-5 flex flex-col gap-1 shadow-sm">
      <p className="text-sm font-medium text-surface-600 dark:text-surface-400">{label}</p>
      <p className="text-2xl font-bold text-surface-900 dark:text-surface-50 leading-tight">{value}</p>
      {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function TripDashboardPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const queryClient = useQueryClient();
  
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<TripExpense | null>(null);
  const [dateFilter, setDateFilter] = useState('');

  const { data: dashboard, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['tripDashboard', tripId],
    queryFn: () => tripApi.getDashboard(tripId!),
    enabled: !!tripId,
  });

  const { data: groupedExpenses, isLoading: isLoadingExpenses } = useTripExpenses(tripId);

  const displayedExpenses = dateFilter 
    ? groupedExpenses?.filter(g => g.date === dateFilter)
    : groupedExpenses;

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => tripApi.deleteExpense({ tripId: tripId!, expenseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tripDashboard', tripId] });
      queryClient.invalidateQueries({ queryKey: ['tripExpenses', tripId] });
      toast.success('Expense deleted');
    },
    onError: () => toast.error('Failed to delete expense')
  });

  const handleDelete = (expense: TripExpense) => {
    if (expense.includeInMainFinance) {
      if (!confirm('This expense is also included in your Main Finance. Deleting it will remove its contribution from your global Finance tracker. Continue?')) {
        return;
      }
    } else {
      if (!confirm('Delete this expense?')) return;
    }
    deleteExpenseMutation.mutate(expense._id);
  };

  const handleEdit = (expense: TripExpense) => {
    setExpenseToEdit(expense);
    setIsAddExpenseOpen(true);
  };

  if (isLoadingDashboard) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { trip, summary, metrics } = dashboard;
  const isOverBudget = summary.totalSpent > trip.budget;

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/finance/trips" className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">{trip.name}</h2>
            <div className="flex items-center gap-3 text-sm text-surface-500 mt-0.5 flex-wrap">
              {trip.destination && (
                <span className="flex items-center gap-1"><MapPin size={12} /> {trip.destination}</span>
              )}
              <span className="flex items-center gap-1">
                <CalendarIcon size={12} /> 
                {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="btn-primary" 
            onClick={() => { setExpenseToEdit(null); setIsAddExpenseOpen(true); }}
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
        {/* Main Content Column */}
        <div className="space-y-6">
          
          {/* Main Budget Hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-2xl p-6 shadow-lg text-white ${
              trip.budget === 0 ? 'bg-surface-800' : isOverBudget ? 'bg-red-500' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
            }`}
          >
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
            <div className="relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-white/80 mb-1">Total Budget</p>
                  <p className="text-3xl font-bold">{trip.currency} {trip.budget.toLocaleString('en-IN')}</p>
                </div>
                {trip.budget > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-white/80 mb-1">{isOverBudget ? 'Over Budget' : 'Remaining'}</p>
                    <p className="text-xl font-bold">
                      {isOverBudget ? '-' : ''}{trip.currency} {Math.abs(summary.remainingBudget).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>
              
              {trip.budget > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-white/90 mb-1">
                    <span>Spent: {trip.currency} {summary.totalSpent.toLocaleString('en-IN')}</span>
                    <span>{summary.budgetUsedPercentage.toFixed(1)}% used</span>
                  </div>
                  <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, summary.budgetUsedPercentage)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/80 mt-4">No budget set. Set a budget to track progress.</p>
              )}
            </div>
            {/* Decorative blobs */}
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -right-4 -bottom-8 w-24 h-24 rounded-full bg-white/10" />
          </motion.div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard 
              label="Avg Daily Spend" 
              value={`${trip.currency} ${Math.round(metrics.averageDaily).toLocaleString('en-IN')}`} 
              color="var(--text-primary)"
            />
            {trip.budget > 0 && (
              <MetricCard 
                label="Suggested Daily" 
                value={`${trip.currency} ${Math.round(metrics.suggestedDaily).toLocaleString('en-IN')}`} 
                sub={`${metrics.daysRemaining} days left`}
                color="#10b981"
              />
            )}
            {trip.budget === 0 && (
              <MetricCard 
                label="Total Spent" 
                value={`${trip.currency} ${summary.totalSpent.toLocaleString('en-IN')}`} 
                color="var(--text-primary)"
              />
            )}
          </div>

          {/* Transactions Ledger */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-bold text-lg text-surface-900 dark:text-surface-50">Recent Transactions</h3>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
                  className="input h-9 text-xs px-2"
                />
                {dateFilter && <button className="text-xs font-semibold text-red-500 hover:underline" onClick={() => setDateFilter('')}>Clear</button>}
                <span className="text-sm text-surface-500 ml-2">{summary.transactionCount} expenses</span>
              </div>
            </div>

            {isLoadingExpenses ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
              </div>
            ) : displayedExpenses && displayedExpenses.length > 0 ? (
              <div className="space-y-6">
                {displayedExpenses.map((group) => (
                  <div key={group.date} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider">
                        {format(new Date(group.date), 'MMM d, yyyy')}
                        {group.date === format(new Date(), 'yyyy-MM-dd') && ' — TODAY'}
                        {group.date === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') && ' — YESTERDAY'}
                      </h4>
                      <span className="text-xs font-semibold text-surface-500">
                        Total: {trip.currency} {group.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.expenses.map((expense) => (
                        <TripTransactionCard 
                          key={expense._id} 
                          expense={expense} 
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          currency={trip.currency}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center border-dashed">
                <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-400">
                  <Wallet size={24} />
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-1">No expenses yet</h3>
                <p className="text-sm text-surface-500 mb-6">Track your first trip expense to see your spending here.</p>
                <button 
                  className="btn-primary mx-auto"
                  onClick={() => { setExpenseToEdit(null); setIsAddExpenseOpen(true); }}
                >
                  <Plus size={16} /> Add Expense
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              Who Paid?
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-surface-700 dark:text-surface-300">Paid By Me</span>
                  <span className="font-bold text-surface-900 dark:text-surface-50">
                    {trip.currency} {summary.paidByMe.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(summary.paidByMe / Math.max(summary.totalSpent, 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-surface-700 dark:text-surface-300">Paid By Others (Total)</span>
                  <span className="font-bold text-surface-900 dark:text-surface-50">
                    {trip.currency} {summary.paidByOthers.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${(summary.paidByOthers / Math.max(summary.totalSpent, 1)) * 100}%` }}
                  />
                </div>
                
                {/* Individual Breakdown */}
                {dashboard.participants && (dashboard.participants as any[]).filter(p => !p.isMe && p.amount > 0).length > 0 && (
                  <div className="space-y-2 pl-2 border-l-2 border-surface-100 dark:border-surface-800">
                    {(dashboard.participants as any[]).filter(p => !p.isMe && p.amount > 0).map((p: any) => (
                      <div key={p.name} className="flex justify-between text-xs">
                        <span className="text-surface-500">{p.name}</span>
                        <span className="font-semibold text-surface-700 dark:text-surface-300">
                          {trip.currency} {p.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
              <PieChart size={16} className="text-emerald-500" />
              Forecast & Time
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-surface-500 mb-1">Time Elapsed</p>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{metrics.daysElapsed} days passed</span>
                  <span className="font-medium">{metrics.daysRemaining} days left</span>
                </div>
                <div className="h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-surface-400 dark:bg-surface-500 rounded-full" 
                    style={{ width: `${Math.min(100, (metrics.daysElapsed / Math.max(metrics.totalDays, 1)) * 100)}%` }} 
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-surface-100 dark:border-surface-800">
                <p className="text-xs text-surface-500 mb-1">Projected Final Cost</p>
                <p className={`font-semibold text-lg ${metrics.projectedFinalCost > trip.budget && trip.budget > 0 ? 'text-red-500' : 'text-surface-900 dark:text-surface-100'}`}>
                  {trip.currency} {Math.round(metrics.projectedFinalCost).toLocaleString('en-IN')}
                </p>
                {metrics.projectedFinalCost > trip.budget && trip.budget > 0 && (
                  <p className="text-xs text-red-500 mt-1">Projected to exceed budget by {trip.currency} {Math.round(metrics.projectedFinalCost - trip.budget).toLocaleString('en-IN')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddTripExpenseModal 
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        tripId={tripId!}
        editData={expenseToEdit}
      />
    </div>
  );
}
