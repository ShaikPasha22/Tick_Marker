import api from './axios';
import type { SwotAnalysis, SwotItem } from '../types';

const API_URL = '/swot';

export const swotApi = {
  getAll: async (): Promise<SwotAnalysis[]> => {
    const res = await api.get(API_URL);
    return res.data;
  },

  get: async (id: string): Promise<SwotAnalysis> => {
    const res = await api.get(`${API_URL}/${id}`);
    return res.data;
  },

  create: async (data: Partial<SwotAnalysis>): Promise<SwotAnalysis> => {
    const res = await api.post(API_URL, data);
    return res.data;
  },

  update: async (id: string, data: Partial<SwotAnalysis>): Promise<SwotAnalysis> => {
    const res = await api.patch(`${API_URL}/${id}`, data);
    return res.data;
  },

  delete: async (id: string, confirmDelete?: boolean): Promise<void> => {
    await api.delete(`${API_URL}/${id}`, {
      params: { confirmDelete }
    });
  },

  duplicate: async (id: string): Promise<SwotAnalysis> => {
    const res = await api.post(`${API_URL}/${id}/duplicate`);
    return res.data;
  },

  getItems: async (id: string): Promise<SwotItem[]> => {
    const res = await api.get(`${API_URL}/${id}/items`);
    return res.data;
  },

  createItem: async (id: string, data: Partial<SwotItem>): Promise<SwotItem> => {
    const res = await api.post(`${API_URL}/${id}/items`, data);
    return res.data;
  },

  updateItem: async (id: string, itemId: string, data: Partial<SwotItem>): Promise<SwotItem> => {
    const res = await api.patch(`${API_URL}/${id}/items/${itemId}`, data);
    return res.data;
  },

  deleteItem: async (id: string, itemId: string, confirmDelete?: boolean): Promise<void> => {
    await api.delete(`${API_URL}/${id}/items/${itemId}`, {
      params: { confirmDelete }
    });
  }
};
