import api from './axios';
import type { ApiResponse, Notification } from '../types';

export const notificationApi = {
  getMyNotifications: () =>
    api.get<{ success: boolean; data: Notification[] }>('/gateway/notifications'),

  markAsRead: (id: string) =>
    api.put<{ success: boolean; message: string }>(`/gateway/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<{ success: boolean; message: string }>('/gateway/notifications/read-all'),
};
