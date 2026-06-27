import React, { useState } from 'react';
import { Users, Search, Shield, GraduationCap, UserCog } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { getStatusColor, getRoleLabel } from '../../utils';

// Mock data for users
const mockUsers = [
  { id: '1', fullName: 'Nguyễn Văn An', email: 'an.nv@fpt.edu.vn', role: 'Admin', isActive: true },
  { id: '2', fullName: 'Trần Thị Bình', email: 'binh.tt@fpt.edu.vn', role: 'ClubManager', isActive: true },
  { id: '3', fullName: 'Lê Văn Cường', email: 'cuong.lv@fpt.edu.vn', role: 'Student', isActive: true },
  { id: '4', fullName: 'Phạm Minh Đức', email: 'duc.pm@fpt.edu.vn', role: 'Student', isActive: true },
  { id: '5', fullName: 'Hoàng Thị Em', email: 'em.ht@fpt.edu.vn', role: 'ClubManager', isActive: false },
  { id: '6', fullName: 'Vũ Quốc Phong', email: 'phong.vq@fpt.edu.vn', role: 'Advisor', isActive: true },
  { id: '7', fullName: 'Đặng Thị Giang', email: 'giang.dt@fpt.edu.vn', role: 'Student', isActive: true },
  { id: '8', fullName: 'Ngô Minh Hải', email: 'hai.nm@fpt.edu.vn', role: 'Student', isActive: true },
];

const roleIcons: Record<string, React.ReactNode> = {
  Admin: <Shield size={14} className="text-red-500" />,
  Advisor: <Shield size={14} className="text-violet-500" />,
  ClubManager: <UserCog size={14} className="text-indigo-500" />,
  Student: <GraduationCap size={14} className="text-emerald-500" />,
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [users, setUsers] = useState(mockUsers);

  const toggleActive = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const changeRole = (id: string, role: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  };

  const filtered = users.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} tài khoản trong hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm người dùng..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-52" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Tất cả vai trò</option>
            {['Admin', 'Advisor', 'ClubManager', 'Student'].map(r => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {['Admin', 'Advisor', 'ClubManager', 'Student'].map(role => (
          <div key={role} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">{roleIcons[role]}</div>
            <div>
              <p className="text-xs text-slate-400">{getRoleLabel(role)}</p>
              <p className="text-xl font-bold text-slate-700">{users.filter(u => u.role === role).length}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{u.fullName}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className="text-sm text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {['Admin', 'Advisor', 'ClubManager', 'Student'].map(r => (
                        <option key={r} value={r}>{getRoleLabel(r)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>
                      {u.isActive ? 'Hoạt động' : 'Vô hiệu'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button onClick={() => toggleActive(u.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all
                          ${u.isActive
                            ? 'text-red-500 bg-red-50 hover:bg-red-100'
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}>
                        {u.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
