import api from './axios';
import type { ApiResponse, ClubEvent, CreateEventRequest } from '../types';

type RawEvent = Omit<ClubEvent, 'expectedDate'> & {
  expectedDate?: string;
  ExpectedDate?: string;
};

function normalizeEvent(event: RawEvent): ClubEvent {
  return {
    ...event,
    expectedDate: event.expectedDate ?? event.ExpectedDate ?? '',
  };
}

function normalizeResponse(response: { data: ApiResponse<RawEvent> }) {
  return {
    ...response,
    data: { ...response.data, data: normalizeEvent(response.data.data) },
  };
}

export const eventApi = {
  getByClub: async (clubId: string) => {
    const response = await api.get<ApiResponse<RawEvent[]>>(`/gateway/events/club/${clubId}`);
    return {
      ...response,
      data: { ...response.data, data: response.data.data.map(normalizeEvent) },
    };
  },

  getById: async (id: string) => normalizeResponse(
    await api.get<ApiResponse<RawEvent>>(`/gateway/events/${id}`),
  ),

  create: async (data: CreateEventRequest) => normalizeResponse(
    await api.post<ApiResponse<RawEvent>>('/gateway/events', {
      ClubId: data.clubId,
      Title: data.title,
      Description: data.description,
      ExpectedDate: data.expectedDate,
      Location: data.location,
    }),
  ),

  update: async (id: string, data: Omit<CreateEventRequest, 'clubId'>) => normalizeResponse(
    await api.put<ApiResponse<RawEvent>>(`/gateway/events/${id}`, {
      Title: data.title,
      Description: data.description,
      ExpectedDate: data.expectedDate,
      Location: data.location,
    }),
  ),

  cancel: (id: string) => api.delete<ApiResponse<null>>(`/gateway/events/${id}/cancel`),
  submit: (id: string) => api.put<ApiResponse<ClubEvent>>(`/gateway/events/${id}/submit`),
  approve: (id: string) => api.put<ApiResponse<ClubEvent>>(`/gateway/events/${id}/approve`),
  reject: (id: string) => api.put<ApiResponse<ClubEvent>>(`/gateway/events/${id}/reject`),
  complete: (id: string) => api.put<ApiResponse<ClubEvent>>(`/gateway/events/${id}/complete`),
  deletePermanent: (id: string) => api.delete<ApiResponse<null>>(`/gateway/events/${id}/permanent`),
};
