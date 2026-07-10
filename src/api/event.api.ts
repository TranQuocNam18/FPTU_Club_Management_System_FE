import api from './axios';
import type { ApiResponse, ClubEvent, CreateEventRequest } from '../types';

export const eventApi = {
  getByClub: (clubId: string) =>
    api.get<ApiResponse<any[]>>(`/gateway/events/club/${clubId}`).then(res => {
      if (res.data && res.data.data) {
        res.data.data = res.data.data.map((e: any) => ({
          ...e,
          startTime: e.expectedDate || e.ExpectedDate || new Date().toISOString(),
          endTime: e.expectedDate || e.ExpectedDate || new Date().toISOString(),
        }));
      }
      return res as any;
    }),

  create: (data: CreateEventRequest) => {
    const payload = {
      ClubId: data.clubId,
      Title: data.title,
      Description: data.description || "Không có mô tả",
      ExpectedDate: data.startTime || new Date().toISOString(),
      Location: data.location
    };
    return api.post<ApiResponse<any>>('/gateway/events', payload).then(res => {
      if (res.data && res.data.data) {
        const e = res.data.data;
        res.data.data = {
          ...e,
          startTime: e.expectedDate || e.ExpectedDate || payload.ExpectedDate,
          endTime: e.expectedDate || e.ExpectedDate || payload.ExpectedDate,
        };
      }
      return res as any;
    });
  },

  update: (id: string, data: Partial<CreateEventRequest>) => {
    const payload = {
      Title: data.title,
      Description: data.description || "Không có mô tả",
      ExpectedDate: data.startTime,
      Location: data.location
    };
    return api.put<ApiResponse<any>>(`/gateway/events/${id}`, payload).then(res => {
      if (res.data && res.data.data) {
        const e = res.data.data;
        res.data.data = {
          ...e,
          startTime: e.expectedDate || e.ExpectedDate || payload.ExpectedDate,
          endTime: e.expectedDate || e.ExpectedDate || payload.ExpectedDate,
        };
      }
      return res as any;
    });
  },

  cancel: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/events/${id}/cancel`),

  deletePermanent: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/events/${id}/permanent`),
};
