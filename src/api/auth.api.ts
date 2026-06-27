import api from './axios';
import type { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, User } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/gateway/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<ApiResponse<User>>('/gateway/auth/register', data),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<LoginResponse>>('/gateway/auth/refresh-token', { refreshToken }),

  me: () =>
    api.get<ApiResponse<User>>('/gateway/auth/me'),
};
