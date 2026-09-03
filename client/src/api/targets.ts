import api from './axios';
import type { Target } from '../types';

const API_URL = '/targets';

export const targetsApi = {
  getAll: async (params?: {
    isDumpItem?: boolean;
    assignedType?: 'none' | 'weekly' | 'monthly' | 'yearly';
    weekStart?: string;
    month?: string;
    year?: number;
  }): Promise<Target[]> => {
    const res = await api.get(API_URL, { params });
    return res.data;
  },

  create: async (data: Partial<Target>): Promise<Target> => {
    const res = await api.post(API_URL, data);
    return res.data;
  },

  update: async (id: string, data: Partial<Target>): Promise<Target> => {
    const res = await api.patch(`${API_URL}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${API_URL}/${id}`);
  }
};
