import api from './axios';
import type { ApiResponse, Club, ClubMember, CreateClubRequest, UpdateClubRequest } from '../types';

export const clubApi = {
  getAll: () =>
    api.get<ApiResponse<Club[]>>('/gateway/clubs'),

  getById: (id: string) =>
    api.get<ApiResponse<Club>>(`/gateway/clubs/${id}`),

  create: (data: CreateClubRequest) =>
    api.post<ApiResponse<Club>>('/gateway/clubs', data),

  update: (id: string, data: UpdateClubRequest) =>
    api.put<ApiResponse<Club>>(`/gateway/clubs/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/clubs/${id}`),

  review: (id: string, status: number) =>
    api.put<ApiResponse<Club>>(`/gateway/clubs/${id}/review`, { status }),

  getMembers: (clubId: string) =>
    api.get<ApiResponse<ClubMember[]>>(`/gateway/clubs/${clubId}/members`),

  joinClub: (clubId: string) =>
    api.post<ApiResponse<ClubMember>>(`/gateway/clubs/${clubId}/members`),

  updateMemberRole: (clubId: string, userId: string, newRole: number, newStatus: number) =>
    api.put<ApiResponse<ClubMember>>(`/gateway/clubs/${clubId}/members/${userId}/role`, { newRole, newStatus }),

  removeMember: (clubId: string, userId: string) =>
    api.delete<ApiResponse<null>>(`/gateway/clubs/${clubId}/members/${userId}`),
};
