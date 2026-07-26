import { useLayoutEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Banknote,
  Bell,
  Building2,
  Calendar,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { clubApi } from '../../api/club.api';
import { cn, getRoleLabel } from '../../utils';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';
import { Tooltip } from '../ui/Tooltip';
import { gsap } from '../../lib/gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles?: string[];
  capability?: 'leader' | 'treasurer';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard size={19} /> },
      { label: 'Thông báo', to: '/notifications', icon: <Bell size={19} /> },
    ],
  },
  {
    label: 'Quản lý câu lạc bộ',
    items: [
      { label: 'Câu lạc bộ', to: '/clubs', icon: <Building2 size={19} /> },
      { label: 'Đăng ký thành lập CLB', to: '/club-applications', icon: <ClipboardList size={19} />, roles: ['Student'] },
      { label: 'Lịch hoạt động', to: '/events', icon: <Calendar size={19} /> },
      { label: 'KPI & Semester', to: '/kpi', icon: <Trophy size={19} /> },
    ],
  },
  {
    label: 'Báo cáo & tài chính',
    items: [
      {
        label: 'Báo cáo',
        to: '/reports',
        icon: <ClipboardList size={19} />,
        capability: 'leader',
      },
      {
        label: 'Tài chính',
        to: '/finance',
        icon: <Banknote size={19} />,
        capability: 'treasurer',
      },
    ],
  },
];

const adminGroup: NavGroup = {
  label: 'Quản trị',
  items: [
    { label: 'Quản lý người dùng', to: '/admin/users', icon: <Users size={19} /> },
    { label: 'Quản lý CLB', to: '/admin/clubs', icon: <Building2 size={19} /> },
    { label: 'Duyệt đơn thành lập CLB', to: '/admin/club-applications', icon: <ShieldCheck size={19} /> },
    { label: 'Duyệt báo cáo', to: '/admin/reports', icon: <ClipboardList size={19} /> },
  ],
};

interface SidebarProps {
  collapsed?: boolean;
  mobile?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  onLogout: () => void;
}

export function Sidebar({
  collapsed = false,
  mobile = false,
  onToggle,
  onNavigate,
  onLogout,
}: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'StudentAffairsAdmin';
  const scopeRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const membershipsQuery = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: () => clubApi.getMyMemberships(),
    enabled: Boolean(user),
  });
  const memberships = membershipsQuery.data?.data.data ?? [];
  const hasLeaderRole = memberships.some(
    (membership) => Number(membership.role) === 2 && Number(membership.status) === 1,
  );
  const hasTreasurerRole = memberships.some(
    (membership) => Number(membership.role) === 3 && Number(membership.status) === 1,
  );

  const visibleGroups = [
    ...navigationGroups.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.roles || !user || item.roles.includes(user.role)) &&
          (!item.capability ||
            isAdmin ||
            (item.capability === 'leader' ? hasLeaderRole : hasTreasurerRole)),
      ),
    })),
    ...(isAdmin ? [adminGroup] : []),
  ].filter((group) => group.items.length > 0);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const context = gsap.context(() => {
      const groups = scope.querySelectorAll('[data-nav-group]');
      if (reducedMotion) {
        gsap.set([scope, ...groups], { autoAlpha: 1, x: 0 });
        return;
      }
      gsap.fromTo(scope, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.38, ease: 'power2.out' });
      gsap.fromTo(
        groups,
        { autoAlpha: 0, x: -5 },
        { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out', delay: 0.05 },
      );
    }, scope);
    return () => context.revert();
  }, [reducedMotion]);

  return (
    <aside
      ref={scopeRef}
      className={cn(
        'app-sidebar',
        collapsed && !mobile ? 'app-sidebar--collapsed' : 'app-sidebar--expanded',
        mobile && 'h-full w-full',
      )}
      aria-label="Điều hướng chính"
    >
      <div className="app-sidebar__brand">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-indigo-300/20 bg-indigo-400/15 text-indigo-200">
          <ShieldCheck size={22} aria-hidden="true" />
        </div>
        {(!collapsed || mobile) && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight text-white">FPTU Club Report</p>
            <p className="truncate text-xs text-[var(--color-text-subtle)]">Management System</p>
          </div>
        )}
        {!mobile && (
          <IconButton
            label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            size="sm"
            onClick={onToggle}
            className={cn('ml-auto', collapsed && 'absolute -right-4 top-5 border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-lg')}
          >
            {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </IconButton>
        )}
      </div>

      <nav className="app-sidebar__nav">
        {visibleGroups.map((group) => (
          <section key={group.label} data-nav-group>
            {(!collapsed || mobile) && <h2 className="app-sidebar__group-label">{group.label}</h2>}
            <div className="grid gap-1">
              {group.items.map((item) => {
                const link = (
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    aria-label={collapsed && !mobile ? item.label : undefined}
                    className={({ isActive }) => cn('app-nav-item', isActive && 'app-nav-item--active')}
                  >
                    <span className="app-nav-item__icon">{item.icon}</span>
                    {(!collapsed || mobile) && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                    {(!collapsed || mobile) && <ChevronRight size={15} className="app-nav-item__chevron" aria-hidden="true" />}
                  </NavLink>
                );
                return (
                  <Tooltip key={item.to} label={item.label} disabled={!collapsed || mobile}>
                    {link}
                  </Tooltip>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      {user && (
        <div className="app-sidebar__footer">
          <div className={cn('flex min-w-0 items-center gap-3', collapsed && !mobile && 'justify-center')}>
            <Avatar name={user.fullName} />
            {(!collapsed || mobile) && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
                <p className="truncate text-xs text-[var(--color-text-subtle)]">{getRoleLabel(user.role)}</p>
              </div>
            )}
          </div>
          {collapsed && !mobile ? (
            <Tooltip label="Đăng xuất">
              <IconButton label="Đăng xuất" onClick={onLogout} className="mx-auto text-rose-300 hover:bg-rose-400/10 hover:text-rose-200">
                <LogOut size={18} aria-hidden="true" />
              </IconButton>
            </Tooltip>
          ) : (
            <button type="button" onClick={onLogout} className="app-sidebar__logout">
              <LogOut size={18} aria-hidden="true" />
              Đăng xuất
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
