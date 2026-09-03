import api from './axios';
import type { Goal, Habit } from '../types';

export const goalsApi = {
  getAll: () => api.get<{ goals: Goal[] }>('/goals').then((r) => r.data.goals),

  create: (data: Omit<Goal, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    api.post<{ goal: Goal }>('/goals', data).then((r) => r.data.goal),

  update: (id: string, data: Partial<Goal>) =>
    api.patch<{ goal: Goal }>(`/goals/${id}`, data).then((r) => r.data.goal),

  delete: (id: string) => api.delete(`/goals/${id}`).then((r) => r.data),

  createTracker: (goalId: string, data: any) =>
    api.post<{ habit: Habit; goal: Goal }>(`/goals/${goalId}/trackers`, data).then((r) => r.data),

  linkExistingTracker: (goalId: string, habitId: string) =>
    api.post<{ habit: Habit; goal: Goal }>(`/goals/${goalId}/trackers/link`, { habitId }).then((r) => r.data),

  unlinkTracker: (goalId: string, habitId: string) =>
    api.delete<{ goal: Goal }>(`/goals/${goalId}/trackers/${habitId}`).then((r) => r.data.goal),

  toggleDashboard: (goalId: string, habitId: string, showOnDashboard: boolean) =>
    api.patch<{ habit: Habit }>(`/goals/${goalId}/trackers/${habitId}/dashboard`, { showOnDashboard }).then((r) => r.data.habit),
};
