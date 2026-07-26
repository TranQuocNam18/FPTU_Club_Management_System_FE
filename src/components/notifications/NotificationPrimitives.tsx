import { AlertTriangle, Bell, CheckCircle2, ClipboardList, Info, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Notification } from '../../types';
import { formatDateTime } from '../../utils';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

const icons = {
  Success: CheckCircle2,
  Info,
  Warning: AlertTriangle,
  Error: XCircle,
  ReportSubmitted: ClipboardList,
};

export function NotificationTypeIcon({ type }: { type: string | number }) {
  const Icon = icons[String(type) as keyof typeof icons] ?? Bell;
  return <span className="notification-type-icon"><Icon size={18} aria-hidden="true" /></span>;
}

export function NotificationCard({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const safeTarget = notification.targetUrl?.startsWith('/') ? notification.targetUrl : null;
  return (
    <li className={`notification-card ${notification.isRead ? 'is-read' : 'is-unread'}`} data-gsap-item>
      <NotificationTypeIcon type={notification.type} />
      <div className="notification-card__content">
        <div><h2>{notification.title}</h2><span>{notification.isRead ? 'Đã đọc' : 'Chưa đọc'}</span></div>
        <p>{notification.message}</p>
        <time dateTime={notification.createdAt}>{formatDateTime(notification.createdAt)}</time>
      </div>
      <div className="notification-card__actions">
        {!notification.isRead && <Button variant="ghost" size="sm" onClick={onRead}>Đánh dấu đã đọc</Button>}
        {safeTarget && <Link to={safeTarget}>Mở nội dung</Link>}
        <Button variant="ghost" size="sm" onClick={onDelete}>Xóa</Button>
      </div>
    </li>
  );
}

export function NotificationSkeleton() {
  return <div className="notification-list">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-36 rounded-[var(--radius-lg)]" />)}</div>;
}

export function NotificationState({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return <div className={`notification-state ${error ? 'is-error' : ''}`} role={error ? 'alert' : undefined}><Bell size={34} /><h2>{error ? 'Không thể tải thông báo' : 'Không có thông báo phù hợp'}</h2><p>{error ? 'REST notifications hiện không khả dụng.' : 'Thử chọn một bộ lọc khác.'}</p>{error && onRetry && <Button variant="outline" onClick={onRetry}>Thử lại</Button>}</div>;
}
