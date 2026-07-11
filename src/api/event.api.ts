import api from './axios';
import type { ApiResponse, ClubEvent, CreateEventRequest } from '../types';

// Helper: normalize event from BE (ExpectedDate → expectedDate, add display alias)
const normalizeEvent = (e: any): any => ({
  ...e,
  expectedDate: e.expectedDate ?? e.ExpectedDate ?? e.startTime ?? new Date().toISOString(),
});

export const eventApi = {
  getByClub: (clubId: string) =>
    api.get<ApiResponse<any[]>>(`/gateway/events/club/${clubId}`).then(res => {
      if (res.data?.data) {
        res.data.data = res.data.data.map(normalizeEvent);
      }
      return res as any;
    }),

  create: (data: CreateEventRequest) => {
    const payload = {
      ClubId: data.clubId,
      Title: data.title,
      Description: data.description || 'Không có mô tả',
      ExpectedDate: data.expectedDate,
      Location: data.location,
    };
    return api.post<ApiResponse<any>>('/gateway/events', payload).then(res => {
      if (res.data?.data) res.data.data = normalizeEvent(res.data.data);
      return res as any;
    });
  },

  update: (id: string, data: Partial<CreateEventRequest>) => {
    const payload = {
      Title: data.title,
      Description: data.description || 'Không có mô tả',
      ExpectedDate: data.expectedDate,
      Location: data.location,
    };
    return api.put<ApiResponse<any>>(`/gateway/events/${id}`, payload).then(res => {
      if (res.data?.data) res.data.data = normalizeEvent(res.data.data);
      return res as any;
    });
  },

  cancel: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/events/${id}/cancel`),

  deletePermanent: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/events/${id}/permanent`),
};
