import api from './axios';
import type { HabitCompletion, CompletionStatus, DayViewResponse } from '../types';

export const completionsApi = {
  getDay: (date: string) =>
    api.get<DayViewResponse>('/completions/day', { params: { date } }).then((r) => r.data),

  getRange: (from: string, to: string, habitId?: string) =>
    api
      .get<{ completions: HabitCompletion[] }>('/completions', { params: { from, to, habitId } })
      .then((r) => r.data.completions),

  log: (habitId: string, date: string, status: CompletionStatus, value?: number, note?: string) =>
    api
      .post<{ completion: HabitCompletion }>('/completions', { habitId, date, status, value, note })
      .then((r) => r.data.completion),

  update: (id: string, data: { status?: CompletionStatus; value?: number; note?: string }) =>
    api
      .patch<{ completion: HabitCompletion }>(`/completions/${id}`, data)
      .then((r) => r.data.completion),

  delete: (id: string) => api.delete(`/completions/${id}`).then((r) => r.data),
};
