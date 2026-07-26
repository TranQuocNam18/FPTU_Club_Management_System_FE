import api from './axios';
import type { ApiResponse, Notification } from '../types';

export const notificationApi = {
  getMyNotifications: () =>
    api.get<ApiResponse<Notification[]>>('/gateway/notifications'),

  markAsRead: (id: string) =>
    api.put<{ success: boolean; message: string }>(`/gateway/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<{ success: boolean; message: string }>('/gateway/notifications/read-all'),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/notifications/${id}`),

  broadcast: (data: { title: string; message: string; targetRole: string }) =>
    api.post<ApiResponse<{ sourceEventId: string; recipientCount: number }>>('/gateway/notifications/broadcast', data),
};
