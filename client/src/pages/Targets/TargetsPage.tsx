import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, PlusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  format, startOfWeek, addDays, subDays, addMonths, subMonths,
  parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay
} from 'date-fns';
import { targetsApi } from '../../api/targets';
import type { Target as TargetType, TargetTimeframe, TargetPriority } from '../../types';
import TargetModal from './TargetModal';

const CATEGORIES = ['Career', 'Education', 'Finance', 'Fitness', 'Personal', 'Projects', 'Health', 'Travel', 'Other'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TargetsPage() {
  const queryClient = useQueryClient();

  // Primary planning view
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  
  // Date anchors
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<TargetPriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');
  const [dumpPlannedFilter, setDumpPlannedFilter] = useState<'all' | 'unplanned' | 'planned'>('all');

  // Dump input states
  const [dumpInput, setDumpInput] = useState('');

  // Selected Target detail modal
  const [selectedTarget, setSelectedTarget] = useState<TargetType | null>(null);
  
  // Target creation dialog states (to prefill modal fields)
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefilledFields, setPrefilledFields] = useState<Partial<TargetType>>({});

  // Fetch targets
  const { data: targets } = useQuery({
    queryKey: ['targets'],
    queryFn: () => targetsApi.getAll(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: targetsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      setDumpInput('');
      setShowAddModal(false);
      toast.success('Target created successfully!');
    },
    onError: () => toast.error('Failed to create target')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TargetType> }) => targetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
    onError: () => toast.error('Failed to update target')
  });

  const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
  const monthStr = format(currentMonth, 'yyyy-MM');

  // Filter and group target lists
  const activeTargets = targets ?? [];

  // A. Dump List items
  const rawDumpList = activeTargets.filter((t) => t.isDumpItem);
  const filteredDumpList = rawDumpList.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesPlanned = 
      dumpPlannedFilter === 'all' ||
      (dumpPlannedFilter === 'unplanned' && t.assignedType === 'none') ||
      (dumpPlannedFilter === 'planned' && t.assignedType !== 'none');
    return matchesSearch && matchesPriority && matchesCategory && matchesPlanned;
  });

  // B. Timeframe target views (matching selected week/month/year)
  const weeklyTargets = activeTargets.filter(
    (t) => t.assignedType === 'weekly' && t.weekStart === weekStartStr
  );
  const monthlyTargets = activeTargets.filter(
    (t) => t.assignedType === 'monthly' && t.month === monthStr
  );
  const yearlyTargets = activeTargets.filter(
    (t) => t.assignedType === 'yearly' && t.year === currentYear
  );

  const currentViewTargets = 
    activeTab === 'weekly' ? weeklyTargets :
    activeTab === 'monthly' ? monthlyTargets : yearlyTargets;

  // --- Handlers ---
  const handleAddDumpItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dumpInput.trim()) return;
    createMutation.mutate({
      title: dumpInput.trim(),
      isDumpItem: true,
      assignedType: 'none',
      status: 'not_started',
      progress: 0,
      progressMax: 100,
    });
  };

  const handleOpenAddModal = (timeframe: TargetTimeframe, extra: Partial<TargetType>) => {
    setPrefilledFields({
      assignedType: timeframe,
      isDumpItem: false,
      status: 'not_started',
      progress: 0,
      progressMax: 100,
      ...extra
    });
    setShowAddModal(true);
  };

  // --- HTML5 Drag and Drop ---
  const handleDragStart = (e: React.DragEvent, targetId: string) => {
    e.dataTransfer.setData('text/plain', targetId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToDump = (e: React.DragEvent) => {
    e.preventDefault();
    const targetId = e.dataTransfer.getData('text/plain');
    if (!targetId) return;

    updateMutation.mutate({
      id: targetId,
      data: {
        assignedType: 'none',
        weekStart: undefined,
        month: undefined,
        year: undefined,
        targetDate: undefined,
      }
    });
    toast.success('Target returned to Dump List');
  };

  const handleDropToTimeframe = (
    e: React.DragEvent,
    type: 'weekly' | 'monthly' | 'yearly',
    options?: { weekStart?: string; month?: string; year?: number; targetDate?: string }
  ) => {
    e.preventDefault();
    const targetId = e.dataTransfer.getData('text/plain');
    if (!targetId) return;

    const patch: Partial<TargetType> = {
      assignedType: type,
      weekStart: options?.weekStart,
      month: options?.month,
      year: options?.year,
      targetDate: options?.targetDate,
    };

    updateMutation.mutate({ id: targetId, data: patch });
    toast.success(`Target planned for ${formatDropLocation(type, options)}!`);
  };

  const formatDropLocation = (type: string, options?: any) => {
    if (options?.targetDate) return format(parseISO(options.targetDate), 'MMM d');
    if (type === 'monthly') return format(currentMonth, 'MMMM');
    if (type === 'yearly') return `Year ${currentYear}`;
    return 'selected week';
  };

  const handleQuickAssign = (targetId: string, timeframe: TargetTimeframe) => {
    const patch: Partial<TargetType> = {
      assignedType: timeframe,
    };
    if (timeframe === 'weekly') patch.weekStart = weekStartStr;
    if (timeframe === 'monthly') patch.month = monthStr;
    if (timeframe === 'yearly') patch.year = currentYear;
    if (timeframe === 'none') {
      patch.weekStart = undefined;
      patch.month = undefined;
      patch.year = undefined;
      patch.targetDate = undefined;
    }
    updateMutation.mutate({ id: targetId, data: patch });
    toast.success('Timeframe assignment updated');
  };

  // --- Calculate Calendar Grids ---

  // Weekly row days
  const getWeeklyDays = () => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeekStart, i));
    }
    return days;
  };

  // Monthly full grid days (including prev/next month pads)
  const getMonthlyGridDays = () => {
    const startVal = startOfMonth(currentMonth);
    const endVal = endOfMonth(currentMonth);
    
    // Day of week of 1st day (0 = Mon, ..., 6 = Sun)
    const startDayOfWeek = (getDay(startVal) + 6) % 7;
    
    
    const gridDays: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Previous Month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      gridDays.push({
        date: subDays(startVal, i + 1),
        isCurrentMonth: false
      });
    }
    
    // Current Month days
    const currentDays = eachDayOfInterval({ start: startVal, end: endVal });
    currentDays.forEach((d) => {
      gridDays.push({ date: d, isCurrentMonth: true });
    });
    
    // Next Month padding to round grid to multiple of 7 (35 or 42 slots)
    const totalSlots = gridDays.length <= 35 ? 35 : 42;
    const paddingSlots = totalSlots - gridDays.length;
    for (let i = 1; i <= paddingSlots; i++) {
      gridDays.push({
        date: addDays(endVal, i),
        isCurrentMonth: false
      });
    }
    
    return gridDays;
  };

  // Yearly 12 Month indices
  const getYearlyMonths = () => {
    const months: Date[] = [];
    const baseDate = parseISO(`${currentYear}-01-01`);
    for (let i = 0; i < 12; i++) {
      months.push(addMonths(baseDate, i));
    }
    return months;
  };

  // --- Calculate Dashboard Overview ---
  const getOverview = (type: 'weekly' | 'monthly' | 'yearly') => {
    const match = activeTargets.filter((t) => t.assignedType === type);
    const completed = match.filter((t) => t.status === 'completed').length;
    const progressSum = match.reduce((sum, t) => {
      const pct = t.progressMax > 0 ? (t.progress / t.progressMax) * 100 : 0;
      return sum + pct;
    }, 0);
    const avgProgress = match.length > 0 ? Math.round(progressSum / match.length) : 0;
    return { count: match.length, completed, progress: avgProgress };
  };

  const weeklyOverview = getOverview('weekly');
  const monthlyOverview = getOverview('monthly');
  const yearlyOverview = getOverview('yearly');
  const unplannedDumpCount = rawDumpList.filter((t) => t.assignedType === 'none').length;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Targets Planning Calendars</h2>
        <p className="text-sm text-surface-400 font-medium">
          Drag targets from your Dump List directly onto specific days, weeks, months, or years.
        </p>
      </div>

      {/* Target Dashboard Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-3.5 border bg-surface-50/10 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Weekly Calendar</span>
            <h4 className="text-lg font-black mt-0.5 text-surface-900 dark:text-surface-50">{weeklyOverview.count} Targets</h4>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold text-surface-500">
            <span>{weeklyOverview.completed} Completed</span>
            <span className="text-primary-500">{weeklyOverview.progress}% avg</span>
          </div>
        </div>

        <div className="card p-3.5 border bg-surface-50/10 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Monthly Calendar</span>
            <h4 className="text-lg font-black mt-0.5 text-surface-900 dark:text-surface-50">{monthlyOverview.count} Targets</h4>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold text-surface-500">
            <span>{monthlyOverview.completed} Completed</span>
            <span className="text-blue-500">{monthlyOverview.progress}% avg</span>
          </div>
        </div>

        <div className="card p-3.5 border bg-surface-50/10 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Annual Planning</span>
            <h4 className="text-lg font-black mt-0.5 text-surface-900 dark:text-surface-50">{yearlyOverview.count} Targets</h4>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold text-surface-500">
            <span>{yearlyOverview.completed} Completed</span>
            <span className="text-emerald-500">{yearlyOverview.progress}% avg</span>
          </div>
        </div>

        <div className="card p-3.5 border bg-surface-50/10 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Dump Pool</span>
            <h4 className="text-lg font-black mt-0.5 text-surface-900 dark:text-surface-50">{unplannedDumpCount} Unplanned</h4>
          </div>
          <div className="mt-2 text-xs text-surface-400 font-semibold">
            Unscheduled capturing pool
          </div>
        </div>
      </div>

      {/* Main targets grid splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: DUMP LIST POOL */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropToDump}
          className="lg:col-span-4 card p-5 border bg-surface-50/10 min-h-[550px] flex flex-col justify-between space-y-4"
        >
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-sm text-surface-900 dark:text-surface-50">Dump List Capture</h3>
              <p className="text-[10px] text-surface-400 mt-0.5">Quickly log targets without setting timetables</p>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddDumpItem} className="flex gap-2">
              <input
                value={dumpInput}
                onChange={(e) => setDumpInput(e.target.value)}
                placeholder="+ Add target to dump list"
                className="input py-1.5 px-3 text-xs"
              />
              <button type="submit" className="btn-primary py-1.5 px-3.5 text-xs shrink-0 font-black">+</button>
            </form>

            {/* Filters */}
            <div className="space-y-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dump list..."
                className="input py-1.5 px-3 text-xs w-full"
              />
              <div className="grid grid-cols-3 gap-1">
                <select
                  value={dumpPlannedFilter}
                  onChange={(e) => setDumpPlannedFilter(e.target.value as any)}
                  className="input py-1 px-1.5 text-[9px] bg-white border border-surface-200"
                >
                  <option value="all">All Plan</option>
                  <option value="unplanned">Unplanned</option>
                  <option value="planned">Planned</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="input py-1 px-1.5 text-[9px] bg-white border border-surface-200"
                >
                  <option value="all">All Prio</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input py-1 px-1.5 text-[9px] bg-white border border-surface-200"
                >
                  <option value="all">All Cat</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dump list container */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredDumpList.map((item) => {
                const isPlanned = item.assignedType !== 'none';
                return (
                  <div
                    key={item._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item._id)}
                    onClick={() => setSelectedTarget(item)}
                    className="p-3 bg-white dark:bg-surface-900 border rounded-xl shadow-sm hover:shadow transition-shadow cursor-grab active:cursor-grabbing text-left group relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold text-surface-900 dark:text-surface-50 truncate pr-4">{item.title}</h5>
                      <span className={`badge shrink-0 text-[8px] px-1 py-0.5 uppercase ${
                        item.priority === 'critical' ? 'bg-red-50 text-red-600' :
                        item.priority === 'high' ? 'bg-orange-50 text-orange-600' : 'bg-surface-100 text-surface-500'
                      }`}>
                        {item.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2 border-t pt-2 border-surface-50">
                      {isPlanned ? (
                        <span className="text-[9px] font-bold text-primary-500 capitalize">
                          Planned → {item.assignedType}
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-surface-400">
                          Unplanned
                        </span>
                      )}

                      <select
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleQuickAssign(item._id, e.target.value as TargetTimeframe)}
                        value={item.assignedType}
                        className="text-[9px] font-bold text-surface-50 bg-surface-100 dark:bg-surface-800 border-none rounded py-0.5 px-1.5 outline-none hover:bg-surface-200 transition-colors"
                      >
                        <option value="none">Set Timeframe</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                );
              })}

              {filteredDumpList.length === 0 && (
                <div className="text-center py-12 text-xs text-surface-400 font-semibold">
                  No dump items match current criteria.
                </div>
              )}
            </div>
          </div>

          <div className="text-[9.5px] text-surface-400 font-bold text-center border-t pt-2.5">
            Grab items and drop them onto any calendar day to schedule them.
          </div>
        </div>

        {/* RIGHT COLUMN: HORIZON CALENDAR PLANNING GRID */}
        <div className="lg:col-span-8 card p-5 border min-h-[550px] flex flex-col justify-between">
          <div>
            {/* View selectors tabs */}
            <div className="flex items-center justify-between border-b pb-3 mb-4 flex-wrap gap-3">
              <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
                {(['weekly', 'monthly', 'yearly'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                        : 'text-surface-500'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Timeframe Select navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (activeTab === 'weekly') setCurrentWeekStart(subDays(currentWeekStart, 7));
                    if (activeTab === 'monthly') setCurrentMonth(subMonths(currentMonth, 1));
                    if (activeTab === 'yearly') setCurrentYear(currentYear - 1);
                  }}
                  className="btn-ghost p-1 rounded hover:bg-surface-100"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs font-black text-surface-850 dark:text-surface-200">
                  {activeTab === 'weekly' && (
                    <>Week: {format(currentWeekStart, 'd MMM')} – {format(addDays(currentWeekStart, 6), 'd MMM yyyy')}</>
                  )}
                  {activeTab === 'monthly' && (
                    <>{format(currentMonth, 'MMMM yyyy')}</>
                  )}
                  {activeTab === 'yearly' && (
                    <>Year: {currentYear}</>
                  )}
                </span>

                <button
                  onClick={() => {
                    if (activeTab === 'weekly') setCurrentWeekStart(addDays(currentWeekStart, 7));
                    if (activeTab === 'monthly') setCurrentMonth(addMonths(currentMonth, 1));
                    if (activeTab === 'yearly') setCurrentYear(currentYear + 1);
                  }}
                  className="btn-ghost p-1 rounded hover:bg-surface-100"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* A. WEEKLY HORIZONTAL CALENDAR TIMELINE VIEW */}
            {activeTab === 'weekly' && (
              <div className="space-y-4">
                <div className="grid grid-cols-8 gap-2.5 items-stretch">
                  
                  {/* Unscheduled/Weekly backlog cell */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropToTimeframe(e, 'weekly', { weekStart: weekStartStr, targetDate: undefined })}
                    className="card p-3 border border-dashed bg-surface-50/10 flex flex-col justify-between min-h-[340px]"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                        <span className="text-[10px] font-black text-surface-600 uppercase">Backlog</span>
                        <button
                          onClick={() => handleOpenAddModal('weekly', { weekStart: weekStartStr, targetDate: undefined })}
                          className="text-surface-400 hover:text-primary-500"
                        >
                          <PlusCircle size={13} />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {weeklyTargets.filter((t) => !t.targetDate).map((target) => (
                          <div
                            key={target._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, target._id)}
                            onClick={() => setSelectedTarget(target)}
                            className="p-1.5 bg-white dark:bg-surface-900 border rounded-lg shadow-sm cursor-grab active:cursor-grabbing text-[10px] font-bold text-surface-850 dark:text-surface-100 truncate hover:border-primary-400"
                          >
                            {target.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 7 Days Row */}
                  {getWeeklyDays().map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayTargets = weeklyTargets.filter((t) => t.targetDate === dateStr);
                    return (
                      <div
                        key={dateStr}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropToTimeframe(e, 'weekly', { weekStart: weekStartStr, targetDate: dateStr })}
                        className="card p-3 border bg-surface-50/5 hover:border-surface-300 dark:hover:border-surface-700 flex flex-col justify-between min-h-[340px] transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                            <div className="flex flex-col items-start leading-none">
                              <span className="text-[9px] font-semibold text-surface-400 uppercase">{format(day, 'EEE')}</span>
                              <span className="text-xs font-black text-surface-850 dark:text-surface-100 mt-0.5">{format(day, 'd')}</span>
                            </div>
                            <button
                              onClick={() => handleOpenAddModal('weekly', { weekStart: weekStartStr, targetDate: dateStr })}
                              className="text-surface-400 hover:text-primary-500"
                            >
                              <PlusCircle size={13} />
                            </button>
                          </div>
                          
                          <div className="space-y-1.5">
                            {dayTargets.map((target) => (
                              <div
                                key={target._id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, target._id)}
                                onClick={() => setSelectedTarget(target)}
                                className="p-1.5 bg-white dark:bg-surface-900 border rounded-lg shadow-sm cursor-grab active:cursor-grabbing text-[10px] font-bold text-surface-850 dark:text-surface-100 truncate hover:border-primary-400"
                              >
                                {target.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* B. MONTHLY GRID CALENDAR VIEW */}
            {activeTab === 'monthly' && (
              <div className="space-y-3">
                
                {/* Monthly Unscheduled Backlog row */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropToTimeframe(e, 'monthly', { month: monthStr, targetDate: undefined })}
                  className="card p-3 border border-dashed bg-surface-50/10 mb-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-surface-600 uppercase">Monthly Backlog</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {monthlyTargets.filter((t) => !t.targetDate).map((target) => (
                        <div
                          key={target._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, target._id)}
                          onClick={() => setSelectedTarget(target)}
                          className="px-2.5 py-1 bg-white dark:bg-surface-900 border rounded-lg shadow-sm cursor-grab active:cursor-grabbing text-[10px] font-bold text-surface-850 dark:text-surface-100 truncate hover:border-primary-400"
                        >
                          {target.title}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAddModal('monthly', { month: monthStr, targetDate: undefined })}
                    className="text-surface-450 hover:text-primary-500 flex items-center gap-1 text-[10px] font-bold"
                  >
                    <Plus size={12} /> Add Backlog
                  </button>
                </div>

                {/* Grid Calendar */}
                <div className="grid grid-cols-7 gap-1 border rounded-2xl overflow-hidden bg-surface-200 dark:bg-surface-800">
                  {/* Weekday headers */}
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="bg-surface-50/50 dark:bg-surface-850 text-center py-1.5 text-[10px] font-bold text-surface-450 uppercase border-b border-surface-200 dark:border-surface-750">
                      {day}
                    </div>
                  ))}

                  {/* Grid cells */}
                  {getMonthlyGridDays().map(({ date, isCurrentMonth }, idx) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const cellTargets = monthlyTargets.filter((t) => t.targetDate === dateStr);
                    
                    return (
                      <div
                        key={idx}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropToTimeframe(e, 'monthly', { month: monthStr, targetDate: dateStr })}
                        className={`min-h-[70px] bg-white dark:bg-surface-900 p-2 flex flex-col justify-between border-b border-r border-surface-100 dark:border-surface-800 relative group transition-colors hover:bg-surface-50/30 ${
                          !isCurrentMonth ? 'opacity-30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-surface-450">{format(date, 'd')}</span>
                          <button
                            onClick={() => handleOpenAddModal('monthly', { month: monthStr, targetDate: dateStr })}
                            className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-primary-500"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* List targets inside date cell */}
                        <div className="space-y-0.5 mt-1 max-h-[48px] overflow-y-auto scrollbar-hide">
                          {cellTargets.map((target) => (
                            <div
                              key={target._id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, target._id)}
                              onClick={(e) => { e.stopPropagation(); setSelectedTarget(target); }}
                              className="px-1 py-0.5 bg-surface-100/50 dark:bg-surface-800 border border-surface-150 rounded text-[8px] truncate font-bold cursor-grab hover:border-primary-400"
                              title={target.title}
                            >
                              {target.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* C. YEARLY ANNUAL 12-MONTH CARD GRID VIEW */}
            {activeTab === 'yearly' && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {getYearlyMonths().map((monthDate) => {
                  const mStr = format(monthDate, 'yyyy-MM');
                  const mTargets = yearlyTargets.filter((t) => t.month === mStr || (t.year === currentYear && t.month === undefined));
                  
                  return (
                    <div
                      key={mStr}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropToTimeframe(e, 'yearly', { year: currentYear, month: mStr })}
                      className="card p-3 border bg-surface-50/5 hover:border-surface-300 dark:hover:border-surface-700 flex flex-col justify-between min-h-[140px] transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b pb-1 mb-2">
                          <span className="text-[11px] font-black uppercase text-surface-800 dark:text-surface-200">
                            {format(monthDate, 'MMMM')}
                          </span>
                          <button
                            onClick={() => handleOpenAddModal('yearly', { year: currentYear, month: mStr })}
                            className="text-surface-400 hover:text-primary-500"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="space-y-1 max-h-[80px] overflow-y-auto">
                          {mTargets.map((target) => (
                            <div
                              key={target._id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, target._id)}
                              onClick={() => setSelectedTarget(target)}
                              className="p-1 bg-white dark:bg-surface-900 border rounded text-[9px] font-bold text-surface-800 dark:text-surface-150 truncate cursor-grab hover:border-primary-400"
                            >
                              {target.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Overview Footer */}
          <div className="text-[10px] text-surface-400 font-bold border-t pt-3 mt-5 flex items-center justify-between">
            <span>Grid Completion Rate: {percentageSummary(currentViewTargets)}%</span>
            <span>Planning Horizon: {activeTab.toUpperCase()} View</span>
          </div>
        </div>

      </div>

      {/* Target details modal */}
      <AnimatePresence>
        {selectedTarget && (
          <TargetModal
            target={selectedTarget}
            onClose={() => setSelectedTarget(null)}
            onSave={() => setSelectedTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Direct Add Target Modal Popup */}
      <AnimatePresence>
        {showAddModal && (
          <TargetQuickAddModal
            prefilled={prefilledFields}
            onClose={() => setShowAddModal(false)}
            onSave={(newTarget) => createMutation.mutate(newTarget)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick Add modal wrapper to keep the form creation clean
function TargetQuickAddModal({
  prefilled,
  onClose,
  onSave
}: {
  prefilled: Partial<TargetType>;
  onClose: () => void;
  onSave: (data: Partial<TargetType>) => void;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TargetPriority>('medium');
  const [category, setCategory] = useState('Career');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      ...prefilled,
      title: title.trim(),
      priority,
      category
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-900 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="font-black text-sm text-surface-900 dark:text-surface-50">Quick Add Target</h4>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[10px] text-surface-400 uppercase mb-1">Target title *</label>
            <input
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input text-xs"
              placeholder="e.g. Solve weekly code problem"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-surface-400 uppercase mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TargetPriority)} className="input text-xs">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-surface-400 uppercase mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input text-xs">
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Create Target</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helpers
function percentageSummary(list: TargetType[]) {
  if (list.length === 0) return 0;
  const completed = list.filter((t) => t.status === 'completed').length;
  return Math.round((completed / list.length) * 100);
}
