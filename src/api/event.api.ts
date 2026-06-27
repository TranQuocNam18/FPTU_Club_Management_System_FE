import api from './axios';
import type { ApiResponse, ClubEvent, CreateEventRequest } from '../types';

export const eventApi = {
  getByClub: (clubId: string) =>
    api.get<ApiResponse<ClubEvent[]>>(`/gateway/events/club/${clubId}`),

  create: (data: CreateEventRequest) =>
    api.post<ApiResponse<ClubEvent>>('/gateway/events', data),

  update: (id: string, data: Partial<CreateEventRequest>) =>
    api.put<ApiResponse<ClubEvent>>(`/gateway/events/${id}`, data),

  cancel: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/events/${id}/cancel`),

  deletePermanent: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/events/${id}/permanent`),
};
