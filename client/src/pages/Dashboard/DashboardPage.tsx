import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Trophy, TrendingUp, Clock, AlertTriangle, ChevronRight, Plus, Lightbulb } from 'lucide-react';
import { analyticsApi } from '../../api/analytics';
import { completionsApi } from '../../api/completions';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import type { DayHabitEntry } from '../../types';
import FinancialSummaryWidget from '../../components/finance/FinancialSummaryWidget';

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2`} style={{ backgroundColor: `${color}20` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{value}</p>
      <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{label}</p>
      {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function ProgressRing({ rate, size = 80 }: { rate: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  // dashOffset = circumference means 0% (empty ring), 0 means 100% (full ring)
  const dashOffset = circumference - (rate / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring shrink-0">
      {/* Track circle */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={6}
        className="text-surface-200 dark:text-surface-700"
      />
      {/* Progress arc — rotated -90° so it starts at 12 o'clock */}
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#6366f1" strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" className="text-xs font-bold fill-surface-900 dark:fill-surface-100" fontSize={14}>
        {rate}%
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsApi.getDashboard,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60,
  });

  const { data: dayView } = useQuery({
    queryKey: ['completions', 'day', todayStr],
    queryFn: () => completionsApi.getDay(todayStr),
  });

  const { data: insights } = useQuery({
    queryKey: ['insights'],
    queryFn: analyticsApi.getInsights,
    staleTime: 1000 * 60 * 5,
  });

  const pending = dayView?.habits.filter((h) => !h.completion || h.completion.status === 'missed') ?? [];

  if (dashLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  const today = dashboard?.today;
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-surface-500 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <Link to="/habits?create=1" className="btn-primary" id="dashboard-add-habit-btn">
          <Plus size={16} /> Add Habit
        </Link>
      </div>

      {/* Today's progress hero */}
      {today && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-6 flex items-center gap-6"
        >
          <ProgressRing rate={today.completionRate} />
          <div className="flex-1">
            <h3 className="font-bold text-lg text-surface-900 dark:text-surface-50">Today's Progress</h3>
            <p className="text-surface-500 text-sm mb-3">
              {today.completed} of {today.scheduled} habits completed
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> {today.completed} Completed
              </span>
              {today.missed > 0 && (
                <span className="flex items-center gap-1.5 text-red-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> {today.missed} Missed
                </span>
              )}
              {today.skipped > 0 && (
                <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> {today.skipped} Skipped
                </span>
              )}
            </div>
          </div>
          <Link to="/track" className="btn-ghost shrink-0 hidden sm:flex" id="dashboard-track-link">
            Track <ChevronRight size={16} />
          </Link>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Best Streak" value={`${dashboard?.currentBestStreak ?? 0} days`} color="#f97316" />
        <StatCard icon={Trophy} label="Longest Ever" value={`${dashboard?.longestEverStreak ?? 0} days`} color="#f59e0b" />
        <StatCard icon={TrendingUp} label="This Week" value={`${dashboard?.weekCompletionRate ?? 0}%`} sub="completion rate" color="#6366f1" />
        <StatCard icon={Clock} label="Time This Week" value={formatTime(dashboard?.totalTimeThisWeek ?? 0)} sub="in duration habits" color="#10b981" />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending habits */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-900 dark:text-surface-50">Pending Today</h3>
            <Link to="/track" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">See all</Link>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-semibold text-surface-900 dark:text-surface-100">All done for today!</p>
              <p className="text-sm text-surface-400 mt-1">Amazing consistency!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 4).map(({ habit }: DayHabitEntry) => (
                <Link
                  key={habit._id}
                  to="/track"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${habit.color}20` }}
                  >
                    {habit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 dark:text-surface-100 truncate">{habit.name}</p>
                    <p className="text-xs text-surface-400">{habit.target} {habit.unit}</p>
                  </div>
                  <ChevronRight size={14} className="text-surface-400 shrink-0" />
                </Link>
              ))}
              {pending.length > 4 && (
                <Link to="/track" className="block text-center text-sm text-primary-600 dark:text-primary-400 py-2">
                  +{pending.length - 4} more →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} className="text-amber-500" />
            <h3 className="font-bold text-surface-900 dark:text-surface-50">Smart Insights</h3>
          </div>
          {!insights || insights.length === 0 ? (
            <div className="text-center py-8 text-surface-400">
              <p className="text-sm">Keep tracking to see insights!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10"
                >
                  <span className="text-lg shrink-0">✨</span>
                  <p className="text-sm text-surface-700 dark:text-surface-300">{insight}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Habits at risk */}
      {dashboard?.habitsAtRisk && dashboard.habitsAtRisk.length > 0 && (
        <div className="card p-5 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">Habits Need Attention</h3>
          </div>
          <p className="text-sm text-surface-500">
            {dashboard.habitsAtRisk.length} habit{dashboard.habitsAtRisk.length > 1 ? 's have' : ' has'} a low completion rate this month.{' '}
            <Link to="/analytics" className="text-primary-600 dark:text-primary-400 hover:underline">View analytics →</Link>
          </p>
        </div>
      )}

      {/* Financial Overview Widget */}
      <FinancialSummaryWidget />
    </div>
  );
}
