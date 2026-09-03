import api from './axios';
import type { Task } from '../types';

const API_URL = '/tasks';

export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const res = await api.get(API_URL);
    return res.data;
  },

  create: async (data: Partial<Task>): Promise<Task> => {
    const res = await api.post(API_URL, data);
    return res.data;
  },

  update: async (id: string, data: Partial<Task>): Promise<Task> => {
    const res = await api.patch(`${API_URL}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  },

  link: async (taskId: string, swotId: string, swotItemId: string): Promise<any> => {
    const res = await api.post(`${API_URL}/link`, { taskId, swotId, swotItemId });
    return res.data;
  }
};
