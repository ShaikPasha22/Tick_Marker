import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { tripApi } from '../../../api/trip';
import AddTripExpenseModal from '../../../components/finance/trips/AddTripExpenseModal';
import type { TripExpense } from '../../../types';

export default function TripTransactionsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<TripExpense | null>(null);

  const { data: tripData } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripApi.getTrip(tripId!),
    enabled: !!tripId,
  });

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['tripExpenses', tripId],
    queryFn: () => tripApi.listExpenses({ tripId: tripId! }),
    enabled: !!tripId,
  });

  const trip = tripData?.trip;
  const expenses = expensesData?.expenses || [];

  const filteredExpenses = expenses.filter(e => 
    (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.categoryId as any)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/finance/trips/${tripId}`} className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Transactions</h2>
          {trip && <p className="text-sm text-surface-500 mt-0.5">{trip.name}</p>}
        </div>
        <button className="btn-primary" onClick={() => { setExpenseToEdit(null); setIsAddExpenseOpen(true); }}>
          <Plus size={16} /> Expense
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button className="btn-ghost px-3">
          <Filter size={18} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-surface-500">No expenses found.</div>
        ) : (
          filteredExpenses.map((expense) => {
            const category = expense.categoryId as any;
            const payer = expense.paidBy as any;
            
            return (
              <div key={expense._id} className="card p-4 flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${category?.color || '#9ca3af'}20`, color: category?.color || '#9ca3af' }}
                >
                  <span className="text-lg">{category?.icon || '📦'}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-surface-900 dark:text-surface-100 truncate">
                      {expense.description || category?.name}
                    </p>
                    <p className="font-bold text-surface-900 dark:text-surface-50 shrink-0">
                      {expense.currency} {expense.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-3 text-xs text-surface-500">
                      <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                      {!payer?.isMe && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium">
                          Paid by {payer?.name}
                        </span>
                      )}
                    </div>
                    {expense.includeInMainFinance && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                        Main Finance ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
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
