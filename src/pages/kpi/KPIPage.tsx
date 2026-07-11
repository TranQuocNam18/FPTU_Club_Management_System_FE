import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Medal, TrendingUp, Star, Plus } from 'lucide-react';
import { kpiApi } from '../../api/kpi.api';
import { EmptyState, Skeleton } from '../../components/ui/Spinner';
import { useAuthStore } from '../../stores/authStore';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { KPIRule } from '../../types';

const SEMESTERS = ['2024-1', '2024-2', '2025-1', '2025-2'];

export default function KPIPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';
  const [semester, setSemester] = useState('2025-1');
  const [showAddRule, setShowAddRule] = useState(false);

  const { data: lbRes, isLoading } = useQuery<any>({ queryKey: ['kpi-leaderboard', semester], queryFn: () => kpiApi.getLeaderboard(semester) as any });
  const { data: rulesRes } = useQuery<any>({ queryKey: ['kpi-rules'], queryFn: () => kpiApi.getRules() as any, enabled: isAdmin });
  const leaderboard = lbRes?.data?.data ?? [];
  const rules = rulesRes?.data?.data ?? [];

  const { register, handleSubmit, reset } = useForm<{ name: string; description: string; maxPoints: number; weight: number }>();
  const addRuleMutation = useMutation({
    mutationFn: (d: Omit<KPIRule, 'id'>) => kpiApi.createRule(d) as any,
    onSuccess: () => { toast.success('Them tieu chi KPI thanh cong!'); qc.invalidateQueries({ queryKey: ['kpi-rules'] }); setShowAddRule(false); reset(); },
    onError: () => toast.error('Khong the them tieu chi'),
  });

  const getRankIcon = (rank: number) => rank === 1 ? <Trophy size={20} className="text-amber-500" /> : rank === 2 ? <Medal size={20} className="text-slate-400" /> : rank === 3 ? <Medal size={20} className="text-amber-600" /> : <span className="text-sm font-bold text-slate-400">#{rank}</span>;
  const getRankBg = (rank: number) => rank === 1 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' : rank === 2 ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200' : rank === 3 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200' : 'bg-white border-slate-100';

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-72 w-full" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-bold text-slate-800">Bang xep hang KPI</h1><p className="text-slate-500 text-sm mt-1">Diem thi dua hoat dong cua cac CLB</p></div>
        <div className="flex items-center gap-3">
          <select value={semester} onChange={e => setSemester(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {SEMESTERS.map(s => <option key={s} value={s}>Hoc ky {s}</option>)}
          </select>
          {isAdmin && <Button icon={<Plus size={16} />} onClick={() => setShowAddRule(true)}>Them tieu chi</Button>}
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-3">
          {leaderboard.length === 0 ? <EmptyState icon={<Trophy size={48} />} title="Chua co du lieu KPI" /> : leaderboard.map((entry: any) => (
            <div key={entry.clubId} className={`rounded-2xl border p-4 flex items-center gap-4 hover:shadow-md transition-all ${getRankBg(entry.rank)}`}>
              <div className="w-10 h-10 flex items-center justify-center">{getRankIcon(entry.rank)}</div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold">{entry.logoUrl ? <img src={entry.logoUrl} alt={entry.clubName} className="w-full h-full object-cover rounded-xl" /> : entry.clubName.charAt(0)}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800">{entry.clubName}</p><p className="text-xs text-slate-400">{entry.approvedReports} bao cao duoc duyet</p></div>
              <div className="text-right"><p className="text-2xl font-bold text-indigo-600">{entry.totalPoints}</p><p className="text-xs text-slate-400">diem KPI</p></div>
            </div>
          ))}
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-indigo-500" /> Bieu do diem KPI</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leaderboard.slice(0, 5)} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="clubName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={90} tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '...' : v} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="totalPoints" fill="#6366f1" radius={[0, 4, 4, 0]} name="Diem KPI" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {isAdmin && <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Star size={16} className="text-amber-500" /> Tieu chi KPI</h3>
            <div className="space-y-2">{rules.map((r: any) => <div key={r.id} className="p-3 rounded-xl bg-slate-50 flex items-start gap-2"><div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center"><Star size={12} className="text-indigo-600" /></div><div><p className="text-xs font-medium text-slate-700">{r.name}</p><p className="text-xs text-slate-400">Toi da {r.maxPoints} diem - He so {r.weight}</p></div></div>)}</div>
          </div>}
        </div>
      </div>
      <Modal isOpen={showAddRule} onClose={() => { setShowAddRule(false); reset(); }} title="Them tieu chi KPI moi">
        <form onSubmit={handleSubmit(d => addRuleMutation.mutate(d as any))} className="space-y-4">
          <input {...register('name', { required: true })} className="input-field" placeholder="Ten tieu chi" />
          <textarea {...register('description')} rows={2} className="input-field resize-none" placeholder="Mo ta chi tiet" />
          <div className="grid grid-cols-2 gap-3"><input {...register('maxPoints', { valueAsNumber: true })} type="number" min={1} className="input-field" placeholder="Diem toi da" /><input {...register('weight', { valueAsNumber: true })} type="number" step={0.1} min={0.1} className="input-field" placeholder="He so" /></div>
          <div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={() => setShowAddRule(false)}>Huy</Button><Button type="submit" loading={addRuleMutation.isPending}>Them tieu chi</Button></div>
        </form>
      </Modal>
    </div>
  );
}
