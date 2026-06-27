import api from './axios';
import type { ApiResponse, BudgetProposal, CreateProposalRequest, Transaction, KPILeaderboardEntry, KPIRule } from '../types';

// Mock Data Store in-memory
const mockProposals: BudgetProposal[] = [
  {
    id: 'prop-1',
    clubId: '99999999-9999-9999-9999-999999999999',
    clubName: 'FPTU Developer Club',
    proposerId: 'user-manager-1',
    eventName: 'FPTU Tech Hackathon 2026',
    requestedAmount: 15000000,
    approvedAmount: 0,
    proposedDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    status: 'Pending',
    budgetDetailsJson: '{"Tổ chức": 5000000, "Giải thưởng": 7000000, "Truyền thông": 3000000}',
  },
  {
    id: 'prop-2',
    clubId: '99999999-9999-9999-9999-999999999999',
    clubName: 'FPTU Developer Club',
    proposerId: 'user-manager-1',
    eventName: 'Seminar AI & Machine Learning',
    requestedAmount: 5000000,
    approvedAmount: 5000000,
    proposedDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    status: 'Approved',
    budgetDetailsJson: '{"Nước uống": 1000000, "Băng rôn & Standee": 1500000, "Quà tặng diễn giả": 2500000}',
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    clubId: '99999999-9999-9999-9999-999999999999',
    amount: 10000000,
    type: 'Income',
    description: 'Quỹ hoạt động CLB học kỳ Spring 2026',
    transactionDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx-2',
    clubId: '99999999-9999-9999-9999-999999999999',
    amount: 5000000,
    type: 'Expense',
    description: 'Thanh toán chi phí Seminar AI & Machine Learning',
    transactionDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
];

const mockRules: KPIRule[] = [
  {
    id: 'rule-1',
    name: 'Tổ chức sự kiện học thuật chuyên ngành',
    description: 'Tổ chức các cuộc thi học thuật, hội thảo, seminar công nghệ mang lại giá trị kiến thức cho sinh viên.',
    maxPoints: 30,
    weight: 1.5,
  },
  {
    id: 'rule-2',
    name: 'Tổ chức sự kiện giải trí hoặc teambuilding',
    description: 'Các sự kiện giao lưu, kết nối thành viên nội bộ hoặc sự kiện âm nhạc, thể thao.',
    maxPoints: 20,
    weight: 1.0,
  },
  {
    id: 'rule-3',
    name: 'Hoàn thành báo cáo đúng thời hạn',
    description: 'Nộp báo cáo tuần/tháng đầy đủ, đúng hạn và không bị nhắc nhở.',
    maxPoints: 10,
    weight: 0.8,
  },
];

const mockLeaderboard: KPILeaderboardEntry[] = [
  {
    rank: 1,
    clubId: '99999999-9999-9999-9999-999999999999',
    clubName: 'FPTU Developer Club',
    logoUrl: '',
    totalPoints: 145,
    approvedReports: 12,
    semester: 'Spring 2026',
  },
  {
    rank: 2,
    clubId: 'club-js',
    clubName: 'Japanese Culture Club',
    logoUrl: '',
    totalPoints: 120,
    approvedReports: 9,
    semester: 'Spring 2026',
  },
  {
    rank: 3,
    clubId: 'club-music',
    clubName: 'FPTU Music Association',
    logoUrl: '',
    totalPoints: 95,
    approvedReports: 7,
    semester: 'Spring 2026',
  },
];

export const financeApi = {
  createProposal: async (data: CreateProposalRequest) => {
    const newProposal: BudgetProposal = {
      id: `prop-${Math.random().toString(36).substr(2, 9)}`,
      clubId: data.clubId,
      clubName: 'Câu lạc bộ của tôi',
      proposerId: 'current-user',
      eventName: data.eventName,
      requestedAmount: data.requestedAmount,
      approvedAmount: 0,
      proposedDate: new Date().toISOString(),
      status: 'Pending',
      budgetDetailsJson: data.budgetDetailsJson,
    };
    mockProposals.unshift(newProposal);
    return { data: { data: newProposal, success: true, message: 'Đệ trình dự án thành công!' } };
  },

  getProposals: async () => {
    return { data: { data: mockProposals, success: true, message: '' } };
  },

  getPendingProposals: async () => {
    const pending = mockProposals.filter(p => p.status === 'Pending');
    return { data: { data: pending, success: true, message: '' } };
  },

  reviewProposal: async (id: string, data: { status: string; approvedAmount: number; feedback?: string }) => {
    const prop = mockProposals.find(p => p.id === id);
    if (prop) {
      prop.status = data.status as any;
      prop.approvedAmount = data.approvedAmount;
      if (data.status === 'Approved' && prop.requestedAmount) {
        mockTransactions.unshift({
          id: `tx-${Math.random().toString(36).substr(2, 9)}`,
          clubId: prop.clubId,
          amount: data.approvedAmount,
          type: 'Expense',
          description: `Rút kinh phí: ${prop.eventName}`,
          transactionDate: new Date().toISOString(),
        });
      }
    }
    return { data: { data: true, success: true, message: 'Đã duyệt yêu cầu kinh phí!' } };
  },

  getBalance: async (clubId: string) => {
    const balance = mockTransactions.reduce((acc, t) => {
      if (t.clubId !== clubId) return acc;
      return t.type === 'Income' ? acc + t.amount : acc - t.amount;
    }, 20000000); // Base balance
    return { data: { data: balance, success: true, message: '' } };
  },

  getTransactions: async (clubId: string) => {
    const txs = mockTransactions.filter(t => t.clubId === clubId);
    return { data: { data: txs, success: true, message: '' } };
  },
};

export const kpiApi = {
  getLeaderboard: async (semester?: string) => {
    const filtered = semester ? mockLeaderboard.filter(l => l.semester.toLowerCase().includes(semester.toLowerCase())) : mockLeaderboard;
    return { data: { data: filtered, success: true, message: '' } };
  },

  getRules: async () => {
    return { data: { data: mockRules, success: true, message: '' } };
  },

  createRule: async (data: Omit<KPIRule, 'id'>) => {
    const newRule: KPIRule = {
      ...data,
      id: `rule-${Math.random().toString(36).substr(2, 9)}`,
    };
    mockRules.push(newRule);
    return { data: { data: newRule, success: true, message: 'Đã thêm quy tắc KPI mới!' } };
  },

  updateRule: async (id: string, data: Omit<KPIRule, 'id'>) => {
    const idx = mockRules.findIndex(r => r.id === id);
    if (idx !== -1) {
      mockRules[idx] = { ...data, id };
      return { data: { data: mockRules[idx], success: true, message: 'Cập nhật quy tắc KPI thành công!' } };
    }
    throw new Error('Rule not found');
  },

  deleteRule: async (id: string) => {
    const idx = mockRules.findIndex(r => r.id === id);
    if (idx !== -1) {
      mockRules.splice(idx, 1);
    }
    return { data: { data: null, success: true, message: 'Đã xóa quy tắc KPI!' } };
  },
};
