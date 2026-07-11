import api from './axios';
import type { ApiResponse, BudgetProposal, CreateProposalRequest, Transaction } from '../types';
import { mockApi, USE_MOCK_DATA } from './mockData';

export const financeApi = {
  createProposal: (data: CreateProposalRequest) =>
    USE_MOCK_DATA ? mockApi.finance.createProposal(data) :
    api.post<ApiResponse<BudgetProposal>>('/gateway/finance/proposals', data),
  
  getProposals: (clubId?: string) =>
    USE_MOCK_DATA ? mockApi.finance.getProposals(clubId) :
    api.get<ApiResponse<BudgetProposal[]>>('/gateway/finance/proposals', { params: { clubId } }),
  
  getPendingProposals: () =>
    USE_MOCK_DATA ? mockApi.finance.getProposals(undefined, 'Pending') :
    api.get<ApiResponse<BudgetProposal[]>>('/gateway/finance/proposals', { params: { status: 'Pending' } }),
  
  reviewProposal: (id: string, data: { status: string; approvedAmount: number; feedback?: string }) =>
    USE_MOCK_DATA ? mockApi.finance.reviewProposal(id, data) :
    api.put<ApiResponse<boolean>>(`/gateway/finance/proposals/${id}/review`, data),
  
  getBalance: (clubId: string) =>
    USE_MOCK_DATA ? mockApi.finance.getBalance(clubId) :
    api.get<ApiResponse<number>>(`/gateway/finance/clubs/${clubId}/balance`),
  
  getTransactions: (clubId: string) =>
    USE_MOCK_DATA ? mockApi.finance.getTransactions(clubId) :
    api.get<ApiResponse<Transaction[]>>('/gateway/finance/transactions', { params: { clubId } }),
};
