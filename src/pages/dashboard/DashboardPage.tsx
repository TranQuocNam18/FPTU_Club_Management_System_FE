import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, ClipboardList, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { clubApi } from '../../api/club.api';
import { reportApi } from '../../api/report.api';
import { getStatusColor, formatDate } from '../../utils';

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
    queryFn: () => reportApi.getByClub(firstClubId, 1),
    enabled: !!firstClubId,
  });

  if (clubsLoading || (firstClubId && reportsLoading)) return <PageSpinner />;

  const pendingReports = reportsRes?.data?.data ?? [];
  const activeClubs = clubs.filter(c => (c.status as any) === 1 || (c.status as any) === '1' || (c.status as any) === 'Active').length;
  const pendingClubs = clubs.filter(c => (c.status as any) === 0 || (c.status as any) === '0' || (c.status as any) === 'Pending').length;

  // Calculate Category Data dynamically
  const categoryCounts = clubs.reduce((acc: Record<string, number>, c: any) => {
    const cat = c.category || 'Khác';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  // Calculate Status Data dynamically
  const statusCounts = clubs.reduce((acc: Record<string, number>, c: any) => {
    const statusMap: Record<any, string> = {
      0: 'Chờ duyệt',
      1: 'Hoạt động',
      3: 'Từ chối',
      'Pending': 'Chờ duyệt',
      'Active': 'Hoạt động',
      'Rejected': 'Từ chối'
    };
    const statusName = statusMap[c.status] || 'Khác';
    acc[statusName] = (acc[statusName] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Tổng số CLB" value={clubs.length} icon={<Building2 size={22} />} gradient="gradient-primary"
          subtitle={`${activeClubs} đang hoạt động`} />
        <StatCard title="CLB chờ duyệt" value={pendingClubs} icon={<Building2 size={22} />} gradient="gradient-info"
          subtitle="Cần xem xét" />
        <StatCard title="Báo cáo chờ duyệt" value={pendingReports.length} icon={<ClipboardList size={22} />} gradient="gradient-warning"
          subtitle="Cần xử lý ngay" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">CLB theo danh mục</h3>
          {categoryData.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">Không có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Chart */}
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
                    <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Pending Reports */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800">Báo cáo chờ duyệt</h3>
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
                  <p className="text-xs text-slate-400">{formatDate(r.submissionDate)}</p>
                </div>
                <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
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
          {clubs.map((club: any) => (
            <a key={club.id} href={`/clubs/${club.id}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {club.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{club.name}</p>
                <p className="text-xs text-slate-400">{club.category}</p>
              </div>
              <Badge className={getStatusColor(club.status)}>{club.status}</Badge>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';

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
      {isAdmin ? <AdminDashboard /> : <StudentDashboard />}
    </div>
  );
}
