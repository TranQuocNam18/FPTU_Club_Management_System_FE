import api from './axios';
import type {
  ApiResponse,
  ActivityReport,
  GeneratedReportDraft,
  GenerateSmartReportRequest,
  ReportGenerationSnapshot,
  ReportValidationResult,
  ReviewReportRequest,
  SubmitReportRequest,
  UpdateReportRequest,
  ValidateSmartReportRequest,
} from '../types';

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

  getSmartReportPreview: (clubId: string, semesterId: string) =>
    api.get<ApiResponse<ReportGenerationSnapshot>>(
      '/gateway/reports/smart-assistant/preview',
      { params: { clubId, semesterId } },
    ),

  generateSmartReportDraft: (data: GenerateSmartReportRequest) =>
    api.post<ApiResponse<GeneratedReportDraft>>(
      '/gateway/reports/smart-assistant/generate',
      data,
    ),

  validateSmartReport: (data: ValidateSmartReportRequest) =>
    api.post<ApiResponse<ReportValidationResult>>(
      '/gateway/reports/smart-assistant/validate',
      data,
    ),
};
