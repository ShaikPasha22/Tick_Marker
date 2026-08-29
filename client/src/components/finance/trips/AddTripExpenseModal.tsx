import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, AlignLeft, Tag, Users, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tripApi } from '../../../api/trip';
import type { TripExpense } from '../../../types';
import toast from 'react-hot-toast';

interface AddTripExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  editData?: TripExpense | null;
}

export default function AddTripExpenseModal({ isOpen, onClose, tripId, editData }: AddTripExpenseModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<TripExpense>>({
    amount: 0,
    currency: 'INR',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
    paidBy: '',
    paidByType: 'CURRENT_USER',
    status: 'confirmed',
    includeInMainFinance: false,
  });

  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');

  const { data: tripData } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripApi.getTrip(tripId),
    enabled: isOpen && !!tripId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['tripCategories', tripId],
    queryFn: () => tripApi.listCategories(tripId),
    enabled: isOpen && !!tripId,
  });

  const { data: participantsData } = useQuery({
    queryKey: ['tripParticipants', tripId],
    queryFn: () => tripApi.listParticipants(tripId),
    enabled: isOpen && !!tripId,
  });

  const trip = tripData?.trip;
  const categories = categoriesData?.categories || [];
  const participants = participantsData?.participants || [];

  // Populate edit data
  useEffect(() => {
    if (isOpen && editData) {
      setFormData({
        amount: editData.amount,
        currency: editData.currency,
        date: new Date(editData.date).toISOString().split('T')[0],
        description: editData.description || '',
        categoryId: (editData.categoryId as any)?._id || editData.categoryId,
        paidBy: (editData.paidBy as any)?._id || editData.paidBy,
        paidByType: editData.paidByType,
        status: editData.status,
        includeInMainFinance: editData.includeInMainFinance,
      });
    } else if (isOpen && !editData) {
      setFormData({
        amount: undefined, // empty for better UX
        currency: trip?.currency || 'INR',
        date: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
        paidBy: participants.find(p => p.isMe)?._id || '',
        paidByType: 'CURRENT_USER',
        status: 'confirmed',
        includeInMainFinance: false,
      });
    }
  }, [isOpen, editData, trip?.currency, participants]);

  const { mutate: saveExpense, isPending: isSavingExpense } = useMutation({
    mutationFn: (data: Partial<TripExpense>) => 
      editData 
        ? tripApi.updateExpense({ tripId, expenseId: editData._id, data })
        : tripApi.createExpense({ tripId, data }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tripDashboard', tripId] });
      queryClient.invalidateQueries({ queryKey: ['tripExpenses', tripId] });
      if (res.expense.includeInMainFinance) {
        queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      }
      toast.success(editData ? 'Expense updated' : 'Expense added');
      onClose();
    },
    onError: () => {
      toast.error(editData ? 'Failed to update expense' : 'Failed to add expense');
    }
  });

  const { mutate: addParticipant, isPending: isAddingParticipant } = useMutation({
    mutationFn: (name: string) => tripApi.addParticipant({ tripId, name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tripParticipants', tripId] });
      setFormData(prev => ({ ...prev, paidBy: res.participant._id }));
      setShowParticipantForm(false);
      setNewParticipantName('');
      toast.success(`${name} added to trip`);
    },
    onError: () => toast.error('Failed to add participant')
  });

  const { mutate: addCategory, isPending: isAddingCategory } = useMutation({
    mutationFn: (data: { name: string, icon: string, color: string }) => tripApi.addCategory({ tripId, data }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tripCategories', tripId] });
      setFormData(prev => ({ ...prev, categoryId: res.category._id }));
      setShowCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryIcon('📌');
      toast.success(`${res.category.name} category added`);
    },
    onError: () => toast.error('Failed to add category')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    
    // We removed strict date bounds because users often prepay or book things outside exact trip dates
    // and strict bounds can cause the input to freeze if the current date is outside the bounds.
    if (trip) {
      const expenseDate = new Date(formData.date!);
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);
      expenseDate.setHours(0,0,0,0);
      tripStart.setHours(0,0,0,0);
      tripEnd.setHours(0,0,0,0);
      
      if (expenseDate < tripStart || expenseDate > tripEnd) {
        // Just a soft warning, let it pass
        // toast.success('Expense recorded outside trip dates');
      }
    }

    const selectedParticipant = participants.find(p => p._id === formData.paidBy);
    const paidByType = selectedParticipant?.isMe ? 'CURRENT_USER' : 'TRIP_PARTICIPANT';

    saveExpense({
      ...formData,
      paidByType
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800 shrink-0">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
              {editData ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 bg-surface-100 dark:bg-surface-800 rounded-full">
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
            <form id="trip-expense-form" onSubmit={handleSubmit} className="space-y-5">
              
              {/* Row 1: Amount & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-semibold">{trip?.currency || '₹'}</span>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      className="input pl-8 w-full font-bold text-lg h-12"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input pl-10 w-full h-12"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Category & Paid By */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  
                  {showCategoryForm ? (
                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={newCategoryIcon}
                        onChange={(e) => setNewCategoryIcon(e.target.value)}
                        className="input h-11 w-12 text-center text-sm p-0 shrink-0"
                        maxLength={2}
                      />
                      <input 
                        type="text" 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Name..." 
                        className="input h-11 flex-1 text-sm min-w-0"
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => newCategoryName.trim() ? addCategory({ name: newCategoryName.trim(), icon: newCategoryIcon || '📌', color: '#6366f1' }) : setShowCategoryForm(false)}
                        className="btn-primary h-11 px-3 shrink-0"
                        disabled={isAddingCategory}
                      >
                        {isAddingCategory ? '...' : newCategoryName.trim() ? 'Add' : 'X'}
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                      <select
                        required
                        value={formData.categoryId as string}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowCategoryForm(true);
                          } else {
                            setFormData({ ...formData, categoryId: e.target.value });
                          }
                        }}
                        className="input pl-10 w-full appearance-none bg-transparent h-11"
                      >
                        <option value="" disabled>Select</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
                        ))}
                        <option value="ADD_NEW" className="font-bold text-emerald-600">+ Add Category</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                    Paid By <span className="text-red-500">*</span>
                  </label>
                  
                  {showParticipantForm ? (
                    <div className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        placeholder="Name..." 
                        className="input h-11 flex-1 text-sm"
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => newParticipantName.trim() ? addParticipant(newParticipantName.trim()) : setShowParticipantForm(false)}
                        className="btn-primary h-11 px-3 shrink-0"
                        disabled={isAddingParticipant}
                      >
                        {isAddingParticipant ? '...' : newParticipantName.trim() ? 'Add' : 'X'}
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                      <select
                        required
                        value={formData.paidBy as string}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowParticipantForm(true);
                          } else {
                            setFormData({ ...formData, paidBy: e.target.value });
                          }
                        }}
                        className="input pl-10 w-full appearance-none bg-transparent h-11"
                      >
                        <option value="" disabled>Select</option>
                        {participants.map((p) => (
                          <option key={p._id} value={p._id}>{p.name} {p.isMe ? '(Me)' : ''}</option>
                        ))}
                        <option value="ADD_NEW" className="font-bold text-emerald-600">+ Add Participant</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Description
                </label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input pl-10 w-full h-11"
                    placeholder="e.g. Dinner at the beach"
                  />
                </div>
              </div>

              {/* Main Finance Toggle - Explicit Radio Group */}
              <div className="pt-4 border-t border-surface-100 dark:border-surface-800">
                <label className="block text-sm font-bold text-surface-900 dark:text-surface-50 mb-3">
                  Finance Tracking Method
                </label>
                <div className="space-y-3">
                  <label className={`flex p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    !formData.includeInMainFinance 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' 
                      : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                  }`}>
                    <div className="flex items-center h-5">
                      <input 
                        type="radio" 
                        name="mainFinance" 
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        checked={!formData.includeInMainFinance}
                        onChange={() => setFormData({ ...formData, includeInMainFinance: false })}
                      />
                    </div>
                    <div className="ml-3">
                      <span className="block text-sm font-semibold text-surface-900 dark:text-surface-50">Trip Only</span>
                      <span className="block text-xs text-surface-500 mt-0.5">This expense will affect only this trip's budget. It will not appear in your main dashboard.</span>
                    </div>
                  </label>

                  <label className={`flex p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.includeInMainFinance 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' 
                      : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                  }`}>
                    <div className="flex items-center h-5">
                      <input 
                        type="radio" 
                        name="mainFinance"
                        className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        checked={formData.includeInMainFinance}
                        onChange={() => setFormData({ ...formData, includeInMainFinance: true })}
                      />
                    </div>
                    <div className="ml-3">
                      <span className="block text-sm font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-1">
                        <Globe size={14} /> Include in Main Finance
                      </span>
                      <span className="block text-xs text-surface-500 mt-0.5">This will reduce your available balance in your global Finance tracker.</span>
                    </div>
                  </label>
                </div>
              </div>

            </form>
          </div>
          
          <div className="p-4 sm:p-6 border-t border-surface-100 dark:border-surface-800 shrink-0 bg-surface-50 dark:bg-surface-800/50 rounded-b-2xl">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1 h-12"
                disabled={isSavingExpense}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="trip-expense-form"
                className="btn-primary flex-1 h-12 text-base"
                disabled={isSavingExpense}
              >
                {isSavingExpense ? 'Saving...' : editData ? 'Save Changes' : 'Save Expense'}
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
