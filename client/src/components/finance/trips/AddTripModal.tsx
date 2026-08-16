import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Map, Calendar, DollarSign, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tripApi } from '../../../api/trip';
import type { Trip } from '../../../types';

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTripModal({ isOpen, onClose }: AddTripModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Trip>>({
    name: '',
    destination: '',
    budget: 0,
    currency: 'INR',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Partial<Trip>) => tripApi.createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <Map className="text-emerald-500" size={20} />
              New Trip
            </h2>
            <button onClick={onClose} className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Trip Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="e.g. Summer Vacation, Goa Road Trip"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Destination (Optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="input pl-10 w-full"
                  placeholder="e.g. Goa, India"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Total Budget
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                  className="input pl-10 w-full"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={isPending}
              >
                {isPending ? 'Creating...' : 'Create Trip'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
