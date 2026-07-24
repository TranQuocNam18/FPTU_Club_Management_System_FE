import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, ClipboardList, Inbox, Trash2 } from 'lucide-react';
import { formatDateTime, cn } from '../../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api/notification.api';
import toast from 'react-hot-toast';

const typeConfig = {
  Success: { icon: <CheckCircle size={20} />, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  Info: { icon: <Info size={20} />, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  Warning: { icon: <AlertTriangle size={20} />, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  Error: { icon: <XCircle size={20} />, bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
  ReportSubmitted: { icon: <ClipboardList size={20} />, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  SystemAlert: { icon: <Bell size={20} />, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: res, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationApi.getMyNotifications(filter === 'unread' ? { isRead: false } : undefined),
  });

  const { data: unreadRes } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
  });

  const notifications = res?.data?.data ?? [];
  const unreadCount = (unreadRes?.data?.data as any)?.unreadCount ?? notifications.filter((n: any) => !n.isRead).length;

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
      toast.success('All notifications marked as read.');
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      toast.success('Notification removed.');
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Bell size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-600 px-2 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All notifications are read'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-2xl bg-slate-100 p-1">
              {([['all', 'All'], ['unread', 'Unread']] as const).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                    filter === v
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">Loading notifications...</p>
        </section>
      ) : notifications.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Inbox size={30} />
          </div>
          <p className="text-base font-semibold text-slate-700">No notifications</p>
          <p className="mt-1 text-sm text-slate-500">New updates will appear here.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {notifications.map((n: any) => {
              const config = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.Info;
              return (
                <div
                  key={n.id}
                  className={cn(
                    'group flex w-full items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50',
                    !n.isRead && 'bg-indigo-50/30'
                  )}
                >
                  <div
                    onClick={() => {
                      if (!n.isRead) markReadMutation.mutate(n.id);
                      if (n.targetUrl) navigate(n.targetUrl);
                    }}
                    className="flex flex-1 items-start gap-4 cursor-pointer min-w-0"
                  >
                    <span className={cn('mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border', config.bg, config.text, config.border)}>
                      {config.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-4">
                        <span className={cn('block text-sm font-bold leading-6', n.isRead ? 'text-slate-600' : 'text-slate-900')}>
                          {n.title}
                        </span>
                        <span className="flex flex-shrink-0 items-center gap-2">
                          {!n.isRead && <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />}
                          <span className="text-xs font-medium text-slate-400">{formatDateTime(n.createdAt)}</span>
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-slate-500">
                        {n.message}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      title="Delete notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(n.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
