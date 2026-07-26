import api from './axios';
import type { ApiResponse, ActivityReport, SubmitReportRequest, ReviewReportRequest, UpdateReportRequest } from '../types';

export const reportApi = {
  create: (data: SubmitReportRequest) =>
    api.post<ApiResponse<ActivityReport>>('/gateway/reports', data),

  submit: (id: string) =>
    api.post<ApiResponse<ActivityReport>>(`/gateway/reports/${id}/submit`),

  update: (id: string, data: UpdateReportRequest) =>
    api.put<ApiResponse<ActivityReport>>(`/gateway/reports/${id}`, data),

  review: (id: string, data: ReviewReportRequest) =>
    api.put<ApiResponse<ActivityReport>>(`/gateway/reports/${id}/review`, data),

  getByClub: (clubId: string, status?: number, type?: number) => {
    let query = '';
    if (status !== undefined) query += `status=${status}`;
    if (type !== undefined) query += `${query ? '&' : ''}type=${type}`;
    return api.get<ApiResponse<ActivityReport[]>>(`/gateway/reports/club/${clubId}${query ? `?${query}` : ''}`);
  },

  getById: (id: string) =>
    api.get<ApiResponse<ActivityReport>>(`/gateway/reports/${id}`),

  history: (id: string) =>
    api.get<ApiResponse<Array<{
      id: string; reportId: string; revisionNumber: number; previousStatus: string;
      newStatus: string; feedback?: string; changedBy: string; changedAt: string;
    }>>>(`/gateway/reports/${id}/history`),
};
