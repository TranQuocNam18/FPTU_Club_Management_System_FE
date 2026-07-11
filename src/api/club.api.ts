import api from './axios';
import type { ApiResponse, Club, ClubMember, CreateClubRequest, UpdateClubRequest } from '../types';
import { mockApi, USE_MOCK_DATA } from './mockData';

export const clubApi = {
  getAll: () =>
    USE_MOCK_DATA ? mockApi.clubs.getAll() :
    api.get<ApiResponse<Club[]>>('/gateway/clubs'),

  getById: (id: string) =>
    USE_MOCK_DATA ? mockApi.clubs.getById(id) :
    api.get<ApiResponse<Club>>(`/gateway/clubs/${id}`),

  create: (data: CreateClubRequest) =>
    USE_MOCK_DATA ? mockApi.clubs.create(data as any) :
    api.post<ApiResponse<Club>>('/gateway/clubs', {
      Name: data.name,
      Description: data.description,
      LogoUrl: data.logoUrl ?? null,
      AdvisorId: data.advisorId,
    }),

  update: (id: string, data: UpdateClubRequest) =>
    USE_MOCK_DATA ? mockApi.clubs.update(id, data as any) :
    api.put<ApiResponse<Club>>(`/gateway/clubs/${id}`, {
      Name: data.name,
      Description: data.description,
      LogoUrl: data.logoUrl ?? null,
    }),

  delete: (id: string) =>
    USE_MOCK_DATA ? mockApi.clubs.delete(id) :
    api.delete<ApiResponse<null>>(`/gateway/clubs/${id}`),

  review: (id: string, status: number) =>
    USE_MOCK_DATA ? mockApi.clubs.review(id, status) :
    api.put<ApiResponse<Club>>(`/gateway/clubs/${id}/review`, { Status: status }),

  getMembers: (clubId: string) =>
    USE_MOCK_DATA ? mockApi.clubs.getMembers(clubId) :
    api.get<ApiResponse<ClubMember[]>>(`/gateway/clubs/${clubId}/members`),

  joinClub: (clubId: string) =>
    USE_MOCK_DATA ? mockApi.clubs.joinClub(clubId) :
    api.post<ApiResponse<ClubMember>>(`/gateway/clubs/${clubId}/members`),

  updateMemberRole: (clubId: string, userId: string, newRole: number, newStatus: number) =>
    USE_MOCK_DATA ? mockApi.clubs.updateMemberRole(clubId, userId, newRole, newStatus) :
    api.put<ApiResponse<ClubMember>>(`/gateway/clubs/${clubId}/members/${userId}/role`, { newRole, newStatus }),

  approveMember: (clubId: string, userId: string) =>
    USE_MOCK_DATA ? mockApi.clubs.updateMemberRole(clubId, userId, 0, 1) :
    api.put<ApiResponse<object>>(`/gateway/clubs/${clubId}/members/${userId}/approve`),

  rejectMember: (clubId: string, userId: string) =>
    USE_MOCK_DATA ? mockApi.clubs.updateMemberRole(clubId, userId, 0, 2) :
    api.put<ApiResponse<object>>(`/gateway/clubs/${clubId}/members/${userId}/reject`),

  removeMember: (clubId: string, userId: string) =>
    USE_MOCK_DATA ? mockApi.clubs.removeMember(clubId, userId) :
    api.delete<ApiResponse<null>>(`/gateway/clubs/${clubId}/members/${userId}`),
};
