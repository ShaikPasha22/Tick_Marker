import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Map, Plus, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { tripApi } from '../../../api/trip';
import FinanceSubNav from '../../../components/finance/FinanceSubNav';
import AddTripModal from '../../../components/finance/trips/AddTripModal';
import type { Trip } from '../../../types';

export default function TripListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'active' | 'upcoming' | 'completed' | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['trips', statusFilter],
    queryFn: () => tripApi.listTrips(statusFilter === 'all' ? undefined : statusFilter),
  });

  const trips = data?.trips || [];

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-fade-in">
      <FinanceSubNav />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
            <Map className="text-emerald-500" />
            Trip Finance
          </h2>
          <p className="text-sm text-surface-500 mt-1">Manage budgets and expenses for specific trips.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> New Trip
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'active', 'upcoming', 'completed'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === filter
                ? 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Trip List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-2xl" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Map size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">No trips found</h3>
          <p className="text-surface-500 mt-2 max-w-sm mx-auto">
            You don't have any {statusFilter !== 'all' ? statusFilter : ''} trips yet. Create a new trip to start tracking dedicated budgets and expenses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <motion.div
              key={trip._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/finance/trips/${trip._id}`)}
              className="card p-5 cursor-pointer hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors group flex flex-col h-full relative overflow-hidden"
            >
              {/* Cover gradient fallback */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              
              <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                  <h3 className="font-bold text-surface-900 dark:text-surface-50 text-lg line-clamp-1">{trip.name}</h3>
                  {trip.destination && (
                    <div className="flex items-center gap-1 text-sm text-surface-500 mt-1">
                      <MapPin size={12} />
                      {trip.destination}
                    </div>
                  )}
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  trip.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  trip.status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                }`}>
                  {trip.status}
                </div>
              </div>

              <div className="flex-1 space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <Calendar size={14} className="text-surface-400" />
                  {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-surface-400 mb-0.5">Budget</p>
                  <p className="font-semibold text-surface-900 dark:text-surface-100">₹{trip.budget.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddTripModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
