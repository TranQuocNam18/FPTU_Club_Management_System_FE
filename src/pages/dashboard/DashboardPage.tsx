import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, ClipboardList, DollarSign, Trophy, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { StatCard } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { clubApi } from '../../api/club.api';
import { reportApi } from '../../api/report.api';
import { getStatusColor, formatDate } from '../../utils';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

const mockMonthlyData = [
  { month: 'T1', reports: 12, events: 8, budget: 15 },
  { month: 'T2', reports: 19, events: 12, budget: 22 },
  { month: 'T3', reports: 15, events: 9, budget: 18 },
  { month: 'T4', reports: 24, events: 16, budget: 30 },
  { month: 'T5', reports: 20, events: 14, budget: 25 },
  { month: 'T6', reports: 28, events: 18, budget: 35 },
];

const mockCategoryData = [
  { name: 'Kỹ thuật', value: 8 },
  { name: 'Văn hóa', value: 5 },
  { name: 'Thể thao', value: 6 },
  { name: 'Học thuật', value: 4 },
  { name: 'Nghệ thuật', value: 3 },
];

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Tổng số CLB" value={clubs.length} icon={<Building2 size={22} />} gradient="gradient-primary"
          subtitle={`${activeClubs} đang hoạt động`} trend={{ value: 12, positive: true }} />
        <StatCard title="Báo cáo chờ duyệt" value={pendingReports.length} icon={<ClipboardList size={22} />} gradient="gradient-warning"
          subtitle="Cần xử lý ngay" />
        <StatCard title="Tổng sinh viên" value="1,240" icon={<Users size={22} />} gradient="gradient-info"
          trend={{ value: 8, positive: true }} />
        <StatCard title="Ngân sách đã duyệt" value="₫85M" icon={<DollarSign size={22} />} gradient="gradient-success"
          subtitle="Học kỳ hiện tại" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Hoạt động theo tháng</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mockMonthlyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="reports" fill="#6366f1" radius={[4, 4, 0, 0]} name="Báo cáo" />
              <Bar dataKey="events" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Sự kiện" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">CLB theo danh mục</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={mockCategoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                dataKey="value" paddingAngle={3}>
                {mockCategoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="CLB đã tham gia" value="2" icon={<Building2 size={22} />} gradient="gradient-primary" />
        <StatCard title="Sự kiện sắp tới" value="5" icon={<Clock size={22} />} gradient="gradient-info" />
        <StatCard title="Điểm KPI" value="85" icon={<Trophy size={22} />} gradient="gradient-success" />
      </div>

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
