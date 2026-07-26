import api from './axios';
import type { ApiResponse } from '../types';

export interface FinanceBalance {
  clubId: string;
  allocatedAmount: number;
  spentAmount: number;
  availableAmount: number;
  updatedAt?: string | null;
}

export interface FinanceTransaction {
  id: string;
  clubId: string;
  referenceId?: string | null;
  amount: number;
  type: 'Allocation' | 'Disbursement' | 'Expense' | 'Refund' | 'Adjustment';
  description: string;
  transactionDate: string;
  receiptUrl?: string | null;
  createdBy: string;
}

export interface SettleProposalRequest {
  actualAmount: number;
  receiptUrl: string;
  description?: string;
}

export interface BudgetProposal {
  id: string;
  clubId: string;
  activityId?: string | null;
  proposerId: string;
  eventName: string;
  requestedAmount: number;
  approvedAmount?: number | null;
  proposedDate: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  status: 'Draft' | 'Pending' | 'PendingApproval' | 'Approved' | 'PartiallyApproved' | 'Rejected' | 'Settled';
  feedback?: string | null;
  budgetDetailsJson?: string | null;
  actualAmount?: number | null;
  receiptUrl?: string | null;
  settlementDescription?: string | null;
  settledBy?: string | null;
  settledAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ProposalInput {
  clubId: string;
  activityId?: string | null;
  eventName: string;
  requestedAmount: number;
  budgetDetailsJson?: string | null;
}

export const financeApi = {
  getProposals: (params?: { clubId?: string; status?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<BudgetProposal[]>>('/gateway/finance/proposals', { params }),
  getProposal: (id: string) =>
    api.get<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}`),
  createProposal: (data: ProposalInput) =>
    api.post<ApiResponse<BudgetProposal>>('/gateway/finance/proposals', data),
  updateProposal: (id: string, data: Omit<ProposalInput, 'clubId'>) =>
    api.put<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}`, data),
  submitProposal: (id: string) =>
    api.post<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}/submit`),
  approveProposal: (id: string) =>
    api.post<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}/approve`),
  partialApproveProposal: (id: string, approvedAmount: number, feedback: string) =>
    api.post<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}/partial-approve`, { approvedAmount, feedback }),
  rejectProposal: (id: string, feedback: string) =>
    api.post<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${id}/reject`, { feedback }),
  getBalance: (clubId: string) =>
    api.get<ApiResponse<FinanceBalance>>(`/gateway/finance/clubs/${clubId}/balance`),
  getTransactions: (clubId: string) =>
    api.get<ApiResponse<FinanceTransaction[]>>('/gateway/finance/transactions', { params: { clubId } }),
  settleProposal: (proposalId: string, data: SettleProposalRequest) =>
    api.post<ApiResponse<BudgetProposal>>(`/gateway/finance/proposals/${proposalId}/settle`, data),
};
