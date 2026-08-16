import api from './axios';
import type { DashboardData, HabitAnalytics, HeatmapDay, WeeklyReview, StreakResult } from '../types';

export const analyticsApi = {
  getDashboard: () =>
    api.get<DashboardData>('/analytics/dashboard').then((r) => r.data),

  getHabitAnalytics: (params?: { from?: string; to?: string; habitId?: string }) =>
    api
      .get<{ analytics: HabitAnalytics[] }>('/analytics/habits', { params })
      .then((r) => r.data.analytics),

  getStreak: (habitId: string) =>
    api
      .get<{ streak: StreakResult }>(`/analytics/streaks/${habitId}`)
      .then((r) => r.data.streak),

  getHeatmap: (year: number, habitId?: string) =>
    api
      .get<{ year: number; heatmap: HeatmapDay[] }>('/analytics/heatmap', {
        params: { year, habitId },
      })
      .then((r) => r.data),

  getInsights: () =>
    api.get<{ insights: string[] }>('/analytics/insights').then((r) => r.data.insights),

  getWeeklyReview: () =>
    api.get<WeeklyReview>('/analytics/weekly-review').then((r) => r.data),
};
