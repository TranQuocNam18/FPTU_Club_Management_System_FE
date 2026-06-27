// ==================== AUTH ====================
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Advisor' | 'ClubManager' | 'Student';
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  isSuccess: boolean;
}

// ==================== CLUB ====================
export type ClubStatus = 'Active' | 'Suspended' | 'Inactive';

export interface Club {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  category: string;
  status: ClubStatus;
  establishedDate: string;
  memberCount?: number;
}

export interface CreateClubRequest {
  name: string;
  description: string;
  logoUrl: string;
  category: string;
  establishedDate: string;
}

export interface UpdateClubRequest extends CreateClubRequest {
  status: ClubStatus;
}

export type MemberRoleInClub = 'Member' | 'Leader' | 'Treasurer';

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  fullName: string;
  email: string;
  joinDate: string;
  roleInClub: MemberRoleInClub;
  status: string;
}

// ==================== EVENTS ====================
export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface ClubEvent {
  id: string;
  clubId: string;
  clubName?: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  status: EventStatus;
}

export interface CreateEventRequest {
  clubId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
}

// ==================== REPORTS ====================
export type ReportType = 'Weekly' | 'Monthly' | 'Semester';
export type ReportStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

export interface ActivityReport {
  id: string;
  clubId: string;
  clubName?: string;
  activityId?: string;
  reporterId: string;
  reporterName?: string;
  title: string;
  content: string;
  reportType: ReportType;
  submissionDate: string;
  status: ReportStatus;
  feedback?: string;
  kpiPoints?: number;
}

export interface SubmitReportRequest {
  clubId: string;
  title: string;
  content: string;
}

export interface ReviewReportRequest {
  status: 'Approved' | 'Rejected';
  feedback: string;
  kpiPoints: number;
}

// ==================== FINANCE ====================
export type ProposalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Adjusted';
export type TransactionType = 'Income' | 'Expense';

export interface BudgetProposal {
  id: string;
  clubId: string;
  clubName?: string;
  activityId?: string;
  proposerId: string;
  eventName: string;
  requestedAmount: number;
  approvedAmount?: number;
  proposedDate: string;
  status: ProposalStatus;
  budgetDetailsJson?: string;
}

export interface CreateProposalRequest {
  clubId: string;
  eventName: string;
  requestedAmount: number;
  budgetDetailsJson: string;
}

export interface Transaction {
  id: string;
  clubId: string;
  amount: number;
  type: TransactionType;
  description: string;
  referenceId?: string;
  transactionDate: string;
  receiptUrl?: string;
}

// ==================== KPI ====================
export interface KPILeaderboardEntry {
  rank: number;
  clubId: string;
  clubName: string;
  logoUrl: string;
  totalPoints: number;
  approvedReports: number;
  semester: string;
}

export interface KPIRule {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
}

// ==================== NOTIFICATION ====================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Info' | 'Success' | 'Warning' | 'Error';
  isRead: boolean;
  createdAt: string;
  link?: string;
}
