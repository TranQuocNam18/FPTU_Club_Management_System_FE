import api from './axios';
import type { ApiResponse, Notification } from '../types';
import { mockApi, USE_MOCK_DATA } from './mockData';

export const notificationApi = {
  getMyNotifications: () =>
    USE_MOCK_DATA ? mockApi.notifications.getMyNotifications() :
    api.get<{ success: boolean; data: Notification[] }>('/gateway/notifications'),

  markAsRead: (id: string) =>
    USE_MOCK_DATA ? mockApi.notifications.markAsRead(id) :
    api.put<{ success: boolean; message: string }>(`/gateway/notifications/${id}/read`),

  markAllAsRead: () =>
    USE_MOCK_DATA ? mockApi.notifications.markAllAsRead() :
    api.put<{ success: boolean; message: string }>('/gateway/notifications/read-all'),

  broadcast: (data: { title: string; message: string; targetRole?: string }) =>
    USE_MOCK_DATA ? mockApi.notifications.broadcast(data) :
    api.post<ApiResponse<object>>('/gateway/notifications/broadcast', data),
};
