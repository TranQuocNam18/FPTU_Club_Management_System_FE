import React, { useState } from 'react';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import { formatDateTime } from '../../utils';
import { cn } from '../../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api/notification.api';
import toast from 'react-hot-toast';

const typeConfig = {
  Success: { icon: <CheckCircle size={20} />, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  Info: { icon: <Info size={20} />, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  Warning: { icon: <AlertTriangle size={20} />, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  Error: { icon: <XCircle size={20} />, bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
  ReportSubmitted: { icon: <ClipboardList size={20} />, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: res, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getMyNotifications(),
  });
  const notifications = res?.data?.data ?? [];

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('Đã đánh dấu đọc tất cả thông báo!');
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Thông báo
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{unreadCount} thông báo chưa đọc</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">
            <CheckCheck size={16} /> Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-5">
        {([['all', 'Tất cả'], ['unread', 'Chưa đọc']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => {
            const config = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.Info;
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={cn(
                  'bg-white rounded-2xl shadow-sm border p-5 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md',
                  n.isRead ? 'border-slate-100 opacity-75' : `border-l-4 ${config.border}`,
                )}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.text} flex items-center justify-center flex-shrink-0`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${n.isRead ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
