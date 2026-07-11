import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, LogOut, User as UserIcon, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../api/notification.api';
import { Avatar } from '../ui/Avatar';
import { getRoleLabel } from '../../utils';

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Header({ collapsed, setCollapsed }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: notifRes } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationApi.getMyNotifications(), enabled: !!user });
  const unreadCount = notifRes?.data?.data?.filter((n: any) => !n.isRead).length ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Simple breadcrumb generation
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbMap: Record<string, string> = {
    dashboard: 'Dashboard',
    clubs: 'Cau lac bo',
    events: 'Su kien',
    reports: 'Bao cao',
    finance: 'Ngan sach',
    kpi: 'KPI Leaderboard',
    notifications: 'Thong bao',
    admin: 'Quan tri',
    users: 'Nguoi dung',
    broadcast: 'Thong bao he thong',
    'kpi-rules': 'Cau hinh KPI',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-20 flex-shrink-0">
      {/* Left: Toggle & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors focus:outline-none"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-400">
          <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">
            FCRS
          </Link>
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const label = breadcrumbMap[value] || value;

            return (
              <React.Fragment key={to}>
                <ChevronRight size={14} className="text-slate-300" />
                {last ? (
                  <span className="text-slate-700 font-semibold">{label}</span>
                ) : (
                  <Link to={to} className="hover:text-indigo-600 transition-colors">
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border border-white">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <Avatar name={user?.fullName || 'User'} size="sm" />
            <div className="hidden md:flex flex-col items-start leading-none text-left">
              <span className="text-sm font-medium text-slate-700">{user?.fullName || 'User'}</span>
              <span className="text-[10px] font-medium text-slate-400 mt-0.5">{getRoleLabel(user?.role || '')}</span>
            </div>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-lg py-2 z-40 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs text-slate-400">Tai khoan</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Dang xuat</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
