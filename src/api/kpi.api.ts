import api from './axios';
import type { ApiResponse } from '../types';

export interface KpiLeaderboardEntry {
  rank: number;
  clubId: string;
  clubName: string;
  semesterId: string;
  totalPoints: number;
}

export interface ClubKpiScore {
  clubId: string;
  semesterId: string;
  totalPoints: number;
}

export interface KpiScoreHistory {
  id: string;
  clubId: string;
  semesterId: string;
  ruleId?: string | null;
  points: number;
  reason: string;
  sourceType: string;
  sourceId?: string | null;
  adjustedBy: string;
  createdAt: string;
}

export interface KpiRule {
  id: string;
  semesterId: string;
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
  isActive: boolean;
}

export const kpiApi = {
  getLeaderboard: (semesterId: string) =>
    api.get<ApiResponse<KpiLeaderboardEntry[]>>('/gateway/kpi/leaderboard', { params: { semesterId } }),
  getClubHistory: (clubId: string, semesterId: string) =>
    api.get<ApiResponse<KpiScoreHistory[]>>(`/gateway/kpi/clubs/${clubId}/history`, { params: { semesterId } }),
  getClubScore: (clubId: string, semesterId: string) =>
    api.get<ApiResponse<ClubKpiScore>>(`/gateway/kpi/clubs/${clubId}`, { params: { semesterId } }),
  createAdjustment: (data: {
    clubId: string; semesterId: string; ruleId?: string; points: number; reason: string;
  }) => api.post<ApiResponse<KpiScoreHistory>>('/gateway/kpi/adjustments', data),
  getRules: (semesterId: string) =>
    api.get<ApiResponse<KpiRule[]>>('/gateway/kpi/rules', { params: { semesterId } }),
  createRule: (data: Omit<KpiRule, 'id' | 'isActive'>) =>
    api.post<ApiResponse<KpiRule>>('/gateway/kpi/rules', data),
  updateRule: (id: string, data: Omit<KpiRule, 'id' | 'isActive'>) =>
    api.put<ApiResponse<KpiRule>>(`/gateway/kpi/rules/${id}`, data),
  deleteRule: (id: string) =>
    api.delete<ApiResponse<null>>(`/gateway/kpi/rules/${id}`),
};
