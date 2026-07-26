import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Radio, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi } from '../../api/notification.api';
import { BroadcastWorkspace } from '../../components/admin/BroadcastWorkspace';
import { NotificationCard, NotificationSkeleton, NotificationState } from '../../components/notifications/NotificationPrimitives';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useAuthStore } from '../../stores/authStore';
import type { Notification } from '../../types';
import { getApiError } from '../../utils';
import { subscribeRealtimeState, type RealtimeState } from '../../utils/signalr';

type Filter = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const scope = useGsapReveal<HTMLDivElement>();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState<Filter>('all');
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [realtimeState, setRealtimeState] = useState<RealtimeState>('disconnected');
  useEffect(() => subscribeRealtimeState(setRealtimeState), []);
  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => notificationApi.getMyNotifications(),
    enabled: Boolean(user?.id),
  });
  const notifications = query.data?.data.data ?? [];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const filtered = notifications.filter((notification) => filter === 'all' || (filter === 'read' ? notification.isRead : !notification.isRead));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: invalidate,
    onError: (error) => toast.error(getApiError(error, 'Không thể đánh dấu đã đọc.')),
  });
  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: async () => { toast.success('Đã đánh dấu đọc tất cả.'); await invalidate(); },
    onError: (error) => toast.error(getApiError(error, 'Không thể đánh dấu đọc tất cả.')),
  });
  const deleteMutation = useMutation({
    mutationFn: notificationApi.delete,
    onSuccess: async () => { toast.success('Đã xóa thông báo.'); setDeleteTarget(null); await invalidate(); },
    onError: (error) => toast.error(getApiError(error, 'Không thể xóa thông báo.')),
  });

  return (
    <div ref={scope} className="notifications-page">
      <header className="notifications-header" data-gsap-item>
        <div><p className="notifications-eyebrow">Notification center</p><h1>Thông báo</h1><p><strong>{unreadCount}</strong> thông báo chưa đọc từ dữ liệu REST hiện tại.</p></div>
        <div className="notifications-header__actions">
          <span className={`realtime-indicator is-${realtimeState}`}><Radio size={14} />Realtime: {realtimeState}</span>
          {unreadCount > 0 && <Button variant="outline" icon={<CheckCheck size={16} />} loading={markAllMutation.isPending} onClick={() => markAllMutation.mutate()}>Đánh dấu đọc tất cả</Button>}
        </div>
      </header>

      {user?.role === 'StudentAffairsAdmin' && <BroadcastWorkspace />}

      <nav className="notification-filters" aria-label="Lọc thông báo" data-gsap-item>
        {([['all', `Tất cả (${notifications.length})`], ['unread', `Chưa đọc (${unreadCount})`], ['read', 'Đã đọc']] as const).map(([value, label]) => <button key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{label}</button>)}
      </nav>

      {query.isLoading ? <NotificationSkeleton /> : query.isError ? <NotificationState error onRetry={() => query.refetch()} /> : filtered.length === 0 ? <NotificationState /> : (
        <ul className="notification-list" aria-label="Danh sách thông báo">{filtered.map((notification) => <NotificationCard key={notification.id} notification={notification} onRead={() => markReadMutation.mutate(notification.id)} onDelete={() => setDeleteTarget(notification)} />)}</ul>
      )}

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => !deleteMutation.isPending && setDeleteTarget(null)} title="Xóa thông báo">
        {deleteTarget && <div className="notification-confirm"><Trash2 size={26} /><h2>Xóa “{deleteTarget.title}”?</h2><p>Thông báo sẽ bị xóa khỏi tài khoản sau khi server xác nhận.</p><div><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Giữ lại</Button><Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)}>Xóa thông báo</Button></div></div>}
      </Modal>
    </div>
  );
}
