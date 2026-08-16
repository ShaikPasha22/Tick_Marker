import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Cell
} from 'recharts';
import { analyticsApi } from '../../api/analytics';
import type { HabitAnalytics } from '../../types';
import { Flame, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

const DATE_RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

function CompletionBar({ ha, max }: { ha: HabitAnalytics; max: number }) {
  const pct = max > 0 ? (ha.completionRate / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 text-lg shrink-0">{ha.icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-surface-800 dark:text-surface-200 truncate max-w-[140px]">{ha.name}</span>
          <span className="font-bold text-surface-900 dark:text-surface-100 shrink-0 ml-2">{ha.completionRate}%</span>
        </div>
        <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: ha.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 w-16 justify-end">
        <Flame size={13} className="text-orange-500" />
        <span className="text-xs font-semibold text-surface-600 dark:text-surface-400">{ha.currentStreak}d</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(30);

  const fromDate = format(subDays(new Date(), range), 'yyyy-MM-dd');
  const toDate = format(new Date(), 'yyyy-MM-dd');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', 'habits', fromDate],
    queryFn: () => analyticsApi.getHabitAnalytics({ from: fromDate, to: toDate }),
    staleTime: 1000 * 60 * 2,
  });

  const { data: weekly } = useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: analyticsApi.getWeeklyReview,
  });

  const { data: insights } = useQuery({
    queryKey: ['insights'],
    queryFn: analyticsApi.getInsights,
  });

  const sorted = [...(analytics ?? [])].sort((a, b) => b.completionRate - a.completionRate);
  const maxRate = sorted[0]?.completionRate ?? 100;

  const chartData = sorted.map((a) => ({
    name: a.name.length > 10 ? a.name.slice(0, 10) + '…' : a.name,
    rate: a.completionRate,
    streak: a.currentStreak,
    color: a.color,
  }));

  const radarData = sorted.map((a) => ({
    habit: a.name.length > 8 ? a.name.slice(0, 8) + '…' : a.name,
    completion: a.completionRate,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="card border border-surface-200 dark:border-surface-700 p-3 text-sm shadow-xl">
          <p className="font-semibold text-surface-900 dark:text-surface-100 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}{p.dataKey === 'rate' ? '%' : ' days'}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Range selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Analytics</h2>
          <p className="text-sm text-surface-400">Your habit performance overview</p>
        </div>
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 gap-1">
          {DATE_RANGES.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setRange(days)}
              id={`analytics-range-${days}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                range === days
                  ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-surface-100'
                  : 'text-surface-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly review cards */}
      {weekly && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'This Week', value: `${weekly.thisWeekRate}%`, icon: TrendingUp, color: '#6366f1' },
            { label: 'vs Last Week', value: `${weekly.improvement > 0 ? '+' : ''}${weekly.improvement}%`, icon: weekly.improvement >= 0 ? TrendingUp : TrendingDown, color: weekly.improvement >= 0 ? '#10b981' : '#ef4444' },
            { label: 'Best Streak', value: `${weekly.bestStreak} days`, icon: Flame, color: '#f97316' },
            { label: 'Time Invested', value: `${Math.floor(weekly.totalTimeMinutes / 60)}h ${weekly.totalTimeMinutes % 60}m`, icon: Trophy, color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="stat-card"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${color}20` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{value}</p>
              <p className="text-xs text-surface-400">{label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {analytics?.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-semibold text-surface-900 dark:text-surface-100">No data yet</p>
          <p className="text-sm text-surface-400 mt-1">Start tracking habits to see analytics here.</p>
        </div>
      ) : (
        <>
          {/* Completion rate bars */}
          <div className="card p-5">
            <h3 className="section-header">Completion Rate by Habit</h3>
            <div className="space-y-4">
              {sorted.map((ha) => (
                <CompletionBar key={ha.habitId} ha={ha} max={maxRate} />
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div className="card p-5">
            <h3 className="section-header">Completion Rate Chart</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" name="Completion %" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart */}
          {radarData.length >= 3 && (
            <div className="card p-5">
              <h3 className="section-header">Habit Performance Radar</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e4e4e7" />
                  <PolarAngleAxis dataKey="habit" tick={{ fontSize: 11, fill: '#71717a' }} />
                  <Radar name="Completion" dataKey="completion" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Streak analysis */}
          <div className="card p-5">
            <h3 className="section-header">Streak Analysis</h3>
            <div className="space-y-3">
              {sorted.map((ha) => (
                <div key={ha.habitId} className="flex items-center justify-between py-2 border-b border-surface-50 dark:border-surface-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{ha.icon}</span>
                    <span className="text-sm font-medium text-surface-800 dark:text-surface-200">{ha.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-orange-500">{ha.currentStreak}</p>
                      <p className="text-xs text-surface-400">Current</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-primary-600 dark:text-primary-400">{ha.longestStreak}</p>
                      <p className="text-xs text-surface-400">Longest</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-surface-600 dark:text-surface-400">{ha.totalCompleted}</p>
                      <p className="text-xs text-surface-400">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-red-400">{ha.totalMissed}</p>
                      <p className="text-xs text-surface-400">Missed</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          {insights && insights.length > 0 && (
            <div className="card p-5">
              <h3 className="section-header">💡 Smart Insights</h3>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                    <span>✨</span>
                    <p className="text-sm text-surface-700 dark:text-surface-300">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
