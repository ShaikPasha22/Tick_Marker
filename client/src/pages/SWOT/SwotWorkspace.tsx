import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Search, Grid, List, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { swotApi } from '../../api/swot';
import type { SwotItem, SwotQuadrant, PriorityLevel, ItemStatus } from '../../types';
import SwotItemModal from './SwotItemModal';

const QUADRANTS: { key: SwotQuadrant; title: string; desc: string; color: string; bg: string; text: string }[] = [
  { key: 'strengths', title: 'Strengths 💪', desc: 'Internal positive attributes and advantages', color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', text: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'weaknesses', title: 'Weaknesses 🧠', desc: 'Internal negatives or areas needing focus', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)', text: 'text-rose-600 dark:text-rose-400' },
  { key: 'opportunities', title: 'Opportunities 🚀', desc: 'External potential and paths to leverage', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)', text: 'text-blue-600 dark:text-blue-400' },
  { key: 'threats', title: 'Threats ⚠️', desc: 'External risks, challenges or obstacles', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', text: 'text-amber-600 dark:text-amber-500' },
];

export default function SwotWorkspace() {
  const { id: swotId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'board' | 'priority_list' | 'analytics'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedQuadrantFilter, setSelectedQuadrantFilter] = useState<SwotQuadrant | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('all');
  const [taskLinkedFilter, setTaskLinkedFilter] = useState<'all' | 'linked' | 'unlinked'>('all');

  const [selectedItem, setSelectedItem] = useState<SwotItem | null>(null);
  
  // Quick add input states
  const [quickAddQuadrant, setQuickAddQuadrant] = useState<SwotQuadrant | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  // Fetch SWOT analysis metadata
  const { data: swot } = useQuery({
    queryKey: ['swot-analysis', swotId],
    queryFn: () => swotApi.get(swotId!),
    enabled: !!swotId,
  });

  // Fetch SWOT items
  const { data: items } = useQuery({
    queryKey: ['swot-items', swotId],
    queryFn: () => swotApi.getItems(swotId!),
    enabled: !!swotId,
  });


  // Mutations
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: Partial<SwotItem> }) =>
      swotApi.updateItem(swotId!, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot-items', swotId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => toast.error('Failed to update SWOT item')
  });

  const createItemMutation = useMutation({
    mutationFn: (data: Partial<SwotItem>) => swotApi.createItem(swotId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swot-items', swotId] });
      toast.success('SWOT item added!');
      setQuickAddQuadrant(null);
      setQuickAddTitle('');
    },
    onError: () => toast.error('Failed to add SWOT item')
  });

  // Drag and drop mechanics
  const handleDragStart = (e: React.DragEvent, item: SwotItem) => {
    e.dataTransfer.setData('text/plain', item._id);
  };

  const handleDrop = (e: React.DragEvent, targetQuadrant: SwotQuadrant) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;

    const originalItem = items?.find((i) => i._id === itemId);
    if (!originalItem) return;

    if (originalItem.quadrant === targetQuadrant) return; // same quadrant

    // Calculate new position (append at bottom)
    const existingCount = items?.filter((i) => i.quadrant === targetQuadrant).length ?? 0;

    // Update via mutation
    updateItemMutation.mutate({
      itemId,
      data: {
        quadrant: targetQuadrant,
        position: existingCount,
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleQuickAddSubmit = (quadrant: SwotQuadrant) => {
    if (!quickAddTitle.trim()) return;
    createItemMutation.mutate({
      title: quickAddTitle.trim(),
      quadrant
    });
  };

  // Filtering implementation
  const activeItems = items ?? [];
  const filteredItems = activeItems.filter((item) => {
    // Search query matches title/description/notes
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;
    const matchesQuadrant = selectedQuadrantFilter === 'all' || item.quadrant === selectedQuadrantFilter;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    // Task linked check
    const isLinked = !!item.taskId;
    const matchesLink =
      taskLinkedFilter === 'all' ||
      (taskLinkedFilter === 'linked' && isLinked) ||
      (taskLinkedFilter === 'unlinked' && !isLinked);

    return matchesSearch && matchesPriority && matchesQuadrant && matchesStatus && matchesLink;
  });

  // Item counts by Quadrant & Priority
  const getQuadrantCount = (q: SwotQuadrant) => activeItems.filter((i) => i.quadrant === q).length;
  const getPriorityCount = (p: PriorityLevel) => activeItems.filter((i) => i.priority === p).length;
  const unclassifiedCount = getQuadrantCount('unclassified');

  // Analytics Helpers
  const totalCount = activeItems.length;
  const completedCount = activeItems.filter((i) => i.status === 'completed').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const linkedTasksCount = activeItems.filter((i) => i.taskId).length;
  const taskConversionRate = totalCount > 0 ? Math.round((linkedTasksCount / totalCount) * 100) : 0;

  // Average Priority Score Calculation
  const avgPriorityScore = totalCount > 0 
    ? (activeItems.reduce((sum, item) => sum + (item.priorityScore ?? 0), 0) / totalCount).toFixed(1)
    : '0.0';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedPriority('all');
    setSelectedQuadrantFilter('all');
    setSelectedStatus('all');
    setTaskLinkedFilter('all');
  };

  // Render quadrant component helper
  const renderQuadrant = (qKey: SwotQuadrant, qTitle: string, qDesc: string, qColor: string, qBg: string, qText: string) => {
    const quadrantItems = filteredItems.filter((i) => i.quadrant === qKey);
    const isAdding = quickAddQuadrant === qKey;

    return (
      <div
        key={qKey}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, qKey)}
        className="card p-4 border flex flex-col justify-between min-h-[300px] transition-all hover:border-surface-300 dark:hover:border-surface-700"
        style={{ backgroundColor: qBg }}
      >
        <div>
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <div>
              <h4 className={`font-black text-sm uppercase ${qText}`}>{qTitle}</h4>
              <p className="text-[10px] text-surface-450 dark:text-surface-400 font-semibold">{qDesc}</p>
            </div>
            <span className="badge text-[10px] px-2 py-0.5 font-black bg-white dark:bg-surface-800 border" style={{ color: qColor }}>
              {quadrantItems.length}
            </span>
          </div>

          <div className="space-y-2 min-h-[160px]">
            {quadrantItems.map((item) => (
              <div
                key={item._id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => setSelectedItem(item)}
                className="p-3 bg-white dark:bg-surface-900 border rounded-xl shadow-sm hover:shadow transition-all cursor-grab active:cursor-grabbing relative group"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h5 className="text-xs font-bold text-surface-900 dark:text-surface-50 group-hover:text-primary-500 transition-colors line-clamp-2">
                    {item.title}
                  </h5>
                  {item.taskId && (
                    <span className="shrink-0 text-[10px] text-emerald-500 font-bold" title="Task Linked">✓</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className={`badge text-[9px] uppercase font-bold px-1.5 py-0.5
                    ${item.priority === 'critical' ? 'bg-red-50 text-red-600' :
                      item.priority === 'high' ? 'bg-orange-50 text-orange-600' :
                      item.priority === 'medium' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.priority}
                  </span>
                  
                  <span className="badge bg-surface-50 dark:bg-surface-800 text-surface-450 text-[9px] px-1.5 font-semibold">
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}

            {quadrantItems.length === 0 && !isAdding && (
              <div className="text-center py-10 text-[11px] text-surface-400 font-medium">
                Drag items here to classify
              </div>
            )}
          </div>
        </div>

        {/* Inline Quick Add */}
        <div className="mt-3 pt-3 border-t">
          {isAdding ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAddSubmit(qKey); }}
                className="input py-1 px-2.5 text-xs flex-1"
                placeholder="Item title..."
              />
              <button
                onClick={() => handleQuickAddSubmit(qKey)}
                className="btn-primary py-1 px-2.5 rounded-lg text-xs"
              >
                Add
              </button>
              <button
                onClick={() => setQuickAddQuadrant(null)}
                className="text-surface-400 hover:text-surface-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setQuickAddQuadrant(qKey); setQuickAddTitle(''); }}
              className="w-full py-1.5 border border-dashed rounded-lg text-xs font-semibold text-surface-500 hover:bg-white dark:hover:bg-surface-800 flex items-center justify-center gap-1"
            >
              <Plus size={12} /> Add Item
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back button and page title */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/swot')}
            className="btn-ghost p-2 rounded-xl text-surface-500 hover:bg-surface-100"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">
                {swot?.name || 'SWOT Workspace'}
              </h2>
              {swot?.category && (
                <span className="badge bg-primary-50 text-primary-600 text-[10px] uppercase font-bold">
                  {swot.category}
                </span>
              )}
            </div>
            <p className="text-xs text-surface-400 mt-0.5">
              {swot?.description || 'Prioritize planning objectives using SWOT quadrants and severity matrix.'}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'board'
                ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                : 'text-surface-500'
            }`}
          >
            <Grid size={13} /> Board View
          </button>
          <button
            onClick={() => setActiveTab('priority_list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'priority_list'
                ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                : 'text-surface-500'
            }`}
          >
            <List size={13} /> Prioritized View
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                : 'text-surface-500'
            }`}
          >
            <BarChart2 size={13} /> Analytics
          </button>
        </div>
      </div>

      {/* PRIORITIZATION SUMMARY DASHBOARD */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total card */}
        <div className="card p-3 border flex flex-col justify-between bg-surface-50/20">
          <span className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Total Items</span>
          <span className="text-xl font-black text-surface-900 dark:text-surface-50 mt-1">{totalCount}</span>
        </div>

        {/* Priority Filter badges */}
        {(['critical', 'high', 'medium', 'low'] as const).map((p) => {
          const count = getPriorityCount(p);
          const colorClass = p === 'critical' ? 'text-red-500' : p === 'high' ? 'text-orange-500' : p === 'medium' ? 'text-blue-500' : 'text-emerald-500';
          const bgHover = p === 'critical' ? 'hover:bg-red-50/10' : p === 'high' ? 'hover:bg-orange-50/10' : p === 'medium' ? 'hover:bg-blue-50/10' : 'hover:bg-emerald-50/10';

          return (
            <div
              key={p}
              onClick={() => setSelectedPriority(selectedPriority === p ? 'all' : p)}
              className={`card p-3 border flex flex-col justify-between cursor-pointer transition-all ${bgHover}
                ${selectedPriority === p ? 'ring-2 ring-primary-500' : ''}`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider ${colorClass}`}>{p}</span>
              <span className="text-xl font-black text-surface-800 dark:text-surface-100 mt-1">{count}</span>
            </div>
          );
        })}
      </div>

      {/* FILTER PANEL AND SEARCH BAR */}
      <div className="card p-4 border space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-450" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 py-1.5 text-xs"
              placeholder="Search by title, desc, notes..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Quadrant Filter */}
            <select
              value={selectedQuadrantFilter}
              onChange={(e) => setSelectedQuadrantFilter(e.target.value as SwotQuadrant | 'all')}
              className="input py-1 px-2.5 text-xs max-w-[130px] border-surface-200"
            >
              <option value="all">All Quadrants</option>
              <option value="strengths">Strengths</option>
              <option value="weaknesses">Weaknesses</option>
              <option value="opportunities">Opportunities</option>
              <option value="threats">Threats</option>
              <option value="unclassified">Unclassified</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ItemStatus | 'all')}
              className="input py-1 px-2.5 text-xs max-w-[130px] border-surface-200"
            >
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Task Link Filter */}
            <select
              value={taskLinkedFilter}
              onChange={(e) => setTaskLinkedFilter(e.target.value as any)}
              className="input py-1 px-2.5 text-xs max-w-[130px] border-surface-200"
            >
              <option value="all">All Task Links</option>
              <option value="linked">Task Linked</option>
              <option value="unlinked">Not Linked</option>
            </select>

            {(searchQuery || selectedPriority !== 'all' || selectedQuadrantFilter !== 'all' || selectedStatus !== 'all' || taskLinkedFilter !== 'all') && (
              <button
                onClick={clearAllFilters}
                className="btn-ghost text-xs text-primary-500 font-bold px-3"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'board' ? (
        /* ============ SWOT BOARD VIEW ============ */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {QUADRANTS.map((quad) =>
              renderQuadrant(quad.key, quad.title, quad.desc, quad.color, quad.bg, quad.text)
            )}
          </div>

          {/* UNCLASSIFIED POOL */}
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'unclassified')}
            className="card p-5 border bg-surface-50/20 dark:bg-surface-800/10 min-h-[160px]"
          >
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div>
                <h4 className="font-black text-xs uppercase text-surface-700 dark:text-surface-300">
                  Unclassified Pool 🗃️
                </h4>
                <p className="text-[10px] text-surface-400 font-semibold">
                  Items waiting to be dragged and dropped into a SWOT quadrant
                </p>
              </div>
              <span className="badge text-[10px] px-2 py-0.5 bg-white dark:bg-surface-800 border">
                {unclassifiedCount}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.filter((i) => i.quadrant === 'unclassified').map((item) => (
                <div
                  key={item._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onClick={() => setSelectedItem(item)}
                  className="p-3 bg-white dark:bg-surface-900 border rounded-xl shadow-sm hover:shadow transition-all cursor-grab active:cursor-grabbing relative flex flex-col justify-between"
                >
                  <h5 className="text-xs font-bold text-surface-900 dark:text-surface-50 line-clamp-2 mb-2">
                    {item.title}
                  </h5>
                  <span className="text-[9px] text-surface-400 font-bold bg-surface-100 dark:bg-surface-800 py-0.5 px-2 rounded w-fit">
                    Unclassified
                  </span>
                </div>
              ))}
            </div>

            {unclassifiedCount === 0 && (
              <div className="text-center py-6 text-xs text-surface-400 font-medium">
                No unclassified items. Click "+ Add Item" inside any quadrant or click below to create one.
              </div>
            )}

            {quickAddQuadrant === 'unclassified' ? (
              <div className="flex gap-2 max-w-md mt-4">
                <input
                  autoFocus
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAddSubmit('unclassified'); }}
                  className="input py-1.5 px-3 text-xs flex-1"
                  placeholder="Unclassified item name..."
                />
                <button
                  onClick={() => handleQuickAddSubmit('unclassified')}
                  className="btn-primary py-1.5 px-3 rounded-xl text-xs"
                >
                  Add
                </button>
                <button
                  onClick={() => setQuickAddQuadrant(null)}
                  className="text-surface-400 hover:text-surface-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setQuickAddQuadrant('unclassified'); setQuickAddTitle(''); }}
                className="w-48 py-1.5 border border-dashed rounded-xl text-xs font-semibold text-surface-500 hover:bg-white dark:hover:bg-surface-800 flex items-center justify-center gap-1.5 mt-4"
              >
                <Plus size={13} /> Add Unclassified Item
              </button>
            )}
          </div>
        </div>
      ) : activeTab === 'priority_list' ? (
        /* ============ PRIORITIZED LIST VIEW ============ */
        <div className="card p-5 border space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-extrabold text-sm text-surface-800 dark:text-surface-200">
              Prioritized Task Ranking
            </h4>
            <span className="text-xs text-surface-400 font-medium">
              Sorted by Priority Score (SWOT + Impact + Urgency + Severity)
            </span>
          </div>

          <div className="space-y-2">
            {[...filteredItems].sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0)).map((item, idx) => (
              <div
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className="p-3 bg-surface-50/40 dark:bg-surface-900/10 hover:bg-surface-50 border rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-surface-150 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-surface-900 dark:text-surface-50 truncate">{item.title}</h5>
                    <p className="text-[10px] text-surface-450 capitalize font-medium">
                      Quadrant: {item.quadrant} · Score: {item.priorityScore}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`badge text-[9px] uppercase font-bold px-2 py-0.5
                    ${item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      item.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {item.priority}
                  </span>
                  <span className={`badge text-[9px] uppercase font-bold px-2 py-0.5 bg-surface-100 text-surface-600`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <p className="text-center py-10 text-xs text-surface-400 font-medium">No items match current filters.</p>
            )}
          </div>
        </div>
      ) : (
        /* ============ ANALYTICS VIEW ============ */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card p-5 border flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-surface-500 uppercase tracking-wider">Completion Performance</h4>
              <p className="text-[10px] text-surface-400 font-semibold mt-0.5">Overall task completions in this workspace</p>
            </div>
            <div className="py-6 flex items-center justify-center relative">
              <svg width="120" height="120" className="transform -rotate-90">
                <circle cx="60" cy="60" r="50" className="stroke-surface-100 dark:stroke-surface-800 fill-transparent" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="50"
                  className="stroke-primary-500 fill-transparent"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 - (completionRate / 100) * 2 * Math.PI * 50}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-black text-surface-900 dark:text-surface-50">{completionRate}%</span>
                <p className="text-[8px] uppercase font-bold text-surface-400">completed</p>
              </div>
            </div>
            <div className="text-center text-xs text-surface-500 font-medium">
              {completedCount} of {totalCount} items resolved
            </div>
          </div>

          <div className="card p-5 border flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-surface-500 uppercase tracking-wider">Task Link Conversion</h4>
              <p className="text-[10px] text-surface-400 font-semibold mt-0.5">SWOT items converted/linked to general Tasks</p>
            </div>
            <div className="py-6 flex items-center justify-center relative">
              <svg width="120" height="120" className="transform -rotate-90">
                <circle cx="60" cy="60" r="50" className="stroke-surface-100 dark:stroke-surface-800 fill-transparent" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="50"
                  className="stroke-emerald-500 fill-transparent"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 - (taskConversionRate / 100) * 2 * Math.PI * 50}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-black text-surface-900 dark:text-surface-50">{taskConversionRate}%</span>
                <p className="text-[8px] uppercase font-bold text-surface-400">linked</p>
              </div>
            </div>
            <div className="text-center text-xs text-surface-500 font-medium">
              {linkedTasksCount} of {totalCount} items linked
            </div>
          </div>

          <div className="card p-5 border flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-surface-500 uppercase tracking-wider">Severity Engine Summary</h4>
              <p className="text-[10px] text-surface-400 font-semibold mt-0.5">Average Priority Score distribution</p>
            </div>
            <div className="flex flex-col items-center justify-center py-6">
              <span className="text-4xl font-black text-primary-500">{avgPriorityScore}</span>
              <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider mt-1">Average Score</p>
            </div>
            <div className="space-y-1.5 border-t pt-3 text-[10px] text-surface-500">
              <div className="flex justify-between font-medium">
                <span>Strengths count:</span>
                <span>{getQuadrantCount('strengths')}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Weaknesses count:</span>
                <span>{getQuadrantCount('weaknesses')}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Opportunities count:</span>
                <span>{getQuadrantCount('opportunities')}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Threats count:</span>
                <span>{getQuadrantCount('threats')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SWOT Item Edit Modal */}
      <AnimatePresence>
        {selectedItem && (
          <SwotItemModal
            swotId={swotId!}
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onSave={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
