import api from './axios';
import type {
  ApiResponse,
  CreateSemesterRequest,
  Semester,
  UpdateSemesterRequest,
} from '../types';

export const semesterApi = {
  getAll: () =>
    api.get<ApiResponse<Semester[]>>('/gateway/kpi/semesters'),

  getById: (id: string) =>
    api.get<ApiResponse<Semester>>(`/gateway/kpi/semesters/${id}`),

  create: (data: CreateSemesterRequest) =>
    api.post<ApiResponse<Semester>>('/gateway/kpi/semesters', data),

  update: (id: string, data: UpdateSemesterRequest) =>
    api.put<ApiResponse<Semester>>(`/gateway/kpi/semesters/${id}`, data),

  activate: (id: string) =>
    api.post<ApiResponse<Semester>>(`/gateway/kpi/semesters/${id}/activate`),

  close: (id: string) =>
    api.post<ApiResponse<Semester>>(`/gateway/kpi/semesters/${id}/close`),
};
