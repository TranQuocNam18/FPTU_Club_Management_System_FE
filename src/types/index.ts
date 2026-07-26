// ==================== AUTH ====================
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'StudentAffairsAdmin' | 'ClubManager' | 'Student';
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
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errors?: Array<{ code: string; field?: string | null; message: string }> | null;
  meta?: Record<string, unknown> | null;
  traceId?: string;
}

// ==================== SEMESTER ====================
export type SemesterStatus = 'Draft' | 'Active' | 'Closed';

export interface Semester {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SemesterStatus;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateSemesterRequest {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateSemesterRequest {
  name: string;
  startDate: string;
  endDate: string;
}

// ==================== CLUB ====================
// ClubStatus enum: PendingApproval=0, Active=1, Suspended=2, Inactive=3
export type ClubStatusEnum = 0 | 1 | 2 | 3;
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
  status: ClubStatusEnum | string;
  // Các field optional vì BE ClubDto không có nhưng có thể được bổ sung
  category?: string;
  establishedDate?: string;
  memberCount?: number;
}

export interface CreateClubRequest {
  name: string;
  description: string;
  logoUrl?: string | null;
}

export interface UpdateClubRequest {
  name: string;
  description: string;
  logoUrl?: string | null;
}

// ClubRole enum: Member=0, LegacyManager=1 (no authorization), ClubLeader=2, Treasurer=3
export type ClubRoleEnum = 0 | 1 | 2 | 3;
export const ClubRoleMap: Record<number | string, string> = {
  0: 'Member',
  1: 'LegacyManager',
  2: 'ClubLeader',
  3: 'Treasurer',
  Member: 'Member',
  LegacyManager: 'LegacyManager',
  ClubLeader: 'ClubLeader',
  Treasurer: 'Treasurer',
};
export const ClubRoleLabel: Record<number | string, string> = {
  0: 'Thành viên',
  1: 'Quản lý CLB',
  2: 'Chủ nhiệm',
  Member: 'Thành viên',
  3: 'Thủ quỹ',
  LegacyManager: 'Legacy Manager',
  ClubLeader: 'Chủ nhiệm',
  Treasurer: 'Thủ quỹ',
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
  // BE returns numeric enum: 0=Member, 1=LegacyManager, 2=ClubLeader, 3=Treasurer
  role: ClubRoleEnum | number;
  // BE returns numeric enum: 0=Pending, 1=Approved, 2=Rejected, 3=Left
  status: MembershipStatusEnum | number;
  joinedAt: string;
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
  expectedDate: string;
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
// ReportStatus: Draft=0, PendingApproval=1, Approved=2, Rejected=3, RequestRevision=4
export const ReportStatusMap: Record<number | string, string> = {
  0: 'Draft',
  1: 'PendingApproval',
  2: 'Approved',
  3: 'Rejected',
  4: 'RequestRevision',
  Draft: 'Draft',
  Pending: 'PendingApproval',
  PendingApproval: 'PendingApproval',
  Approved: 'Approved',
  Rejected: 'Rejected',
  RequestRevision: 'RequestRevision',
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
  semesterId?: string | null;
  clubName?: string;
  title: string;
  content: string;
  // BE returns string enum name: "Financial", "Activity", "General"
  type: string | number;
  // BE returns string enum name: "Pending", "Approved", "Rejected"
  status: string | number;
  createdBy?: string;
  reviewedBy?: string;
  reviewNote?: string;
  revisionNumber: number;
  createdAt: string;
  updatedAt?: string;
  attachments?: Array<{ id: string; url: string; fileName: string }>;
}

export interface SubmitReportRequest {
  clubId: string;
  semesterId: string;
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
  action: 'Approve' | 'RequestRevision' | 'Reject';
  reviewNote?: string;
}

export interface SmartReportSourceReference {
  type: string;
  id: string;
  title: string;
  route?: string | null;
}

export interface SmartReportAvailability {
  club: boolean;
  membership: boolean;
  events: boolean;
  finance: boolean;
  balance: boolean;
  kpi: boolean;
}

export interface SmartReportSnapshotEvent {
  id: string;
  title: string;
  expectedDate: string;
  status: string;
}

export interface SmartReportFinanceItem {
  id: string;
  activityId?: string | null;
  title: string;
  proposedDate: string;
  status: string;
  requestedAmount: number;
  approvedAmount?: number | null;
  actualAmount?: number | null;
}

export interface ReportGenerationSnapshot {
  clubId: string;
  clubName: string;
  semesterId: string;
  semesterCode: string;
  totalMembers: number | null;
  newMembers: number | null;
  completedEvents: number | null;
  cancelledEvents: number | null;
  approvedBudget: number | null;
  actualExpense: number | null;
  remainingBalance: number | null;
  kpiScore: number | null;
  kpiRank: number | null;
  events: SmartReportSnapshotEvent[];
  financeItems: SmartReportFinanceItem[];
  sources: SmartReportSourceReference[];
  availability: SmartReportAvailability;
}

export type ReportValidationSeverity = 1 | 2 | 3 | 'Error' | 'Warning' | 'Suggestion';

export interface ReportValidationIssue {
  code: string;
  severity: ReportValidationSeverity;
  message: string;
  field?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceTitle?: string | null;
  suggestedAction?: string | null;
}

export interface ReportValidationResult {
  isReadyToSubmit: boolean;
  errors: ReportValidationIssue[];
  warnings: ReportValidationIssue[];
  suggestions: ReportValidationIssue[];
  evaluatedAt: string;
  clubId: string;
  semesterId: string;
  snapshotVersion: string;
  availability: SmartReportAvailability;
}

export interface GenerateSmartReportRequest {
  clubId: string;
  semesterId: string;
  reportType: number;
}

export interface ValidateSmartReportRequest extends GenerateSmartReportRequest {
  title: string;
  content: string;
  attachments?: Array<{ url: string; fileName: string }>;
}

export interface GeneratedReportDraft {
  clubId: string;
  semesterId: string;
  reportType: number;
  generatedTitle: string;
  generatedContent: string;
  sources: SmartReportSourceReference[];
  validation: ReportValidationResult;
  generatorType: 'RuleBased';
  snapshotVersion: string;
  generatedAt: string;
}

export interface ClubApplication {
  id: string;
  applicantUserId: string;
  proposedClubName: string;
  description: string;
  objectives: string;
  evidenceUrls: string[];
  status: 'PendingApproval' | 'Approved' | 'Rejected';
  reviewFeedback?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  createdClubId?: string | null;
}

export interface ClubApplicationRequest {
  proposedClubName: string;
  description: string;
  objectives: string;
  evidenceUrls: string[];
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
  targetUrl?: string | null;
  sourceEventId?: string | null;
  readAt?: string | null;
  createdAt: string;
}
