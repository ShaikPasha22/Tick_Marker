import api from './axios';
import type { Habit } from '../types';

export interface CreateHabitDto {
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  priority: string;
  type: string;
  target: number;
  unit: string;
  schedule: Habit['schedule'];
  reminder?: Habit['reminder'];
  startDate?: string;
  endDate?: string;
}

export const habitsApi = {
  getAll: (params?: { status?: string; category?: string }) =>
    api.get<{ habits: Habit[] }>('/habits', { params }).then((r) => r.data.habits),

  getOne: (id: string) =>
    api.get<{ habit: Habit }>(`/habits/${id}`).then((r) => r.data.habit),

  create: (data: CreateHabitDto) =>
    api.post<{ habit: Habit }>('/habits', data).then((r) => r.data.habit),

  update: (id: string, data: Partial<CreateHabitDto & { status: string; order: number }>) =>
    api.patch<{ habit: Habit }>(`/habits/${id}`, data).then((r) => r.data.habit),

  delete: (id: string, permanent = false) =>
    api.delete(`/habits/${id}`, { params: { permanent } }).then((r) => r.data),

  pause: (id: string, from: string, to: string, reason?: string) =>
    api.post<{ habit: Habit }>(`/habits/${id}/pause`, { from, to, reason }).then((r) => r.data.habit),

  resume: (id: string) =>
    api.post<{ habit: Habit }>(`/habits/${id}/resume`).then((r) => r.data.habit),

  reorder: (order: { id: string; order: number }[]) =>
    api.patch('/habits/reorder', { order }).then((r) => r.data),
};
