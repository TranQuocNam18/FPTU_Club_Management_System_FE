import React, { useState } from 'react';
import { Users, Search, Shield, GraduationCap, UserCog } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Badge } from '../../components/ui/Badge';
import { userApi } from '../../api/auth.api';
import { Skeleton } from '../../components/ui/Spinner';
import { getRoleLabel } from '../../utils';
import type { User } from '../../types';

const roleIcons: Record<string, React.ReactNode> = {
  Admin: <Shield size={14} className="text-red-500" />,
  Advisor: <Shield size={14} className="text-violet-500" />,
  ClubManager: <UserCog size={14} className="text-indigo-500" />,
  Student: <GraduationCap size={14} className="text-emerald-500" />,
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const { data: usersRes, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => userApi.getAll({ pageSize: 100 }) });
  const updateRoleMutation = useMutation({ mutationFn: ({ id, role }: { id: string; role: string }) => userApi.updateRole(id, role), onSuccess: () => { toast.success('Cap nhat vai tro thanh cong!'); qc.invalidateQueries({ queryKey: ['admin-users'] }); } });
  const updateStatusMutation = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => userApi.updateStatus(id, isActive), onSuccess: () => { toast.success('Cap nhat trang thai thanh cong!'); qc.invalidateQueries({ queryKey: ['admin-users'] }); } });
  const users: User[] = usersRes?.data?.data ?? [];
  const filtered = users.filter(u => ((u.fullName || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase())) && (!roleFilter || u.role === roleFilter));

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return <div>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-bold text-slate-800">Quan ly nguoi dung</h1><p className="text-slate-500 text-sm mt-1">{users.length} tai khoan mock trong he thong</p></div>
      <div className="flex items-center gap-3"><div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tim kiem nguoi dung..." className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-52" /></div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"><option value="">Tat ca vai tro</option>{['Admin', 'Advisor', 'ClubManager', 'Student'].map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}</select></div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">{['Admin', 'Advisor', 'ClubManager', 'Student'].map(role => <div key={role} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">{roleIcons[role]}</div><div><p className="text-xs text-slate-400">{getRoleLabel(role)}</p><p className="text-xl font-bold text-slate-700">{users.filter(u => u.role === role).length}</p></div></div>)}</div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-slate-50 border-b border-slate-100"><th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Nguoi dung</th><th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Vai tro</th><th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase">Trang thai</th><th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase">Thao tac</th></tr></thead><tbody className="divide-y divide-slate-50">{filtered.map(u => <tr key={u.id} className="hover:bg-slate-50"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">{u.fullName?.charAt(0) ?? 'U'}</div><div><p className="text-sm font-semibold text-slate-800">{u.fullName}</p><p className="text-xs text-slate-400">{u.email}</p></div></div></td><td className="px-6 py-4"><select value={u.role} onChange={e => updateRoleMutation.mutate({ id: u.id, role: e.target.value })} className="text-sm text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5 bg-white">{['Admin', 'Advisor', 'ClubManager', 'Student'].map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}</select></td><td className="px-6 py-4"><Badge className={u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>{u.isActive ? 'Hoat dong' : 'Vo hieu'}</Badge></td><td className="px-6 py-4"><div className="flex justify-end"><button onClick={() => updateStatusMutation.mutate({ id: u.id, isActive: !u.isActive })} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${u.isActive ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}>{u.isActive ? 'Vo hieu hoa' : 'Kich hoat'}</button></div></td></tr>)}</tbody></table></div></div>
  </div>;
}
