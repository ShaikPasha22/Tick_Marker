import api from './axios';
import type { Trip, TripParticipant, TripCategory, TripExpense, TripAnalyticsSummary } from '../types';

export const tripApi = {
  // Trip CRUD
  createTrip: async (data: Partial<Trip>): Promise<{ trip: Trip }> => {
    const res = await api.post('/trips', data);
    return res.data.data;
  },
  listTrips: async (status?: string): Promise<{ trips: Trip[] }> => {
    const res = await api.get('/trips', { params: { status } });
    return res.data.data;
  },
  getTrip: async (tripId: string): Promise<{ trip: Trip }> => {
    const res = await api.get(`/trips/${tripId}`);
    return res.data.data;
  },
  updateTrip: async ({ tripId, data }: { tripId: string; data: Partial<Trip> }): Promise<{ trip: Trip }> => {
    const res = await api.patch(`/trips/${tripId}`, data);
    return res.data.data;
  },
  deleteTrip: async (tripId: string): Promise<void> => {
    await api.delete(`/trips/${tripId}`);
  },

  // Analytics
  getDashboard: async (tripId: string): Promise<TripAnalyticsSummary> => {
    const res = await api.get(`/trips/${tripId}/dashboard`);
    return res.data.data;
  },

  // Participants
  addParticipant: async ({ tripId, name, avatar }: { tripId: string; name: string; avatar?: string }): Promise<{ participant: TripParticipant }> => {
    const res = await api.post(`/trips/${tripId}/participants`, { name, avatar });
    return res.data.data;
  },
  listParticipants: async (tripId: string): Promise<{ participants: TripParticipant[] }> => {
    const res = await api.get(`/trips/${tripId}/participants`);
    return res.data.data;
  },

  // Categories
  addCategory: async ({ tripId, data }: { tripId: string; data: Partial<TripCategory> }): Promise<{ category: TripCategory }> => {
    const res = await api.post(`/trips/${tripId}/categories`, data);
    return res.data.data;
  },
  listCategories: async (tripId: string): Promise<{ categories: TripCategory[] }> => {
    const res = await api.get(`/trips/${tripId}/categories`);
    return res.data.data;
  },

  // Expenses
  createExpense: async ({ tripId, data }: { tripId: string; data: Partial<TripExpense> }): Promise<{ expense: TripExpense }> => {
    const res = await api.post(`/trips/${tripId}/expenses`, data);
    return res.data.data;
  },
  listExpenses: async ({ tripId, filters }: { tripId: string; filters?: any }): Promise<{ expenses: TripExpense[] }> => {
    const res = await api.get(`/trips/${tripId}/expenses`, { params: filters });
    return res.data.data;
  },
  updateExpense: async ({ tripId, expenseId, data }: { tripId: string; expenseId: string; data: Partial<TripExpense> }): Promise<{ expense: TripExpense }> => {
    const res = await api.patch(`/trips/${tripId}/expenses/${expenseId}`, data);
    return res.data.data;
  },
  deleteExpense: async ({ tripId, expenseId }: { tripId: string; expenseId: string }): Promise<void> => {
    await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
  },
};
