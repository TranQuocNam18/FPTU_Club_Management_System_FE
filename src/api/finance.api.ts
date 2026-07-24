import api from './axios';
import type { ApiResponse, BudgetProposal, CreateProposalRequest, Transaction, UpdateProposalRequest } from '../types';
import { mockApi, USE_MOCK_DATA } from './mockData';

export const financeApi = {
  createProposal: (data: CreateProposalRequest) =>
    USE_MOCK_DATA ? mockApi.finance.createProposal(data) :
    api.post<ApiResponse<BudgetProposal>>('/gateway/finance/proposals', data),
  
  getProposals: (params?: { clubId?: string; status?: string; page?: number; pageSize?: number }) =>
    USE_MOCK_DATA ? mockApi.finance.getProposals(params?.clubId, params?.status) :
    api.get<ApiResponse<BudgetProposal[]>>('/gateway/finance/proposals', { params }),
  
  getPendingProposals: () =>
    USE_MOCK_DATA ? mockApi.finance.getProposals(undefined, 'Pending') :
    api.get<ApiResponse<BudgetProposal[]>>('/gateway/finance/proposals', { params: { status: 'Pending' } }),
  
  getProposalById: (id: string) =>
    USE_MOCK_DATA ? mockApi.finance.getProposalById(id) :
    api.get<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}`),

  updateProposal: (id: string, data: UpdateProposalRequest) =>
    USE_MOCK_DATA ? mockApi.finance.updateProposal(id, data) :
    api.put<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}`, data),

  submitProposal: (id: string) =>
    USE_MOCK_DATA ? mockApi.finance.submitProposal(id) :
    api.post<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}/submit`),

  approveProposal: (id: string) =>
    USE_MOCK_DATA ? mockApi.finance.approveProposal(id) :
    api.post<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}/approve`),

  partialApproveProposal: (id: string, approvedAmount: number, feedback: string) =>
    USE_MOCK_DATA ? mockApi.finance.partialApproveProposal(id, approvedAmount, feedback) :
    api.post<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}/partial-approve`, { approvedAmount, feedback }),

  rejectProposal: (id: string, feedback: string) =>
    USE_MOCK_DATA ? mockApi.finance.rejectProposal(id, feedback) :
    api.post<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}/reject`, { feedback }),
  
  getBalance: (clubId: string) =>
    USE_MOCK_DATA ? mockApi.finance.getBalance(clubId) :
    api.get<ApiResponse<number>>(`/gateway/finance/clubs/${clubId}/balance`),
  
  getTransactions: (clubId: string) =>
    USE_MOCK_DATA ? mockApi.finance.getTransactions(clubId) :
    api.get<ApiResponse<Transaction[]>>('/gateway/finance/transactions', { params: { clubId } }),
};
