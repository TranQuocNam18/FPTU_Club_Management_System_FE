// ==================== AUTH ====================
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Advisor' | 'ClubManager' | 'Student';
  isActive: boolean;
  isEmailVerified?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationEmailRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetCode: string;
  newPassword: string;
  confirmNewPassword: string;
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
// ClubStatus enum: PendingApproval=0, Active=1, Suspended=2, Inactive=3
export type ClubStatusEnum = 0 | 1 | 2 | 3;
export type ClubStatus = ClubStatusEnum | 'Pending' | 'PendingApproval' | 'Active' | 'Suspended' | 'Inactive' | string;
export const ClubStatusMap: Record<number | string, string> = {
  0: 'PendingApproval',
  1: 'Active',
  2: 'Suspended',
  3: 'Inactive',
  PendingApproval: 'PendingApproval',
  Active: 'Active',
  Suspended: 'Suspended',
  Inactive: 'Inactive',
};
export const ClubStatusLabel: Record<number | string, string> = {
  0: 'Chờ duyệt',
  1: 'Hoạt động',
  2: 'Tạm dừng',
  3: 'Giải thể',
  PendingApproval: 'Chờ duyệt',
  Active: 'Hoạt động',
  Suspended: 'Tạm dừng',
  Inactive: 'Giải thể',
};

export interface Club {
  id: string;
  name: string;
  description: string;
  logoUrl?: string | null;
  advisorId?: string;
  isActive?: boolean;
  // BE trả về status là số (0,1,2,3) hoặc string
  status: ClubStatus;
  // Các field optional vì BE ClubDto không có nhưng có thể được bổ sung
  category?: string;
  establishedDate?: string;
  memberCount?: number;
}

export interface CreateClubRequest {
  name: string;
  description: string;
  logoUrl?: string | null;
  advisorId: string;
}

export interface UpdateClubRequest {
  name: string;
  description: string;
  logoUrl?: string | null;
}

// ClubRole enum: Member=0, Manager=1, President=2
export type ClubRoleEnum = 0 | 1 | 2;
export const ClubRoleMap: Record<number | string, string> = {
  0: 'Member',
  1: 'Manager',
  2: 'President',
  Member: 'Member',
  Manager: 'Manager',
  President: 'President',
};
export const ClubRoleLabel: Record<number | string, string> = {
  0: 'Thành viên',
  1: 'Quản lý CLB',
  2: 'Chủ nhiệm',
  Member: 'Thành viên',
  Manager: 'Quản lý CLB',
  President: 'Chủ nhiệm',
};

// MembershipStatus enum: Pending=0, Approved=1, Rejected=2, Left=3
export type MembershipStatusEnum = 0 | 1 | 2 | 3;
export const MembershipStatusMap: Record<number | string, string> = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected',
  3: 'Left',
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Left: 'Left',
};

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  // BE returns numeric enum: 0=Member, 1=Manager, 2=President
  role?: ClubRoleEnum | number;
  // BE returns numeric enum: 0=Pending, 1=Approved, 2=Rejected, 3=Left
  status: MembershipStatusEnum | number | string;
  joinedAt?: string;
  joinDate?: string;
  roleInClub?: string;
  isActive?: boolean;
  // May be populated via JOIN in some implementations
  fullName?: string;
  email?: string;
}

// ==================== EVENTS ====================
// EventStatus enum: Draft=0, PendingApproval=1, Approved=2, Rejected=3, Completed=4, Cancelled=5
export type EventStatusEnum = 0 | 1 | 2 | 3 | 4 | 5;
export const EventStatusMap: Record<number | string, string> = {
  0: 'Draft',
  1: 'PendingApproval',
  2: 'Approved',
  3: 'Rejected',
  4: 'Completed',
  5: 'Cancelled',
  Draft: 'Draft',
  PendingApproval: 'PendingApproval',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
};
export const EventStatusLabel: Record<number | string, string> = {
  0: 'Bản nháp',
  1: 'Chờ duyệt',
  2: 'Đã duyệt',
  3: 'Từ chối',
  4: 'Hoàn thành',
  5: 'Đã hủy',
  Draft: 'Bản nháp',
  PendingApproval: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
};

export interface ClubEvent {
  id: string;
  clubId: string;
  clubName?: string;
  title: string;
  description: string;
  // BE uses ExpectedDate (single datetime), not startTime/endTime
  expectedDate?: string;
  startTime: string;
  endTime: string;
  location: string;
  status: EventStatusEnum | string | number;
  isActive?: boolean;
}

export interface CreateEventRequest {
  clubId: string;
  title: string;
  description: string;
  expectedDate: string;
  location: string;
}

// ==================== REPORTS ====================
// ReportStatus: Pending=1, Approved=2, Rejected=3
export const ReportStatusMap: Record<number | string, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
};

// ReportType: Financial=1, Activity=2, General=3
export const ReportTypeMap: Record<number | string, string> = {
  1: 'Financial',
  2: 'Activity',
  3: 'General',
  Financial: 'Financial',
  Activity: 'Activity',
  General: 'General',
};

export interface ActivityReport {
  id: string;
  clubId: string;
  clubName?: string;
  title: string;
  content: string;
  // BE returns string enum name: "Financial", "Activity", "General"
  type?: string | number;
  reportType?: string;
  // BE returns string enum name: "Pending", "Approved", "Rejected"
  status: string | number;
  reporterId?: string;
  reporterName?: string;
  createdBy?: string;
  reviewedBy?: string;
  reviewNote?: string;
  feedback?: string;
  kpiPoints?: number;
  createdAt?: string;
  updatedAt?: string;
  submissionDate?: string;
  attachments?: Array<{ id: string; url: string; fileName: string }>;
}

export interface SubmitReportRequest {
  clubId: string;
  title: string;
  content: string;
  type: number;
}

export interface UpdateReportRequest {
  title: string;
  content: string;
  type: number;
}

export interface ReviewReportRequest {
  isApproved: boolean;
  reviewNote?: string;
}

// ==================== NOTIFICATION ====================
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  // BE: int type (not string)
  type: number | string;
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
}

// ==================== FINANCE ====================
export interface BudgetProposal {
  id: string;
  clubId: string;
  clubName?: string;
  proposerId?: string;
  eventName: string;
  requestedAmount: number;
  approvedAmount?: number;
  proposedDate: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'PartiallyApproved' | 'Rejected' | 'Settled' | string;
  budgetDetailsJson?: string;
  feedback?: string;
}

export interface CreateProposalRequest {
  clubId: string;
  eventName: string;
  requestedAmount: number;
  budgetDetailsJson?: string;
}

export interface Transaction {
  id: string;
  clubId: string;
  amount: number;
  type: 'Income' | 'Expense' | string;
  description: string;
  transactionDate: string;
  referenceId?: string;
  receiptUrl?: string;
}

// ==================== KPI ====================
export interface KPILeaderboardEntry {
  rank: number;
  clubId: string;
  clubName: string;
  logoUrl?: string | null;
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
