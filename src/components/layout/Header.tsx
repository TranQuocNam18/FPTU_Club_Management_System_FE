import { type RefObject } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { IconButton } from '../ui/IconButton';
import { Breadcrumb } from './Breadcrumb';
import { getPageTitle } from './routeMeta';
import { NotificationMenu } from './NotificationMenu';
import { UserMenu } from './UserMenu';
import type { User } from '../../types';

interface HeaderProps {
  user: User;
  menuTriggerRef: RefObject<HTMLButtonElement | null>;
  onOpenMenu: () => void;
  onLogout: () => void;
}

export function Header({ user, menuTriggerRef, onOpenMenu, onLogout }: HeaderProps) {
  const { pathname } = useLocation();
  return (
    <header className="app-header">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <IconButton ref={menuTriggerRef} label="Mở menu" onClick={onOpenMenu} className="lg:hidden">
          <Menu size={21} aria-hidden="true" />
        </IconButton>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white sm:text-base">{getPageTitle(pathname)}</p>
          <Breadcrumb />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <NotificationMenu />
        <span className="h-7 w-px bg-[var(--color-border)]" aria-hidden="true" />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
