import api from './axios';
import type { ApiResponse, Notification } from '../types';
import { mockApi, USE_MOCK_DATA } from './mockData';

export interface GetNotificationsParams {
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

export const notificationApi = {
  getMyNotifications: (params?: GetNotificationsParams) =>
    USE_MOCK_DATA
      ? mockApi.notifications.getMyNotifications(params)
      : api.get<ApiResponse<Notification[]>>('/gateway/notifications', { params }),

  getUnreadCount: () =>
    USE_MOCK_DATA
      ? mockApi.notifications.getUnreadCount()
      : api.get<ApiResponse<{ unreadCount: number }>>('/gateway/notifications/unread-count'),

  markAsRead: (id: string) =>
    USE_MOCK_DATA
      ? mockApi.notifications.markAsRead(id)
      : api.put<ApiResponse<any>>(`/gateway/notifications/${id}/read`),

  markAllAsRead: () =>
    USE_MOCK_DATA
      ? mockApi.notifications.markAllAsRead()
      : api.put<ApiResponse<any>>('/gateway/notifications/read-all'),

  deleteNotification: (id: string) =>
    USE_MOCK_DATA
      ? mockApi.notifications.deleteNotification(id)
      : api.delete<ApiResponse<any>>(`/gateway/notifications/${id}`),

  broadcast: (data: { title: string; message: string; targetRole?: string }) =>
    USE_MOCK_DATA
      ? mockApi.notifications.broadcast(data)
      : api.post<ApiResponse<any>>('/gateway/notifications/broadcast', data),
};
