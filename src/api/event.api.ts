import api from './axios';
import type { ApiResponse, ClubEvent, CreateEventRequest } from '../types';
import { mockApi, USE_MOCK_DATA } from './mockData';

const normalizeEvent = (event: any): ClubEvent => ({
  ...event,
  expectedDate: event.expectedDate ?? event.ExpectedDate ?? event.startTime ?? new Date().toISOString(),
  startTime: event.startTime ?? event.expectedDate ?? event.ExpectedDate ?? new Date().toISOString(),
  endTime: event.endTime ?? event.startTime ?? event.expectedDate ?? event.ExpectedDate ?? new Date().toISOString(),
});

export const eventApi = {
  getByClub: (clubId: string) =>
    USE_MOCK_DATA ? mockApi.events.getByClub(clubId) :
    api.get<ApiResponse<ClubEvent[]>>(`/gateway/events/club/${clubId}`).then((res) => {
      if (res.data?.data) {
        res.data.data = res.data.data.map(normalizeEvent);
      }
      return res;
    }),

  create: (data: CreateEventRequest) =>
    USE_MOCK_DATA ? mockApi.events.create(data) :
    api.post<ApiResponse<ClubEvent>>('/gateway/events', {
      ClubId: data.clubId,
      Title: data.title,
      Description: data.description || 'No description',
      ExpectedDate: data.expectedDate,
      Location: data.location,
    }).then((res) => {
      if (res.data?.data) {
        res.data.data = normalizeEvent(res.data.data);
      }
      return res;
    }),

  update: (id: string, data: Partial<CreateEventRequest>) =>
    USE_MOCK_DATA ? mockApi.events.update(id, data as any) :
    api.put<ApiResponse<ClubEvent>>(`/gateway/events/${id}`, {
      Title: data.title,
      Description: data.description || 'No description',
      ExpectedDate: data.expectedDate,
      Location: data.location,
    }).then((res) => {
      if (res.data?.data) {
        res.data.data = normalizeEvent(res.data.data);
      }
      return res;
    }),

  cancel: (id: string) =>
    USE_MOCK_DATA ? mockApi.events.cancel(id) :
    api.delete<ApiResponse<null>>(`/gateway/events/${id}/cancel`),

  deletePermanent: (id: string) =>
    USE_MOCK_DATA ? mockApi.events.deletePermanent(id) :
    api.delete<ApiResponse<null>>(`/gateway/events/${id}/permanent`),
};
