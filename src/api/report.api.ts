import api from './axios';
import type { ApiResponse, ActivityReport, SubmitReportRequest, ReviewReportRequest } from '../types';

export const reportApi = {
  create: (data: { clubId: string; title: string; content: string; type: number; attachments?: any[] }) =>
    api.post<ApiResponse<any>>('/gateway/reports', data),

  update: (id: string, data: { title: string; content: string; type: number }) =>
    api.put<ApiResponse<any>>(`/gateway/reports/${id}`, data),

  review: (id: string, data: { isApproved: boolean; reviewNote?: string }) =>
    api.put<ApiResponse<any>>(`/gateway/reports/${id}/review`, data),

  getByClub: (clubId: string, status?: number, type?: number) => {
    let query = '';
    if (status !== undefined) query += `status=${status}`;
    if (type !== undefined) query += `${query ? '&' : ''}type=${type}`;
    return api.get<ApiResponse<any[]>>(`/gateway/reports/club/${clubId}${query ? `?${query}` : ''}`);
  },

  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/gateway/reports/${id}`),
};
