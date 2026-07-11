import type {
  ActivityReport,
  BudgetProposal,
  Club,
  ClubEvent,
  ClubMember,
  KPILeaderboardEntry,
  KPIRule,
  Notification,
  Transaction,
  User,
} from '../types';

export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

type ApiEnvelope<T> = { data: T; message: string; statusCode: number; isSuccess: boolean };
type ApiResult<T> = Promise<{ data: ApiEnvelope<T> }>;
type RawResult<T> = Promise<{ data: T }>;

const now = new Date();
const iso = (offsetDays: number, hour = 9) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const ok = <T>(data: T, message = 'Success'): ApiResult<T> =>
  Promise.resolve({ data: { data, message, statusCode: 200, isSuccess: true } });

const raw = <T>(data: T): RawResult<T> => Promise.resolve({ data });

const delay = async () => new Promise(resolve => setTimeout(resolve, 120));

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

let users: User[] = [
  { id: 'u-admin', email: 'admin@fpt.edu.vn', fullName: 'Nguyen Admin', role: 'Admin', isActive: true },
  { id: 'u-advisor', email: 'advisor@fpt.edu.vn', fullName: 'Tran Advisor', role: 'Advisor', isActive: true },
  { id: 'u-manager', email: 'manager@fpt.edu.vn', fullName: 'Le Club Manager', role: 'ClubManager', isActive: true },
  { id: 'u-student', email: 'student@fpt.edu.vn', fullName: 'Pham Student', role: 'Student', isActive: true },
];

let clubs: Club[] = [
  { id: 'club-tech', name: 'CLB Cong nghe FPT', description: 'Noi sinh vien cung xay dung san pham, hoc lap trinh va chia se cong nghe moi.', logoUrl: '', category: 'Cong nghe', status: 'Active', establishedDate: '2021-09-10', memberCount: 42 },
  { id: 'club-art', name: 'CLB Nghe thuat', description: 'San choi am nhac, nhay, ve va cac chuong trinh bieu dien trong truong.', logoUrl: '', category: 'Nghe thuat', status: 'Active', establishedDate: '2020-03-18', memberCount: 36 },
  { id: 'club-sport', name: 'CLB The thao', description: 'To chuc giai dau noi bo, tap luyen bong da, cau long va cac mon the thao phong trao.', logoUrl: '', category: 'The thao', status: 'Active', establishedDate: '2019-11-02', memberCount: 58 },
  { id: 'club-volunteer', name: 'CLB Tinh nguyen', description: 'Thuc hien chien dich cong dong, gay quy va ho tro sinh vien trong cac su kien lon.', logoUrl: '', category: 'Tinh nguyen', status: 'Suspended', establishedDate: '2022-01-05', memberCount: 24 },
  { id: 'club-academic', name: 'CLB Hoc thuat', description: 'Sinh hoat hoc thuat, on thi chung chi, seminar va nghien cuu khoa hoc sinh vien.', logoUrl: '', category: 'Hoc thuat', status: 'Inactive', establishedDate: '2023-05-14', memberCount: 18 },
];

let members: ClubMember[] = [
  { id: 'm1', clubId: 'club-tech', userId: 'u-manager', fullName: 'Le Club Manager', email: 'manager@fpt.edu.vn', joinDate: '2022-02-20', roleInClub: 'Leader', status: 'Approved' },
  { id: 'm2', clubId: 'club-tech', userId: 'u-student', fullName: 'Pham Student', email: 'student@fpt.edu.vn', joinDate: '2024-01-12', roleInClub: 'Member', status: 'Approved' },
  { id: 'm3', clubId: 'club-tech', userId: 'u-pending', fullName: 'Do Minh Khoa', email: 'khoa@fpt.edu.vn', joinDate: iso(-2), roleInClub: 'Member', status: 'Pending' },
  { id: 'm4', clubId: 'club-art', userId: 'u-art', fullName: 'Vo Gia Han', email: 'han@fpt.edu.vn', joinDate: '2023-09-01', roleInClub: 'Treasurer', status: 'Approved' },
];

let events: ClubEvent[] = [
  { id: 'e1', clubId: 'club-tech', clubName: 'CLB Cong nghe FPT', title: 'Workshop React Query', description: 'Chia se cach quan ly server state trong FE.', startTime: iso(2, 18), endTime: iso(2, 20), location: 'Room AL-305', status: 'Upcoming' },
  { id: 'e2', clubId: 'club-tech', clubName: 'CLB Cong nghe FPT', title: 'Hop ban chu nhiem', description: 'Chot ke hoach demo san pham hoc ky.', startTime: iso(5, 14), endTime: iso(5, 15), location: 'Library Hub', status: 'Upcoming' },
  { id: 'e3', clubId: 'club-art', clubName: 'CLB Nghe thuat', title: 'Dem nhac acoustic', description: 'Su kien giao luu am nhac thang nay.', startTime: iso(7, 19), endTime: iso(7, 21), location: 'San A', status: 'Upcoming' },
  { id: 'e4', clubId: 'club-sport', clubName: 'CLB The thao', title: 'Giai cau long noi bo', description: 'Vong loai cap CLB.', startTime: iso(-3, 8), endTime: iso(-3, 11), location: 'Nha da nang', status: 'Completed' },
];

let reports: ActivityReport[] = [
  { id: 'r1', clubId: 'club-tech', clubName: 'CLB Cong nghe FPT', reporterId: 'u-manager', reporterName: 'Le Club Manager', title: 'Bao cao workshop React Query', content: 'Workshop co 45 sinh vien tham gia, hoan thanh demo ung dung quan ly state.', reportType: 'Monthly', submissionDate: iso(-1), status: 'Pending' },
  { id: 'r2', clubId: 'club-art', clubName: 'CLB Nghe thuat', reporterId: 'u-art', reporterName: 'Vo Gia Han', title: 'Bao cao dem nhac acoustic', content: 'Su kien thu hut 120 sinh vien, co hinh anh va bien ban tong ket kem theo.', reportType: 'Weekly', submissionDate: iso(-8), status: 'Approved', feedback: 'To chuc tot, minh chung day du.', kpiPoints: 18 },
  { id: 'r3', clubId: 'club-sport', clubName: 'CLB The thao', reporterId: 'u-manager', reporterName: 'Le Club Manager', title: 'Bao cao giai cau long', content: 'Can bo sung hoa don thue san va danh sach van dong vien.', reportType: 'Monthly', submissionDate: iso(-12), status: 'Rejected', feedback: 'Thieu minh chung chi phi.' },
];

let proposals: BudgetProposal[] = [
  { id: 'b1', clubId: 'club-tech', clubName: 'CLB Cong nghe FPT', proposerId: 'u-manager', eventName: 'FPTU Hackday', requestedAmount: 8500000, proposedDate: iso(-2), status: 'Pending', budgetDetailsJson: 'Backdrop: 1.500.000; Nuoc uong: 800.000; Qua giai: 6.200.000' },
  { id: 'b2', clubId: 'club-art', clubName: 'CLB Nghe thuat', proposerId: 'u-art', eventName: 'Dem nhac acoustic', requestedAmount: 6200000, approvedAmount: 5000000, proposedDate: iso(-12), status: 'Approved', budgetDetailsJson: 'Am thanh, anh sang, truyen thong, backdrop.' },
];

let transactions: Transaction[] = [
  { id: 't1', clubId: 'club-art', amount: 5000000, type: 'Income', description: 'Cap ngan sach dem nhac acoustic', transactionDate: iso(-9), referenceId: 'b2' },
  { id: 't2', clubId: 'club-art', amount: 1200000, type: 'Expense', description: 'Thanh toan backdrop', transactionDate: iso(-8), receiptUrl: 'receipt-placeholder' },
];

let kpiRules: KPIRule[] = [
  { id: 'k1', name: 'Bao cao dung han', description: 'Nop bao cao dung deadline va du minh chung.', maxPoints: 20, weight: 1 },
  { id: 'k2', name: 'To chuc su kien', description: 'Diem theo quy mo va chat luong su kien.', maxPoints: 40, weight: 1.5 },
  { id: 'k3', name: 'Minh bach tai chinh', description: 'Doi chieu ngan sach va hoa don dung quy trinh.', maxPoints: 25, weight: 1 },
];

let notifications: Notification[] = [
  { id: 'n1', userId: 'u-manager', title: 'Bao cao dang cho duyet', message: 'Bao cao workshop React Query da duoc gui den Advisor.', type: 'Info', isRead: false, createdAt: iso(-1, 10) },
  { id: 'n2', userId: 'u-manager', title: 'Ngan sach da phe duyet', message: 'De xuat Dem nhac acoustic da duoc phe duyet 5.000.000 VND.', type: 'Success', isRead: false, createdAt: iso(-8, 9) },
  { id: 'n3', userId: 'u-student', title: 'Su kien sap dien ra', message: 'Workshop React Query se dien ra trong 2 ngay toi.', type: 'Warning', isRead: true, createdAt: iso(-1, 15) },
];

export const mockApi = {
  users: {
    getAll: async (params?: { role?: string; isActive?: boolean }) => {
      await delay();
      let data = clone(users);
      if (params?.role) data = data.filter(u => u.role === params.role);
      if (params?.isActive !== undefined) data = data.filter(u => u.isActive === params.isActive);
      return Promise.resolve({ data: { data, total: data.length, page: 1, pageSize: data.length } });
    },
    updateRole: async (id: string, role: User['role']) => {
      users = users.map(u => u.id === id ? { ...u, role } : u);
      return ok({});
    },
    updateStatus: async (id: string, isActive: boolean) => {
      users = users.map(u => u.id === id ? { ...u, isActive } : u);
      return ok({});
    },
  },
  clubs: {
    getAll: async () => ok(clone(clubs)),
    getById: async (id: string) => ok(clone(clubs.find(c => c.id === id) ?? clubs[0])),
    create: async (data: Partial<Club>) => {
      const club: Club = {
        id: `club-${Date.now()}`,
        name: data.name ?? 'CLB moi',
        description: data.description ?? '',
        logoUrl: data.logoUrl ?? '',
        category: data.category ?? 'Khac',
        status: (data.status as any) ?? 'Pending',
        establishedDate: data.establishedDate ?? new Date().toISOString(),
        memberCount: 0,
      };
      clubs = [club, ...clubs];
      return ok(club, 'Club created');
    },
    update: async (id: string, data: Partial<Club>) => {
      clubs = clubs.map(c => c.id === id ? { ...c, ...data } : c);
      return ok(clone(clubs.find(c => c.id === id)!));
    },
    delete: async (id: string) => {
      clubs = clubs.map(c => c.id === id ? { ...c, status: 'Inactive' } : c);
      return ok(null);
    },
    review: async (id: string, status: number) => {
      const mapped = status === 1 ? 'Active' : status === 2 ? 'Suspended' : 'Inactive';
      clubs = clubs.map(c => c.id === id ? { ...c, status: mapped as Club['status'] } : c);
      return ok(clone(clubs.find(c => c.id === id)!));
    },
    getMembers: async (clubId: string) => ok(clone(members.filter(m => m.clubId === clubId))),
    joinClub: async (clubId: string) => {
      const member: ClubMember = { id: `m-${Date.now()}`, clubId, userId: 'u-student', fullName: 'Pham Student', email: 'student@fpt.edu.vn', joinDate: new Date().toISOString(), roleInClub: 'Member', status: 'Pending' };
      members = [member, ...members];
      return ok(member);
    },
    updateMemberRole: async (clubId: string, userId: string, newRole: number, newStatus: number) => {
      const role = newRole === 2 ? 'Leader' : newRole === 1 ? 'Treasurer' : 'Member';
      const status = newStatus === 1 ? 'Approved' : newStatus === 2 ? 'Rejected' : 'Pending';
      members = members.map(m => m.clubId === clubId && m.userId === userId ? { ...m, roleInClub: role as any, status } : m);
      return ok(clone(members.find(m => m.clubId === clubId && m.userId === userId)!));
    },
    removeMember: async (clubId: string, userId: string) => {
      members = members.filter(m => !(m.clubId === clubId && m.userId === userId));
      return ok(null);
    },
  },
  events: {
    getByClub: async (clubId: string) => ok(clone(events.filter(e => e.clubId === clubId))),
    create: async (data: any) => {
      const event: ClubEvent = { id: `e-${Date.now()}`, clubId: data.clubId, clubName: clubs.find(c => c.id === data.clubId)?.name, title: data.title, description: data.description, startTime: data.startTime || data.expectedDate, endTime: data.endTime || data.startTime || data.expectedDate, location: data.location, status: 'Upcoming' };
      events = [event, ...events];
      return ok(event);
    },
    update: async (id: string, data: Partial<ClubEvent>) => {
      events = events.map(e => e.id === id ? { ...e, ...data } : e);
      return ok(clone(events.find(e => e.id === id)!));
    },
    cancel: async (id: string) => {
      events = events.map(e => e.id === id ? { ...e, status: 'Cancelled' } : e);
      return ok(null);
    },
    deletePermanent: async (id: string) => {
      events = events.filter(e => e.id !== id);
      return ok(null);
    },
  },
  reports: {
    getByClub: async (clubId: string, status?: number) => {
      let data = reports.filter(r => r.clubId === clubId);
      if (status === 1) data = data.filter(r => r.status === 'Pending');
      return ok(clone(data));
    },
    create: async (data: any) => {
      const report: ActivityReport = { id: `r-${Date.now()}`, clubId: data.clubId, clubName: clubs.find(c => c.id === data.clubId)?.name, reporterId: 'u-manager', reporterName: 'Le Club Manager', title: data.title, content: data.content, reportType: data.type === 1 ? 'Monthly' : data.type === 2 ? 'Weekly' : 'Semester', submissionDate: new Date().toISOString(), status: 'Pending' };
      reports = [report, ...reports];
      return ok(report);
    },
    review: async (id: string, data: any) => {
      reports = reports.map(r => r.id === id ? { ...r, status: data.isApproved ? 'Approved' : 'Rejected', feedback: data.reviewNote, kpiPoints: data.isApproved ? 18 : undefined } : r);
      return ok(clone(reports.find(r => r.id === id)!));
    },
  },
  finance: {
    getProposals: async (clubId?: string, status?: string) => {
      let data = clone(proposals);
      if (clubId) data = data.filter(p => p.clubId === clubId);
      if (status) data = data.filter(p => p.status === status);
      return ok(data);
    },
    createProposal: async (data: any) => {
      const proposal: BudgetProposal = { id: `b-${Date.now()}`, clubId: data.clubId, clubName: clubs.find(c => c.id === data.clubId)?.name, proposerId: 'u-manager', eventName: data.eventName, requestedAmount: data.requestedAmount, proposedDate: new Date().toISOString(), status: 'Pending', budgetDetailsJson: data.budgetDetailsJson };
      proposals = [proposal, ...proposals];
      return ok(proposal);
    },
    reviewProposal: async (id: string, data: any) => {
      proposals = proposals.map(p => p.id === id ? { ...p, status: data.status, approvedAmount: data.status === 'Approved' ? data.approvedAmount : undefined } : p);
      return ok(true);
    },
    getBalance: async (clubId: string) => ok(transactions.filter(t => t.clubId === clubId).reduce((sum, t) => sum + (t.type === 'Income' ? t.amount : -t.amount), 0)),
    getTransactions: async (clubId: string) => ok(clone(transactions.filter(t => t.clubId === clubId))),
  },
  kpi: {
    getLeaderboard: async (semester?: string) => ok(clone(clubs.map((c, i): KPILeaderboardEntry => ({
      rank: i + 1,
      clubId: c.id,
      clubName: c.name,
      logoUrl: c.logoUrl,
      totalPoints: [245, 220, 195, 162, 148][i] ?? 100,
      approvedReports: reports.filter(r => r.clubId === c.id && r.status === 'Approved').length + i + 2,
      semester: semester ?? '2025-1',
    })).sort((a, b) => b.totalPoints - a.totalPoints).map((e, i) => ({ ...e, rank: i + 1 })))),
    getRules: async () => ok(clone(kpiRules)),
    createRule: async (data: Omit<KPIRule, 'id'>) => {
      const rule = { id: `k-${Date.now()}`, ...data };
      kpiRules = [rule, ...kpiRules];
      return ok(rule);
    },
    updateRule: async (id: string, data: Omit<KPIRule, 'id'>) => {
      kpiRules = kpiRules.map(r => r.id === id ? { id, ...data } : r);
      return ok(clone(kpiRules.find(r => r.id === id)!));
    },
    deleteRule: async (id: string) => {
      kpiRules = kpiRules.filter(r => r.id !== id);
      return ok(null);
    },
  },
  notifications: {
    getMyNotifications: async () => raw({ success: true, data: clone(notifications) }),
    markAsRead: async (id: string) => {
      notifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
      return raw({ success: true, message: 'Notification marked as read.' });
    },
    markAllAsRead: async () => {
      notifications = notifications.map(n => ({ ...n, isRead: true }));
      return raw({ success: true, message: 'All notifications marked as read.' });
    },
    broadcast: async (data: { title: string; message: string }) => {
      notifications = [{ id: `n-${Date.now()}`, userId: 'all', title: data.title, message: data.message, type: 'Info', isRead: false, createdAt: new Date().toISOString() }, ...notifications];
      return ok({});
    },
  },
};
