import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
let refreshPromise: Promise<string> | null = null;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthPath = originalRequest?.url?.includes('/gateway/auth/login') || originalRequest?.url?.includes('/gateway/auth/register');
    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthPath) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('Refresh token is unavailable.');

        refreshPromise ??= axios
          .post(`${BASE_URL}/gateway/auth/refresh-token`, { refreshToken })
          .then((res) => {
            const token = res.data.data.accessToken as string;
            const rotatedRefreshToken = res.data.data.refreshToken as string;
            useAuthStore.getState().setTokens(token, rotatedRefreshToken);
            return token;
          })
          .finally(() => {
            refreshPromise = null;
          });

        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
