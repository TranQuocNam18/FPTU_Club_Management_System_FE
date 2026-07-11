import api from './axios';
import type { ApiResponse, Club, ClubMember, CreateClubRequest, UpdateClubRequest } from '../types';

export const clubApi = {
  getAll: () =>
    api.get<ApiResponse<Club[]>>('/gateway/clubs'),

  getById: (id: string) =>
    api.get<ApiResponse<Club>>(`/gateway/clubs/${id}`),

  // Only Admin/Advisor - requires advisorId
  create: (data: CreateClubRequest) =>
    api.post<ApiResponse<Club>>('/gateway/clubs', {
      Name: data.name,
      Description: data.description,
      LogoUrl: data.logoUrl ?? null,
      AdvisorId: data.advisorId,
    }),

  // Only Admin/ClubManager
  update: (id: string, data: UpdateClubRequest) =>
    api.put<ApiResponse<Club>>(`/gateway/clubs/${id}`, {
      Name: data.name,
      Description: data.description,
      LogoUrl: data.logoUrl ?? null,
    }),

  // Only Admin/Advisor (soft delete)
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/clubs/${id}`),

  // Only Admin/Advisor - status: 0=PendingApproval,1=Active,2=Suspended,3=Inactive
  review: (id: string, status: number) =>
    api.put<ApiResponse<Club>>(`/gateway/clubs/${id}/review`, { Status: status }),

  // Public
  getMembers: (clubId: string) =>
    api.get<ApiResponse<ClubMember[]>>(`/gateway/clubs/${clubId}/members`),

  // Only Student
  joinClub: (clubId: string) =>
    api.post<ApiResponse<ClubMember>>(`/gateway/clubs/${clubId}/members`),

  // Only Admin/ClubManager
  updateMemberRole: (clubId: string, userId: string, newRole: number, newStatus: number) =>
    api.put<ApiResponse<ClubMember>>(`/gateway/clubs/${clubId}/members/${userId}/role`, { newRole, newStatus }),

  // Only Admin/ClubManager
  removeMember: (clubId: string, userId: string) =>
    api.delete<ApiResponse<null>>(`/gateway/clubs/${clubId}/members/${userId}`),
};
