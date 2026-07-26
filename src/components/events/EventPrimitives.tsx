import { CalendarDays, MapPin, TriangleAlert } from 'lucide-react';
import type { ClubEvent } from '../../types';
import { EventStatusLabel } from '../../types';
import { formatDateTime } from '../../utils';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { canonicalEventStatus } from './eventUtils';

export function EventStatusBadge({ event }: { event: ClubEvent }) {
  const status = canonicalEventStatus(event);
  return <span className={`event-status event-status--${status.toLowerCase()}`}>{EventStatusLabel[event.status] ?? status}</span>;
}

export function EventDateTime({ value }: { value: string }) {
  return <time dateTime={value}>{value ? formatDateTime(value) : 'Chưa có thời gian hợp lệ'}</time>;
}

export function EventCard({ event, clubName, onOpen }: { event: ClubEvent; clubName?: string; onOpen: () => void }) {
  return (
    <article className="event-card" data-gsap-item>
      <button type="button" onClick={onOpen} aria-label={`Xem chi tiết ${event.title}`}>
        <div className="event-card__head">
          <div>
            <p>{clubName ?? 'Câu lạc bộ chưa xác định'}</p>
            <h2>{event.title}</h2>
          </div>
          <EventStatusBadge event={event} />
        </div>
        <p className="event-card__description">{event.description || 'Không có mô tả.'}</p>
        <div className="event-card__meta">
          <span><CalendarDays size={15} /><EventDateTime value={event.expectedDate} /></span>
          <span><MapPin size={15} />{event.location || 'Chưa có địa điểm'}</span>
        </div>
      </button>
    </article>
  );
}

export function EventSkeleton() {
  return <div className="event-grid" aria-label="Đang tải sự kiện">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-56 rounded-[var(--radius-lg)]" />)}</div>;
}

export function EventEmptyState({ title = 'Không có sự kiện phù hợp' }: { title?: string }) {
  return <div className="event-state"><CalendarDays size={34} /><h2>{title}</h2><p>Thử thay đổi bộ lọc hoặc quay lại sau.</p></div>;
}

export function EventErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="event-state event-state--error" role="alert"><TriangleAlert size={34} /><h2>Không thể tải sự kiện</h2><p>Dữ liệu thật hiện không khả dụng.</p><Button variant="outline" onClick={onRetry}>Thử lại</Button></div>;
}
