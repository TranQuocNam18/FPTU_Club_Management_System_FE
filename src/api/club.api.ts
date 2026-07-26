import api from './axios';
import type { ApiResponse, Club, ClubApplication, ClubApplicationRequest, ClubMember, CreateClubRequest, UpdateClubRequest } from '../types';

export const clubApi = {
  getAll: () =>
    api.get<ApiResponse<Club[]>>('/gateway/clubs'),

  getById: (id: string) =>
    api.get<ApiResponse<Club>>(`/gateway/clubs/${id}`),

  // Only StudentAffairsAdmin; actor identity comes from JWT.
  create: (data: CreateClubRequest) =>
    api.post<ApiResponse<Club>>('/gateway/clubs', {
      Name: data.name,
      Description: data.description,
      LogoUrl: data.logoUrl ?? null,
    }),

  // StudentAffairsAdmin or a ClubManager with canonical club authority
  update: (id: string, data: UpdateClubRequest) =>
    api.put<ApiResponse<Club>>(`/gateway/clubs/${id}`, {
      Name: data.name,
      Description: data.description,
      LogoUrl: data.logoUrl ?? null,
    }),

  // Only StudentAffairsAdmin (soft delete)
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/clubs/${id}`),

  // Only StudentAffairsAdmin - status: 0=PendingApproval,1=Active,2=Suspended,3=Inactive
  review: (id: string, status: number) =>
    api.put<ApiResponse<Club>>(`/gateway/clubs/${id}/review`, { Status: status }),

  // Public
  getMembers: (clubId: string) =>
    api.get<ApiResponse<ClubMember[]>>(`/gateway/clubs/${clubId}/members`),

  getMyMemberships: () =>
    api.get<ApiResponse<ClubMember[]>>('/gateway/clubs/my-memberships'),

  // Only Student
  joinClub: (clubId: string) =>
    api.post<ApiResponse<ClubMember>>(`/gateway/clubs/${clubId}/members`),

  approveMember: (clubId: string, userId: string) =>
    api.put<ApiResponse<ClubMember>>(`/gateway/clubs/${clubId}/members/${userId}/approve`),

  rejectMember: (clubId: string, userId: string) =>
    api.put<ApiResponse<null>>(`/gateway/clubs/${clubId}/members/${userId}/reject`),

  // StudentAffairsAdmin or a ClubManager with canonical club authority
  updateMemberRole: (clubId: string, userId: string, newRole: number, newStatus: number) =>
    api.put<ApiResponse<ClubMember>>(`/gateway/clubs/${clubId}/members/${userId}/role`, { newRole, newStatus }),

  // StudentAffairsAdmin or a ClubManager with canonical club authority
  removeMember: (clubId: string, userId: string) =>
    api.delete<ApiResponse<null>>(`/gateway/clubs/${clubId}/members/${userId}`),
};

export const clubApplicationApi = {
  create: (data: ClubApplicationRequest) =>
    api.post<ApiResponse<ClubApplication>>('/gateway/club-applications', data),
  mine: () =>
    api.get<ApiResponse<ClubApplication[]>>('/gateway/club-applications/mine'),
  all: () =>
    api.get<ApiResponse<ClubApplication[]>>('/gateway/club-applications'),
  update: (id: string, data: ClubApplicationRequest) =>
    api.put<ApiResponse<ClubApplication>>(`/gateway/club-applications/${id}`, data),
  approve: (id: string) =>
    api.post<ApiResponse<ClubApplication>>(`/gateway/club-applications/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post<ApiResponse<ClubApplication>>(`/gateway/club-applications/${id}/reject`, { reason }),
};
