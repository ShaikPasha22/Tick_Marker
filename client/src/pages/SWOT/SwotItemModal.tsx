import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Calendar, Link2, Unlink, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { swotApi } from '../../api/swot';
import { tasksApi } from '../../api/tasks';
import type { SwotItem, SwotQuadrant, PriorityLevel, ItemStatus } from '../../types';

interface SwotItemModalProps {
  swotId: string;
  item: SwotItem;
  onClose: () => void;
  onSave: () => void;
}

const QUADRANTS: { value: SwotQuadrant; label: string; explanation: string }[] = [
  { value: 'strengths', label: 'Strengths 💪', explanation: 'Internal positive factors' },
  { value: 'weaknesses', label: 'Weaknesses 🧠', explanation: 'Internal negative factors/skill gaps' },
  { value: 'opportunities', label: 'Opportunities 🚀', explanation: 'External positive opportunities' },
  { value: 'threats', label: 'Threats ⚠️', explanation: 'External risks or negative factors' },
  { value: 'unclassified', label: 'Unclassified 🔢', explanation: 'Staged items pool' },
];

const PRIORITIES: PriorityLevel[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function SwotItemModal({ swotId, item, onClose, onSave }: SwotItemModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');
  const [quadrant, setQuadrant] = useState<SwotQuadrant>(item.quadrant);
  const [impact, setImpact] = useState<PriorityLevel>(item.impact);
  const [urgency, setUrgency] = useState<PriorityLevel>(item.urgency);
  const [severity, setSeverity] = useState<PriorityLevel>(item.severity);
  const [priority, setPriority] = useState<PriorityLevel>(item.priority);
  const [prioritySource, setPrioritySource] = useState<'calculated' | 'manual'>(item.prioritySource);
  const [status, setStatus] = useState<ItemStatus>(item.status);
  const [deadline, setDeadline] = useState(item.deadline ? item.deadline.slice(0, 10) : '');

  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  // Fetch tasks to allow linking
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getAll,
  });

  const linkedTask = tasks?.find((t) => t.swotItemId === item._id || t._id === item.taskId);
  const linkableTasks = tasks?.filter((t) => !t.swotItemId && t.status === 'pending') ?? [];

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: Partial<SwotItem>) => swotApi.updateItem(swotId, item._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot-items', swotId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('SWOT item updated!');
      onSave();
    },
    onError: () => toast.error('Failed to update SWOT item')
  });

  const deleteMutation = useMutation({
    mutationFn: (confirm?: boolean) => swotApi.deleteItem(swotId, item._id, confirm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot-items', swotId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('SWOT item deleted');
      onClose();
    },
    onError: (err: any) => {
      if (err.response?.data?.warning) {
        if (confirm(err.response.data.message)) {
          deleteMutation.mutate(true);
        }
      } else {
        toast.error('Failed to delete item');
      }
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: () =>
      tasksApi.create({
        title: `Task: ${title}`,
        description: `Source SWOT Analysis: ${description || 'Linked SWOT Item'}\nQuadrant: ${quadrant.toUpperCase()}`,
        swotId,
        swotItemId: item._id,
        dueDate: deadline ? new Date(deadline).toISOString() : undefined,
      }),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      updateMutation.mutate({ taskId: newTask._id });
      toast.success('Converted to Task successfully!');
    },
    onError: () => toast.error('Failed to create Task')
  });

  const linkTaskMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.link(taskId, swotId, item._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['swot-items', swotId] });
      toast.success('Task linked successfully!');
      setShowTaskDropdown(false);
    },
    onError: () => toast.error('Failed to link Task')
  });

  const unlinkTaskMutation = useMutation({
    mutationFn: async () => {
      if (linkedTask) {
        await tasksApi.update(linkedTask._id, { swotId: undefined, swotItemId: undefined } as any);
      }
      return updateMutation.mutateAsync({ taskId: undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['swot-items', swotId] });
      toast.success('Task unlinked successfully');
    },
    onError: () => toast.error('Failed to unlink Task')
  });

  const handleSave = () => {
    updateMutation.mutate({
      title,
      description,
      notes,
      quadrant,
      impact,
      urgency,
      severity,
      priority,
      prioritySource,
      status,
      deadline: deadline ? deadline : undefined
    });
  };

  // Centralized client-side priority preview (concept engine)
  const getCalculatedPriority = () => {
    const levelValues = { low: 1, medium: 2, high: 3, critical: 4 };
    const quadrantBases = { strengths: 1, opportunities: 2, weaknesses: 3, threats: 4, unclassified: 0 };
    const base = quadrantBases[quadrant];
    const score = base + levelValues[impact] + levelValues[urgency] + levelValues[severity];

    let prio: PriorityLevel = 'medium';
    if (quadrant === 'unclassified') prio = 'low';
    else if (score <= 6) prio = 'low';
    else if (score <= 9) prio = 'medium';
    else if (score <= 12) prio = 'high';
    else prio = 'critical';

    return {
      priority: prio,
      score,
      reason: `This item is a ${quadrant === 'unclassified' ? 'Unclassified' : quadrant.toUpperCase()} with ${impact.toUpperCase()} Impact, ${urgency.toUpperCase()} Urgency, and ${severity.toUpperCase()} Severity.`
    };
  };

  const calculated = getCalculatedPriority();
  const activePriority = prioritySource === 'calculated' ? calculated.priority : priority;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl max-h-[92vh] overflow-y-auto p-5 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-50">SWOT Item Details</h3>
            <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider mt-0.5">
              Source: SWOT Workspace
            </p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={18} /></button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 text-left">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-sm font-bold"
              placeholder="e.g. Complete AlgoExpert problems"
            />
          </div>

          {/* Description & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input resize-none text-xs"
                rows={3}
                placeholder="Item overview..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input resize-none text-xs"
                rows={3}
                placeholder="Additional notes/tactical points..."
              />
            </div>
          </div>

          {/* Quadrant & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">SWOT Quadrant</label>
              <select
                value={quadrant}
                onChange={(e) => setQuadrant(e.target.value as SwotQuadrant)}
                className="input text-xs"
              >
                {QUADRANTS.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                className="input text-xs"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Impact, Urgency, Severity */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Impact</label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as PriorityLevel)}
                className="input py-1.5 px-2 text-xs"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as PriorityLevel)}
                className="input py-1.5 px-2 text-xs"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as PriorityLevel)}
                className="input py-1.5 px-2 text-xs"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Priority Calculation Mode */}
          <div className="bg-surface-50 dark:bg-surface-800/40 p-3 rounded-xl border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-surface-700 dark:text-surface-300">Priority Engine Mode</span>
              <div className="flex bg-surface-200 dark:bg-surface-800 rounded-lg p-0.5">
                {(['calculated', 'manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPrioritySource(mode)}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold capitalize transition-colors ${
                      prioritySource === mode
                        ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                        : 'text-surface-500'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] font-bold text-surface-400 uppercase">Computed Output Priority</span>
                <p className="text-xs text-surface-500 leading-relaxed">{calculated.reason}</p>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] font-bold text-surface-400 uppercase mb-0.5">Priority</span>
                {prioritySource === 'calculated' ? (
                  <span className={`badge text-xs px-2.5 py-0.5 font-bold uppercase
                    ${activePriority === 'critical' ? 'bg-red-100 text-red-700' :
                      activePriority === 'high' ? 'bg-orange-100 text-orange-700' :
                      activePriority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {activePriority}
                  </span>
                ) : (
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="input py-1 px-2.5 text-xs bg-white dark:bg-surface-900 border-none font-bold"
                  >
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Deadline & Task Integration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={14} />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input pl-9 text-xs"
                />
              </div>
            </div>

            {/* Task Integration */}
            <div className="flex flex-col justify-end">
              <label className="block text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">To-Do Task Link</label>
              {linkedTask ? (
                <div className="flex items-center justify-between p-2 rounded-xl border bg-emerald-50/10 border-emerald-100 text-xs">
                  <span className="truncate pr-2 font-medium text-emerald-700 dark:text-emerald-400">
                    ✓ Task: {linkedTask.title} ({linkedTask.status})
                  </span>
                  <button
                    onClick={() => unlinkTaskMutation.mutate()}
                    disabled={unlinkTaskMutation.isPending}
                    className="text-surface-400 hover:text-red-500 p-1 rounded hover:bg-surface-50"
                    title="Unlink Task"
                  >
                    <Unlink size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => createTaskMutation.mutate()}
                    disabled={createTaskMutation.isPending}
                    className="flex-1 btn-ghost border border-surface-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Plus size={13} /> Convert to Task
                  </button>

                  <div className="relative flex-1">
                    <button
                      onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                      className="w-full btn-ghost border border-surface-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Link2 size={13} /> Link Exist
                    </button>

                    {showTaskDropdown && (
                      <div className="absolute bottom-full right-0 mb-1 w-56 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-xl z-20 p-2 space-y-1">
                        <p className="text-[9px] font-bold text-surface-400 uppercase px-2 py-1">Select Pending Task</p>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {linkableTasks.length > 0 ? (
                            linkableTasks.map((t) => (
                              <button
                                key={t._id}
                                onClick={() => linkTaskMutation.mutate(t._id)}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 text-[11px] truncate text-surface-700 dark:text-surface-300"
                              >
                                {t.title}
                              </button>
                            ))
                          ) : (
                            <p className="text-[10px] text-surface-400 text-center py-3">No linkable tasks</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit Log / History */}
          {item.history && item.history.length > 0 && (
            <div className="p-3 bg-surface-50 dark:bg-surface-800/40 rounded-xl border">
              <label className="block text-[10px] font-bold text-surface-400 uppercase mb-2">Workspace Audit History</label>
              <div className="max-h-24 overflow-y-auto text-[10px] text-surface-500 space-y-1.5 scrollbar-hide">
                {item.history.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-1 last:border-none">
                    <span>
                      Move: <strong className="capitalize">{log.previousQuadrant}</strong> → <strong className="capitalize">{log.newQuadrant}</strong>
                    </span>
                    <span className="text-surface-400 shrink-0 font-semibold">
                      {format(new Date(log.changedAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <button
            onClick={() => { if (confirm('Are you sure you want to delete this SWOT item?')) deleteMutation.mutate(false); }}
            disabled={deleteMutation.isPending}
            className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold flex items-center gap-1"
          >
            <Trash2 size={14} /> Delete Item
          </button>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-xs font-semibold px-4 py-2">Close</button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="btn-primary text-xs font-bold px-5 py-2 rounded-xl"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
