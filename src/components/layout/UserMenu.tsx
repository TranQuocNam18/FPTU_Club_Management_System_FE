import { useCallback, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { DropdownPanel } from '../ui/DropdownPanel';
import { useDismissableLayer } from '../../hooks/useDismissableLayer';
import { getRoleLabel } from '../../utils';
import type { User } from '../../types';

export function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismissableLayer(open, close, triggerRef, panelRef);

  const handleLogout = () => {
    close();
    onLogout();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Mở menu tài khoản"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 max-w-56 items-center gap-2 rounded-[var(--radius-md)] px-1.5 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
      >
        <Avatar name={user.fullName} size="sm" />
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-semibold text-white">{user.fullName}</span>
          <span className="block truncate text-xs text-[var(--color-text-subtle)]">{getRoleLabel(user.role)}</span>
        </span>
        <ChevronDown size={15} className="hidden shrink-0 text-[var(--color-text-subtle)] sm:block" aria-hidden="true" />
      </button>

      {open && (
        <DropdownPanel ref={panelRef} role="menu" aria-label="Menu tài khoản" className="w-64 p-1.5">
          <div className="border-b border-[var(--color-border)] px-3 py-3 sm:hidden">
            <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
            <p className="truncate text-xs text-[var(--color-text-subtle)]">{getRoleLabel(user.role)}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          >
            <LogOut size={17} aria-hidden="true" />
            Đăng xuất
          </button>
        </DropdownPanel>
      )}
    </div>
  );
}
