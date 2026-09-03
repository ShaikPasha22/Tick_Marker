import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Link2, Unlink, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { targetsApi } from '../../api/targets';
import { tasksApi } from '../../api/tasks';
import type { Target, TargetPriority, TargetStatus, TargetProgressType } from '../../types';

interface TargetModalProps {
  target: Target;
  onClose: () => void;
  onSave: () => void;
}

const PRIORITIES: TargetPriority[] = ['low', 'medium', 'high', 'critical'];
const STATUSES: { value: TargetStatus; label: string }[] = [
  { value: 'not_started', label: '○ Not Started' },
  { value: 'in_progress', label: '◐ In Progress' },
  { value: 'completed', label: '✓ Completed' },
  { value: 'deferred', label: '→ Deferred' },
  { value: 'cancelled', label: '✕ Cancelled' },
];

const CATEGORIES = ['Career', 'Education', 'Finance', 'Fitness', 'Personal', 'Projects', 'Health', 'Travel', 'Other'];

export default function TargetModal({ target, onClose, onSave }: TargetModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(target.title);
  const [description, setDescription] = useState(target.description ?? '');
  const [notes, setNotes] = useState(target.notes ?? '');
  const [category, setCategory] = useState(target.category ?? 'Other');
  const [priority, setPriority] = useState<TargetPriority>(target.priority);
  const [status, setStatus] = useState<TargetStatus>(target.status);
  const [progressType, setProgressType] = useState<TargetProgressType>(target.progressType);
  const [progress, setProgress] = useState(target.progress);
  const [progressMax, setProgressMax] = useState(target.progressMax);
  const [targetDate, setTargetDate] = useState(target.targetDate ? target.targetDate.slice(0, 10) : '');

  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  // Fetch user tasks
  const { data: allTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.getAll,
  });

  // Determine currently linked task IDs (stabilize format since populated vs unpopulated raw ObjectId array)
  const currentLinkedIds = (target.linkedTaskIds ?? []).map((t: any) => typeof t === 'object' ? t._id : t);
  const linkedTasks = allTasks?.filter((t) => currentLinkedIds.includes(t._id)) ?? [];
  const linkableTasks = allTasks?.filter((t) => !currentLinkedIds.includes(t._id) && t.status === 'pending') ?? [];

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Target>) => targetsApi.update(target._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Target updated successfully!');
      onSave();
    },
    onError: () => toast.error('Failed to update target')
  });

  const deleteMutation = useMutation({
    mutationFn: () => targetsApi.delete(target._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      toast.success('Target deleted successfully');
      onClose();
    },
    onError: () => toast.error('Failed to delete target')
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    // Sanitize progress
    let finalProgress = Number(progress);
    const finalMax = progressType === 'binary' ? 100 : Number(progressMax);
    if (progressType === 'binary') {
      finalProgress = status === 'completed' ? 100 : 0;
    } else {
      if (finalProgress > finalMax) finalProgress = finalMax;
      if (finalProgress < 0) finalProgress = 0;
    }

    updateMutation.mutate({
      title,
      description,
      notes,
      category,
      priority,
      status,
      progressType,
      progress: finalProgress,
      progressMax: finalMax,
      targetDate: targetDate || undefined,
    });
  };

  const handleLinkTask = (taskId: string) => {
    const updatedIds = [...currentLinkedIds, taskId];
    updateMutation.mutate({ linkedTaskIds: updatedIds as any });
  };

  const handleUnlinkTask = (taskId: string) => {
    const updatedIds = currentLinkedIds.filter((id) => id !== taskId);
    updateMutation.mutate({ linkedTaskIds: updatedIds as any });
  };

  // Optional: Auto calculate progress from tasks
  const handleAutoCalculateProgress = () => {
    if (linkedTasks.length === 0) {
      toast.error('No linked tasks to calculate progress from');
      return;
    }
    const completed = linkedTasks.filter((t) => t.status === 'completed').length;
    const calculatedPercentage = Math.round((completed / linkedTasks.length) * 100);

    if (progressType === 'percentage') {
      setProgress(calculatedPercentage);
      setProgressMax(100);
    } else if (progressType === 'numeric') {
      setProgress(completed);
      setProgressMax(linkedTasks.length);
    } else if (progressType === 'binary') {
      setStatus(completed === linkedTasks.length ? 'completed' : 'in_progress');
    }
    toast.success(`Calculated progress: ${completed}/${linkedTasks.length} tasks completed!`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-50">Target Planning</h3>
            <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider mt-0.5">
              Timeframe: {target.assignedType.toUpperCase()}
            </p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600"><X size={18} /></button>
        </div>

        <div className="space-y-4 text-xs font-semibold text-surface-700 dark:text-surface-300">
          {/* Title */}
          <div>
            <label className="block text-[10px] text-surface-400 uppercase tracking-wider mb-1">Target Objective *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input font-bold text-sm"
              placeholder="e.g. Read 20 books"
            />
          </div>

          {/* Scheduled Date */}
          {target.assignedType !== 'none' && (
            <div>
              <label className="block text-[10px] text-surface-400 uppercase tracking-wider mb-1">Scheduled Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input py-1.5 px-3 text-xs"
              />
            </div>
          )}

          {/* Description & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-surface-400 uppercase tracking-wider mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input resize-none"
                rows={2}
                placeholder="Overview of the objective..."
              />
            </div>
            <div>
              <label className="block text-[10px] text-surface-400 uppercase tracking-wider mb-1">Action Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input resize-none"
                rows={2}
                placeholder="Key action steps..."
              />
            </div>
          </div>

          {/* Category, Priority, Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-surface-400 uppercase tracking-wider mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input p-2">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-surface-400 uppercase tracking-wider mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TargetPriority)} className="input p-2">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-surface-400 uppercase tracking-wider mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as TargetStatus)} className="input p-2">
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Tracking Details */}
          <div className="bg-surface-50 dark:bg-surface-850 p-3 rounded-xl border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-surface-400 uppercase tracking-wider font-bold">Progress System</span>
              <div className="flex bg-surface-200 dark:bg-surface-800 rounded-lg p-0.5">
                {(['percentage', 'numeric', 'binary'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProgressType(type)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize transition-colors ${
                      progressType === type
                        ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900'
                        : 'text-surface-500'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {progressType === 'percentage' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Completion Percentage</span>
                  <span className="font-extrabold text-sm">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
              </div>
            )}

            {progressType === 'numeric' && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[9px] text-surface-400 uppercase mb-1">Current Progress</label>
                  <input
                    type="number"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="input py-1.5 px-3"
                  />
                </div>
                <div className="flex-none text-lg pt-4 text-surface-400">/</div>
                <div className="flex-1">
                  <label className="block text-[9px] text-surface-400 uppercase mb-1">Target Max</label>
                  <input
                    type="number"
                    value={progressMax}
                    onChange={(e) => setProgressMax(Number(e.target.value))}
                    className="input py-1.5 px-3"
                  />
                </div>
              </div>
            )}

            {progressType === 'binary' && (
              <div className="flex items-center justify-between">
                <span>Simple Goal Resolution</span>
                <span className={`badge uppercase ${status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-150 text-surface-500'}`}>
                  {status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
            )}
          </div>

          {/* Optional Task Integration */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] text-surface-400 uppercase tracking-wider">Supporting Tasks</label>
              {linkedTasks.length > 0 && (
                <button
                  onClick={handleAutoCalculateProgress}
                  className="text-[10px] text-primary-500 hover:text-primary-600 flex items-center gap-1 font-bold"
                  title="Auto calculate target progress from linked tasks status"
                >
                  <Sparkles size={11} /> Sync Progress
                </button>
              )}
            </div>

            {/* List Linked Tasks */}
            <div className="space-y-1.5">
              {linkedTasks.map((t) => (
                <div key={t._id} className="flex items-center justify-between p-2 rounded-xl border bg-surface-50/50">
                  <span className="truncate pr-2">
                    {t.status === 'completed' ? '✓' : '○'} {t.title}
                  </span>
                  <button
                    onClick={() => handleUnlinkTask(t._id)}
                    className="text-surface-400 hover:text-red-500"
                    title="Unlink Task"
                  >
                    <Unlink size={13} />
                  </button>
                </div>
              ))}

              {linkedTasks.length === 0 && (
                <p className="text-[10px] text-surface-400 py-1">No tasks linked to this target.</p>
              )}
            </div>

            {/* Link Exist Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                className="btn-ghost border border-dashed py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1"
              >
                <Link2 size={12} /> Link Existing Task
              </button>

              {showTaskDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-surface-900 border rounded-xl shadow-xl z-20 p-2 space-y-1">
                  <p className="text-[9px] font-bold text-surface-400 uppercase px-2">Select Pending Task</p>
                  <div className="max-h-36 overflow-y-auto space-y-0.5">
                    {linkableTasks.length > 0 ? (
                      linkableTasks.map((t) => (
                        <button
                          key={t._id}
                          onClick={() => { handleLinkTask(t._id); setShowTaskDropdown(false); }}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-850 text-[10px] truncate"
                        >
                          {t.title}
                        </button>
                      ))
                    ) : (
                      <p className="text-[10px] text-surface-400 text-center py-2">No pending tasks</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <button
            onClick={() => { if (confirm('Are you sure you want to delete this target?')) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
            className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold flex items-center gap-1"
          >
            <Trash2 size={14} /> Delete
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
      </div>
    </div>
  );
}
