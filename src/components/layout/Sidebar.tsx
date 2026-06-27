import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, DollarSign, Trophy,
  Bell, Settings, LogOut, ChevronRight, Shield, Calendar,
  ClipboardList, Building2, Megaphone, Star
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn, getRoleLabel } from '../../utils';

import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../api/notification.api';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Câu lạc bộ', to: '/clubs', icon: <Building2 size={18} /> },
  { label: 'Lịch hoạt động', to: '/events', icon: <Calendar size={18} /> },
  { label: 'Báo cáo', to: '/reports', icon: <ClipboardList size={18} />, roles: ['ClubManager', 'Admin', 'Advisor'] },
  { label: 'Ngân sách', to: '/finance', icon: <DollarSign size={18} />, roles: ['ClubManager', 'Admin', 'Advisor'] },
  { label: 'Bảng xếp hạng KPI', to: '/kpi', icon: <Trophy size={18} /> },
  { label: 'Thông báo', to: '/notifications', icon: <Bell size={18} /> },
];

const adminItems: NavItem[] = [
  { label: 'Quản lý CLB', to: '/admin/clubs', icon: <Building2 size={18} /> },
  { label: 'Duyệt báo cáo', to: '/admin/reports', icon: <ClipboardList size={18} /> },
  { label: 'Duyệt ngân sách', to: '/admin/finance', icon: <DollarSign size={18} /> },
  { label: 'Cấu hình KPI', to: '/admin/kpi-rules', icon: <Star size={18} /> },
  { label: 'Quản lý người dùng', to: '/admin/users', icon: <Users size={18} /> },
  { label: 'Thông báo hệ thống', to: '/admin/broadcast', icon: <Megaphone size={18} /> },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';

  const { data: notifRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getMyNotifications(),
    enabled: !!user,
  });

  const unreadCount = notifRes?.data?.data?.filter((n: any) => !n.isRead).length ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(item =>
    !item.roles || !user || item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col h-screen shadow-2xl flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">FPTU Club</h1>
            <p className="text-slate-400 text-xs">Report System</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-700/40">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.fullName ?? 'User'}</p>
            <p className="text-slate-400 text-xs">{getRoleLabel(user?.role ?? '')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
            )}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.to === '/notifications' && unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-bounce">
                {unreadCount}
              </span>
            )}
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Quản trị</p>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
