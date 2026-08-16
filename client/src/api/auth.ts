import api from './axios';
import type { AuthResponse, LoginForm, RegisterForm, User } from '../types';

export const authApi = {
  register: (data: RegisterForm) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginForm) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  getMe: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),

  updateMe: (data: Partial<User>) =>
    api.patch<{ user: User }>('/auth/me', data).then((r) => r.data.user),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }).then((r) => r.data),

  deleteAccount: () => api.delete('/auth/account').then((r) => r.data),
};
