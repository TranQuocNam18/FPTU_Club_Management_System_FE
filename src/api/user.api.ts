import api from './axios';
import type { ApiResponse, User } from '../types';

export const userApi = {
  getAll: (params?: { role?: string; isActive?: boolean; search?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<User[]>>('/gateway/users', { params }),

  updateRole: (id: string, role: User['role']) =>
    api.put<ApiResponse<{ id: string; role: User['role'] }>>(`/gateway/users/${id}/role`, { role }),

  updateStatus: (id: string, isActive: boolean) =>
    api.put<ApiResponse<{ id: string; isActive: boolean }>>(`/gateway/users/${id}/status`, { isActive }),
};
