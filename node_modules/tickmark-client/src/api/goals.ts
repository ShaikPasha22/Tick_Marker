import api from './axios';
import type { Goal } from '../types';

export const goalsApi = {
  getAll: () => api.get<{ goals: Goal[] }>('/goals').then((r) => r.data.goals),

  create: (data: Omit<Goal, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    api.post<{ goal: Goal }>('/goals', data).then((r) => r.data.goal),

  update: (id: string, data: Partial<Goal>) =>
    api.patch<{ goal: Goal }>(`/goals/${id}`, data).then((r) => r.data.goal),

  delete: (id: string) => api.delete(`/goals/${id}`).then((r) => r.data),
};
