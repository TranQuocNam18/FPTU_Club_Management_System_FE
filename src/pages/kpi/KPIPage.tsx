import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Medal, TrendingUp, Star } from 'lucide-react';
import { kpiApi } from '../../api/finance.api';
import { PageSpinner, EmptyState } from '../../components/ui/Spinner';
import { useAuthStore } from '../../stores/authStore';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SEMESTERS = ['2024-1', '2024-2', '2025-1', '2025-2'];

// Mock data for when API isn't available
const mockLeaderboard = [
  { rank: 1, clubId: '1', clubName: 'CLB Kỹ thuật FPT', logoUrl: '', totalPoints: 245, approvedReports: 12, semester: '2025-1' },
  { rank: 2, clubId: '2', clubName: 'CLB Nghệ thuật', logoUrl: '', totalPoints: 220, approvedReports: 10, semester: '2025-1' },
  { rank: 3, clubId: '3', clubName: 'CLB Thể thao', logoUrl: '', totalPoints: 195, approvedReports: 9, semester: '2025-1' },
  { rank: 4, clubId: '4', clubName: 'CLB Học thuật', logoUrl: '', totalPoints: 178, approvedReports: 8, semester: '2025-1' },
  { rank: 5, clubId: '5', clubName: 'CLB Văn hóa', logoUrl: '', totalPoints: 162, approvedReports: 7, semester: '2025-1' },
];

export default function KPIPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';
  const [semester, setSemester] = useState('2025-1');
  const [showAddRule, setShowAddRule] = useState(false);

  const { data: lbRes, isLoading } = useQuery({
    queryKey: ['kpi-leaderboard', semester],
    queryFn: () => kpiApi.getLeaderboard(semester),
  });
  const { data: rulesRes } = useQuery({ queryKey: ['kpi-rules'], queryFn: () => kpiApi.getRules(), enabled: isAdmin });

  const leaderboard = lbRes?.data?.data?.length ? lbRes.data.data : mockLeaderboard;
  const rules = rulesRes?.data?.data ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; description: string; maxPoints: number; weight: number }>();

  const addRuleMutation = useMutation({
    mutationFn: (d: any) => kpiApi.createRule(d),
    onSuccess: () => { toast.success('Thêm tiêu chí KPI thành công!'); qc.invalidateQueries({ queryKey: ['kpi-rules'] }); setShowAddRule(false); reset(); },
    onError: () => toast.error('Không thể thêm tiêu chí'),
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} className="text-amber-500" />;
    if (rank === 2) return <Medal size={20} className="text-slate-400" />;
    if (rank === 3) return <Medal size={20} className="text-amber-600" />;
    return <span className="text-sm font-bold text-slate-400">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    return 'bg-white border-slate-100';
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bảng xếp hạng KPI</h1>
          <p className="text-slate-500 text-sm mt-1">Điểm thi đua hoạt động của các CLB</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={semester} onChange={e => setSemester(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {SEMESTERS.map(s => <option key={s} value={s}>Học kỳ {s}</option>)}
          </select>
          {isAdmin && (
            <Button icon={<Star size={16} />} onClick={() => setShowAddRule(true)}>Thêm tiêu chí</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="xl:col-span-2 space-y-3">
          {leaderboard.length === 0 ? (
            <EmptyState icon={<Trophy size={48} />} title="Chưa có dữ liệu KPI" description="Dữ liệu xếp hạng sẽ được cập nhật sau kỳ tính điểm" />
          ) : leaderboard.map((entry: any) => (
            <div key={entry.clubId}
              className={`rounded-2xl border p-4 flex items-center gap-4 hover:shadow-md transition-all ${getRankBg(entry.rank)}`}>
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {entry.logoUrl ? <img src={entry.logoUrl} alt={entry.clubName} className="w-full h-full object-cover rounded-xl" /> : entry.clubName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{entry.clubName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{entry.approvedReports} báo cáo được duyệt</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-indigo-600">{entry.totalPoints}</p>
                <p className="text-xs text-slate-400">điểm KPI</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Rules */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" /> Biểu đồ điểm KPI
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leaderboard.slice(0, 5)} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="clubName" axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b' }} width={80}
                  tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '...' : v} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="totalPoints" fill="#6366f1" radius={[0, 4, 4, 0]} name="Điểm KPI" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {isAdmin && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Star size={16} className="text-amber-500" /> Tiêu chí KPI
              </h3>
              {rules.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Chưa có tiêu chí nào</p>
              ) : (
                <div className="space-y-2">
                  {rules.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-50 flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Star size={12} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">{r.name}</p>
                        <p className="text-xs text-slate-400">Tối đa {r.maxPoints} điểm • Hệ số {r.weight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Rule Modal */}
      <Modal isOpen={showAddRule} onClose={() => { setShowAddRule(false); reset(); }} title="Thêm tiêu chí KPI mới">
        <form onSubmit={handleSubmit(d => addRuleMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên tiêu chí</label>
            <input {...register('name', { required: true })} className="input-field" placeholder="VD: Tổ chức sự kiện lớn" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
            <textarea {...register('description')} rows={2} className="input-field resize-none" placeholder="Mô tả chi tiết..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Điểm tối đa</label>
              <input {...register('maxPoints', { valueAsNumber: true })} type="number" min={1} max={100} className="input-field" placeholder="30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hệ số (Weight)</label>
              <input {...register('weight', { valueAsNumber: true })} type="number" step={0.1} min={0.1} max={3} className="input-field" placeholder="1.0" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowAddRule(false); reset(); }}>Hủy</Button>
            <Button type="submit" loading={addRuleMutation.isPending}>Thêm tiêu chí</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
