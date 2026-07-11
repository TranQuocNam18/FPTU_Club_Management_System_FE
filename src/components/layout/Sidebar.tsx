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
  { label: 'Cau lac bo', to: '/clubs', icon: <Building2 size={18} /> },
  { label: 'Lich hoat dong', to: '/events', icon: <Calendar size={18} /> },
  { label: 'Bao cao', to: '/reports', icon: <ClipboardList size={18} />, roles: ['ClubManager', 'Admin', 'Advisor'] },
  { label: 'Ngan sach', to: '/finance', icon: <DollarSign size={18} />, roles: ['ClubManager', 'Admin', 'Advisor'] },
  { label: 'Bang xep hang KPI', to: '/kpi', icon: <Trophy size={18} /> },
  { label: 'Thong bao', to: '/notifications', icon: <Bell size={18} /> },
];

const adminItems: NavItem[] = [
  { label: 'Quan ly CLB', to: '/admin/clubs', icon: <Building2 size={18} /> },
  { label: 'Duyet bao cao', to: '/admin/reports', icon: <ClipboardList size={18} /> },
  { label: 'Duyet ngan sach', to: '/admin/finance', icon: <DollarSign size={18} /> },
  { label: 'Cau hinh KPI', to: '/admin/kpi-rules', icon: <Star size={18} /> },
  { label: 'Quan ly nguoi dung', to: '/admin/users', icon: <Users size={18} /> },
  { label: 'Thong bao he thong', to: '/admin/broadcast', icon: <Megaphone size={18} /> },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';

  const { data: notifRes } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationApi.getMyNotifications(), enabled: !!user });
  const unreadCount = notifRes?.data?.data?.filter((n: any) => !n.isRead).length ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  const filteredNav = navItems.filter(item =>
    !item.roles || !user || item.roles.includes(user.role)
  );

  return (
    <>
      {/* Backdrop overlay for mobile screen */}
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden animate-fadeIn w-full h-full border-0 focus:outline-none cursor-pointer"
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col h-screen shadow-2xl flex-shrink-0 transition-all duration-300 border-r border-slate-800/40 z-40",
          "fixed md:relative md:translate-x-0",
          collapsed ? "w-0 -translate-x-full md:w-20 md:translate-x-0" : "w-64 translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("py-5 border-b border-slate-800/60", collapsed ? "px-0 flex justify-center" : "px-6")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield size={20} className="text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fadeIn">
                <h1 className="text-white font-bold text-sm leading-tight tracking-wide">FPTU Club</h1>
                <p className="text-slate-500 text-xs">Report System</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto py-5 space-y-1.5 custom-scrollbar", collapsed ? "px-2" : "px-3")}>
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              onClick={handleLinkClick}
              className={({ isActive }) => cn(
                'flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative',
                collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-slate-800/80 text-white shadow-md border-l-4 border-indigo-500 pl-2'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
              )}
            >
              {item.icon}
              {!collapsed && <span className="flex-1 animate-fadeIn">{item.label}</span>}
              {item.to === '/notifications' && unreadCount > 0 && (
                collapsed ? (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-bounce" />
                ) : (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-500 rounded-full animate-bounce">
                    {unreadCount}
                  </span>
                )
              )}
              {!collapsed && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className={cn("pt-5 pb-2", collapsed ? "flex justify-center" : "px-3")}>
                {collapsed ? (
                  <div className="w-6 h-px bg-slate-800" />
                ) : (
                  <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest animate-fadeIn">Quan tri</p>
                )}
              </div>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  onClick={handleLinkClick}
                  className={({ isActive }) => cn(
                    'flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative',
                    collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-slate-800/80 text-white shadow-md border-l-4 border-violet-500 pl-2'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  )}
                >
                  {item.icon}
                  {!collapsed && <span className="flex-1 animate-fadeIn">{item.label}</span>}
                  {!collapsed && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User Profile & Logout at Bottom */}
        <div className="mt-auto border-t border-slate-800/60 p-4 space-y-3 bg-slate-950/40">
          {/* User profile card */}
          <div className={cn("flex items-center rounded-xl bg-slate-900/40 border border-slate-800/50", collapsed ? "p-1.5 justify-center" : "px-3 py-2.5 gap-3")}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-inner">
              {user?.fullName?.charAt(0) ?? 'U'}
            </div>
            {!collapsed && (
              <div className="min-w-0 animate-fadeIn flex-1">
                <p className="text-white text-sm font-semibold truncate leading-snug">{user?.fullName ?? 'User'}</p>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{getRoleLabel(user?.role ?? '')}</p>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title={collapsed ? "Dang xuat" : undefined}
            className={cn(
              "w-full flex items-center rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150",
              collapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
            )}
          >
            <LogOut size={18} className="transition-transform group-hover:scale-110" />
            {!collapsed && <span>Dang xuat</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
