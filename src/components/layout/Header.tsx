import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronRight, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api/notification.api';
import { Avatar } from '../ui/Avatar';
import { getRoleLabel, formatDateTime } from '../../utils';

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Header({ collapsed, setCollapsed }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Unread count query
  const { data: unreadRes } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: !!user,
    staleTime: 10000,
  });

  // Recent notifications query for dropdown
  const { data: notifRes } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getMyNotifications({ page: 1, pageSize: 5 }),
    enabled: !!user && showNotifDropdown,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const unreadCount = (unreadRes?.data?.data as any)?.unreadCount ?? 0;
  const recentNotifications = notifRes?.data?.data ?? [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbMap: Record<string, string> = {
    dashboard: 'Dashboard',
    clubs: 'Clubs',
    events: 'Events',
    reports: 'Reports',
    finance: 'Finance',
    kpi: 'KPI Leaderboard',
    notifications: 'Notifications',
    admin: 'Administration',
    users: 'Users',
    broadcast: 'Broadcasts',
    'kpi-rules': 'KPI Rules',
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
        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            className="relative p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border border-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifDropdown(false)} />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-40 animate-fadeIn overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <CheckCheck size={14} />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {recentNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                  ) : (
                    recentNotifications.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) markReadMutation.mutate(n.id);
                          setShowNotifDropdown(false);
                          if (n.targetUrl) navigate(n.targetUrl);
                        }}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <Avatar name={user?.fullName || 'User'} size="sm" />
            <div className="hidden md:flex flex-col items-start leading-none text-left">
              <span className="text-sm font-medium text-slate-700">{user?.fullName || 'User'}</span>
              <span className="text-[10px] font-medium text-slate-400 mt-0.5">{getRoleLabel(user?.role || '')}</span>
            </div>
          </button>

          {showProfileDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProfileDropdown(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-lg py-2 z-40 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-xs text-slate-400">Account</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
