import { useCallback, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api/notification.api';
import { useAuthStore } from '../../stores/authStore';
import { formatDateTime } from '../../utils';
import { IconButton } from '../ui/IconButton';
import { DropdownPanel } from '../ui/DropdownPanel';
import { Skeleton } from '../ui/Skeleton';
import { ErrorState } from '../ui/ErrorState';
import { useDismissableLayer } from '../../hooks/useDismissableLayer';
import type { Notification } from '../../types';

function NotificationPreviewItem({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => !notification.isRead && onRead(notification.id)}
      className={`relative flex w-full gap-3 border-b border-[var(--color-border)] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)] ${
        notification.isRead ? '' : 'bg-indigo-400/[0.07]'
      }`}
    >
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? 'bg-transparent' : 'bg-[var(--color-primary)]'}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--color-text)]">{notification.title}</span>
        <span className="mt-1 line-clamp-2 block text-[13px] leading-5 text-[var(--color-text-muted)]">{notification.message}</span>
        <span className="mt-1.5 block text-xs text-[var(--color-text-subtle)]">{formatDateTime(notification.createdAt)}</span>
      </span>
      {!notification.isRead && <span className="sr-only">Chưa đọc</span>}
    </button>
  );
}

export function NotificationMenu() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismissableLayer(open, close, triggerRef, panelRef);

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationApi.getMyNotifications(),
    enabled: Boolean(user),
  });
  const notifications = query.data?.data?.data ?? [];
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="relative">
      <IconButton
        ref={triggerRef}
        label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold leading-4 text-slate-950"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </IconButton>

      {open && (
        <DropdownPanel
          ref={panelRef}
          role="dialog"
          aria-label="Xem trước thông báo"
          className="notification-popover w-[min(24rem,calc(100vw-2rem))]"
        >
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--color-border)] px-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Thông báo</h2>
              <p className="text-xs text-[var(--color-text-subtle)]" aria-live="polite">{unreadCount} chưa đọc</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="inline-flex min-h-11 items-center gap-1.5 rounded px-2 text-xs font-semibold text-indigo-300 transition-colors hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:opacity-50"
              >
                <CheckCheck size={15} aria-hidden="true" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
            {query.isLoading ? (
              <div className="grid gap-4 p-4" aria-label="Đang tải thông báo">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="grid gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : query.isError ? (
              <ErrorState message="Không thể tải thông báo." onRetry={() => query.refetch()} />
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
                <Bell size={28} className="text-[var(--color-text-subtle)]" aria-hidden="true" />
                <p className="text-sm font-medium text-[var(--color-text-muted)]">Chưa có thông báo</p>
              </div>
            ) : (
              notifications.slice(0, 6).map((notification) => (
                <NotificationPreviewItem
                  key={notification.id}
                  notification={notification}
                  onRead={(id) => markReadMutation.mutate(id)}
                />
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={close}
            className="flex min-h-12 items-center justify-center border-t border-[var(--color-border)] px-4 text-sm font-semibold text-indigo-300 transition-colors hover:bg-white/[0.04] hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)]"
          >
            Xem tất cả thông báo
          </Link>
        </DropdownPanel>
      )}
    </div>
  );
}
