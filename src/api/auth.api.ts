import api from './axios';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  RegisterRequest,
  ResendVerificationEmailRequest,
  ResetPasswordRequest,
  User,
  VerifyEmailRequest
} from '../types';
import { mockApi, USE_MOCK_DATA } from './mockData';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/gateway/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<ApiResponse<User>>('/gateway/auth/register', data),

  verifyEmail: (data: VerifyEmailRequest) =>
    api.post<ApiResponse<object>>('/gateway/auth/verify-email', data),

  resendVerificationEmail: (data: ResendVerificationEmailRequest) =>
    api.post<ApiResponse<object>>('/gateway/auth/resend-verification-email', data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<ApiResponse<object>>('/gateway/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<ApiResponse<object>>('/gateway/auth/reset-password', data),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<LoginResponse>>('/gateway/auth/refresh-token', { refreshToken }),

  me: () =>
    api.get<ApiResponse<User>>('/gateway/auth/me'),
};

export const userApi = {
  getAll: (params?: { role?: string; isActive?: boolean; page?: number; pageSize?: number }) =>
    USE_MOCK_DATA ? mockApi.users.getAll(params) :
    api.get<{ data: User[]; total: number; page: number; pageSize: number }>('/gateway/users', { params }),

  updateRole: (id: string, role: string) =>
    USE_MOCK_DATA ? mockApi.users.updateRole(id, role as User['role']) :
    api.put<ApiResponse<object>>(`/gateway/users/${id}/role`, { role }),

  updateStatus: (id: string, isActive: boolean) =>
    USE_MOCK_DATA ? mockApi.users.updateStatus(id, isActive) :
    api.put<ApiResponse<object>>(`/gateway/users/${id}/status`, { isActive }),
};
