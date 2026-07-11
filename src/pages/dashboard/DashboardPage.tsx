import React from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Building2, ClipboardList, CheckCircle, Calendar, Star, Users } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { clubApi } from '../../api/club.api';
import { reportApi } from '../../api/report.api';
import { eventApi } from '../../api/event.api';
import { getStatusColor, formatDate } from '../../utils';
import { ClubStatusMap, ClubStatusLabel } from '../../types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

function AdminDashboard() {
  const { data: clubsRes, isLoading: clubsLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => clubApi.getAll(),
  });
  const clubs = clubsRes?.data?.data ?? [];

  const firstClubId = clubs[0]?.id;

  const { data: reportsRes, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports-pending', firstClubId],
    queryFn: () => reportApi.getByClub(firstClubId, 1), // Pending = 1
    enabled: !!firstClubId,
  });

  if (clubsLoading || (firstClubId && reportsLoading)) return <PageSpinner />;

  const pendingReports = reportsRes?.data?.data ?? [];
  const activeClubs = clubs.filter(c => c.status === 1 || c.status === 'Active').length;
  const pendingClubs = clubs.filter(c => c.status === 0 || c.status === 'PendingApproval').length;

  const statusCounts = clubs.reduce((acc: Record<string, number>, c: any) => {
    const statusName = ClubStatusLabel[c.status] || 'Khác';
    acc[statusName] = (acc[statusName] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Tổng số CLB" value={clubs.length} icon={<Building2 size={22} />} gradient="gradient-primary"
          subtitle={`${activeClubs} đang hoạt động`} />
        <StatCard title="CLB chờ duyệt" value={pendingClubs} icon={<Building2 size={22} />} gradient="gradient-info"
          subtitle="Cần xem xét" />
        <StatCard title="Báo cáo chờ duyệt" value={pendingReports.length} icon={<ClipboardList size={22} />} gradient="gradient-warning"
          subtitle="Cần xử lý ngay" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Trạng thái hoạt động CLB</h3>
          {statusData.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">Không có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Báo cáo chờ duyệt gần đây</h3>
            <a href="/admin/reports" className="text-sm text-indigo-600 font-medium hover:underline">Xem tất cả →</a>
          </div>
          {pendingReports.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400" />
              Không có báo cáo nào đang chờ duyệt
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReports.slice(0, 5).map((r: any) => (
                <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.createdAt || r.submissionDate)}</p>
                  </div>
                  <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClubManagerDashboard() {
  const { user } = useAuthStore();
  const { data: clubsRes, isLoading: clubsLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => clubApi.getAll(),
  });
  const allClubs = clubsRes?.data?.data ?? [];

  // Fetch members to identify which clubs are managed by this user
  const membersQueries = useQueries({
    queries: allClubs.map(c => ({
      queryKey: ['club-members', c.id],
      queryFn: () => clubApi.getMembers(c.id),
      enabled: allClubs.length > 0,
    }))
  });

  const managedClubs = React.useMemo(() => {
    return allClubs.filter((club, idx) => {
      const query = membersQueries[idx];
      if (!query?.data) return false;
      const members: any[] = query.data.data?.data ?? [];
      return members.some((m: any) =>
        m.userId === user?.id && (m.role === 1 || m.role === 2) && m.status === 1
      );
    });
  }, [allClubs, membersQueries, user]);

  const activeManagedClubId = managedClubs[0]?.id;

  // Fetch reports and events of the main managed club
  const { data: reportsRes, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', activeManagedClubId],
    queryFn: () => reportApi.getByClub(activeManagedClubId!),
    enabled: !!activeManagedClubId,
  });

  const { data: eventsRes, isLoading: eventsLoading } = useQuery({
    queryKey: ['club-events', activeManagedClubId],
    queryFn: () => eventApi.getByClub(activeManagedClubId!),
    enabled: !!activeManagedClubId,
  });

  if (clubsLoading || (activeManagedClubId && (reportsLoading || eventsLoading))) return <PageSpinner />;

  const reports = reportsRes?.data?.data ?? [];
  const events = eventsRes?.data?.data ?? [];
  const pendingReports = reports.filter((r: any) => r.status === 1 || r.status === 'Pending');
  const approvedReports = reports.filter((r: any) => r.status === 2 || r.status === 'Approved');

  return (
    <div className="space-y-6 animate-fadeIn">
      {managedClubs.length === 0 ? (
        <EmptyState icon={<Building2 size={48} />} title="Bạn chưa quản lý câu lạc bộ nào"
          description="Hãy liên hệ quản trị viên hoặc cố vấn để được cấp quyền quản lý CLB." />
      ) : (
        <>
          {/* Managed clubs list banner */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
            <Building2 size={24} className="text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">CLB bạn đang quản lý:</p>
              <p className="text-xs text-indigo-700">{managedClubs.map(c => c.name).join(', ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Báo cáo đã nộp" value={reports.length} icon={<ClipboardList size={22} />} gradient="gradient-primary"
              subtitle={`${approvedReports.length} đã được duyệt`} />
            <StatCard title="Báo cáo chờ duyệt" value={pendingReports.length} icon={<ClipboardList size={22} />} gradient="gradient-warning"
              subtitle="Cần theo dõi phản hồi" />
            <StatCard title="Sự kiện sắp tới" value={events.filter((e: any) => e.status === 1 || e.status === 2).length} icon={<Calendar size={22} />} gradient="gradient-success"
              subtitle="Sự kiện đang/sắp diễn ra" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions / Events list */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4">Hoạt động & Sự kiện</h3>
              {events.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Chưa có sự kiện nào. Hãy vào chi tiết CLB để tạo.</p>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{e.title}</p>
                        <p className="text-xs text-slate-400">{formatDate(e.expectedDate)} • {e.location}</p>
                      </div>
                      <Badge className={getStatusColor(e.status)}>{e.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reports list */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4">Báo cáo hoạt động gần đây</h3>
              {reports.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Chưa nộp báo cáo nào.</p>
              ) : (
                <div className="space-y-3">
                  {reports.slice(0, 5).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-xs">{r.title}</p>
                        <p className="text-xs text-slate-400">Nộp ngày: {formatDate(r.createdAt)}</p>
                      </div>
                      <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StudentDashboard() {
  const { data: clubsRes } = useQuery({ queryKey: ['clubs'], queryFn: () => clubApi.getAll() });
  const clubs = clubsRes?.data?.data?.slice(0, 6) ?? [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Câu lạc bộ nổi bật</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club: any) => {
            const statusName = ClubStatusMap[club.status] ?? String(club.status);
            return (
              <a key={club.id} href={`/clubs/${club.id}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {club.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{club.name}</p>
                  {club.category && <p className="text-xs text-slate-400">{club.category}</p>}
                </div>
                <Badge className={getStatusColor(statusName)}>{statusName}</Badge>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';
  const isClubManager = user?.role === 'ClubManager';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Xin chào, {user?.fullName?.split(' ').slice(-1)[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      {isAdmin ? <AdminDashboard /> : isClubManager ? <ClubManagerDashboard /> : <StudentDashboard />}
    </div>
  );
}
