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

  logout: (refreshToken: string) =>
    api.post<ApiResponse<null>>('/gateway/auth/logout', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ email: string }>>('/gateway/auth/forgot-password', { email }),

  resetPassword: (data: {
    email: string; resetCode: string; newPassword: string; confirmNewPassword: string;
  }) => api.post<ApiResponse<null>>('/gateway/auth/reset-password', data),

  verifyEmail: (email: string, code: string) =>
    api.post<ApiResponse<null>>('/gateway/auth/verify-email', { email, code }),

  resendVerification: (email: string) =>
    api.post<ApiResponse<{ requiresEmailVerification: boolean }>>('/gateway/auth/resend-verification', { email }),
};
