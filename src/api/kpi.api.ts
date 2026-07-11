import api from './axios';
import type { KPIRule } from '../types';
import { mockApi, USE_MOCK_DATA } from './mockData';

export const kpiApi = {
  getLeaderboard: (semester?: string) =>
    USE_MOCK_DATA ? mockApi.kpi.getLeaderboard(semester) :
    api.get('/gateway/kpi/leaderboard', { params: { semester } }),
  
  getRules: () =>
    USE_MOCK_DATA ? mockApi.kpi.getRules() :
    api.get('/gateway/kpi/rules'),
  
  createRule: (data: Omit<KPIRule, 'id'>) =>
    USE_MOCK_DATA ? mockApi.kpi.createRule(data) :
    api.post('/gateway/kpi/rules', data),
  
  updateRule: (id: string, data: Omit<KPIRule, 'id'>) =>
    USE_MOCK_DATA ? mockApi.kpi.updateRule(id, data) :
    api.put(`/gateway/kpi/rules/${id}`, data),
  
  deleteRule: (id: string) =>
    USE_MOCK_DATA ? mockApi.kpi.deleteRule(id) :
    api.delete(`/gateway/kpi/rules/${id}`),
};
