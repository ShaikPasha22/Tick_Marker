import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Trash2, Edit2, Copy, Archive, FolderOpen, Calendar, HelpCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { swotApi } from '../../api/swot';
import type { SwotAnalysis } from '../../types';

function SwotFormModal({
  swot,
  onClose,
  onSave
}: {
  swot: SwotAnalysis | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(swot?.name ?? '');
  const [description, setDescription] = useState(swot?.description ?? '');
  const [category, setCategory] = useState(swot?.category ?? '');
  const [startDate, setStartDate] = useState(swot?.startDate ? swot.startDate.slice(0, 10) : '');
  const [targetDate, setTargetDate] = useState(swot?.targetDate ? swot.targetDate.slice(0, 10) : '');

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      swot ? swotApi.update(swot._id, data) : swotApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot-list'] });
      toast.success(swot ? 'SWOT Analysis updated!' : 'SWOT Analysis created!');
      onSave();
    },
    onError: () => toast.error('Failed to save SWOT Analysis')
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveMutation.mutate({
      name,
      description,
      category: category || undefined,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">
            {swot ? 'Edit SWOT Analysis' : 'New SWOT Analysis'}
          </h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={18} /></button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g. Career Planning 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input resize-none"
              rows={2}
              placeholder="What is the objective of this analysis?"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              placeholder="e.g. Career, Health, Business"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">Target/Review Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {saveMutation.isPending ? 'Saving...' : swot ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function SwotListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [showForm, setShowForm] = useState(false);
  const [selectedSwot, setSelectedSwot] = useState<SwotAnalysis | null>(null);

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['swot-list'],
    queryFn: swotApi.getAll
  });

  const duplicateMutation = useMutation({
    mutationFn: swotApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot-list'] });
      toast.success('SWOT Analysis duplicated!');
    },
    onError: () => toast.error('Failed to duplicate SWOT Analysis')
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      swotApi.update(id, { status: archive ? 'archived' : 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot-list'] });
      toast.success('Status updated successfully!');
    },
    onError: () => toast.error('Failed to update status')
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm?: boolean }) => swotApi.delete(id, confirm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot-list'] });
      toast.success('SWOT Analysis deleted successfully');
    },
    onError: (err: any) => {
      if (err.response?.data?.warning) {
        if (confirm(err.response.data.message)) {
          deleteMutation.mutate({ id: err.config.url.split('/').pop(), confirm: true });
        }
      } else {
        toast.error('Failed to delete SWOT Analysis');
      }
    }
  });

  const displayed = analyses?.filter((a) => a.status === filter) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">SWOT Analyses</h2>
          <p className="text-sm text-surface-400">
            Formulate plans and prioritize objectives using SWOT quadrants
          </p>
        </div>
        <button
          onClick={() => { setSelectedSwot(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus size={16} /> New SWOT
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 dark:border-surface-800">
        {(['active', 'archived'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 border-b-2 font-bold text-sm transition-all capitalize -mb-[2px] ${
              filter === tab
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-surface-400 hover:text-surface-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 card border border-dashed flex flex-col items-center">
          <HelpCircle size={48} className="text-surface-300 dark:text-surface-700 mb-3" />
          <h3 className="font-bold text-surface-800 dark:text-surface-200 text-lg">No SWOT Analyses</h3>
          <p className="text-sm text-surface-400 max-w-sm mt-1 mb-5">
            Create a SWOT analysis workspace to classify strengths, weaknesses, opportunities, and threats.
          </p>
          <button
            onClick={() => { setSelectedSwot(null); setShowForm(true); }}
            className="btn-primary btn-sm"
          >
            Create SWOT Analysis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((swot) => (
            <motion.div
              layout
              key={swot._id}
              className="card p-5 border hover:shadow-md transition-shadow relative flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4
                    onClick={() => navigate(`/swot/${swot._id}`)}
                    className="text-base font-extrabold text-surface-900 dark:text-surface-50 cursor-pointer hover:text-primary-500 transition-colors"
                  >
                    {swot.name}
                  </h4>
                  {swot.category && (
                    <span className="badge bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 text-[10px] uppercase font-bold tracking-wider shrink-0">
                      {swot.category}
                    </span>
                  )}
                </div>

                <p className="text-xs text-surface-500 line-clamp-2 min-h-[32px] mb-4">
                  {swot.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-[10px] text-surface-400 font-medium mb-4">
                  {swot.startDate && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Start: {format(new Date(swot.startDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {swot.targetDate && (
                    <div className="flex items-center gap-1">
                      <Target size={12} />
                      <span>Review: {format(new Date(swot.targetDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                <button
                  onClick={() => navigate(`/swot/${swot._id}`)}
                  className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <FolderOpen size={13} /> Open Workspace
                </button>

                <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setSelectedSwot(swot); setShowForm(true); }}
                    className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600"
                    title="Edit SWOT"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => duplicateMutation.mutate(swot._id)}
                    className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600"
                    title="Duplicate SWOT"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => archiveMutation.mutate({ id: swot._id, archive: swot.status === 'active' })}
                    className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600"
                    title={swot.status === 'active' ? 'Archive SWOT' : 'Reopen SWOT'}
                  >
                    <Archive size={13} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: swot._id })}
                    className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-red-500"
                    title="Delete SWOT"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <SwotFormModal
            swot={selectedSwot}
            onClose={() => { setShowForm(false); setSelectedSwot(null); }}
            onSave={() => { setShowForm(false); setSelectedSwot(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
