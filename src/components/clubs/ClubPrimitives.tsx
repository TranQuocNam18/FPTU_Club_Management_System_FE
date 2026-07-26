import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Building2, CalendarDays, RotateCcw } from 'lucide-react';
import type { Club, ClubMember } from '../../types';
import { ClubRoleLabel, ClubStatusLabel, ClubStatusMap, MembershipStatusMap } from '../../types';
import { cn, formatDate } from '../../utils';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';

export function ClubLogo({ club, size = 'md' }: { club: Club; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'size-10 text-sm', md: 'size-14 text-lg', lg: 'size-20 text-2xl' };
  return (
    <div className={cn('club-logo', sizes[size])}>
      {club.logoUrl ? <img src={club.logoUrl} alt={`Logo ${club.name}`} /> : <span aria-hidden="true">{club.name.charAt(0).toUpperCase()}</span>}
    </div>
  );
}

export function ClubStatusBadge({ status }: { status: Club['status'] }) {
  const canonical = ClubStatusMap[status] ?? String(status);
  return <span className={cn('club-status', `club-status--${canonical.toLowerCase()}`)}>{ClubStatusLabel[status] ?? canonical}</span>;
}

export function MembershipStatusBadge({ member }: { member: ClubMember }) {
  const status = MembershipStatusMap[member.status] ?? String(member.status);
  const labels: Record<string, string> = {
    Pending: 'Đang chờ duyệt',
    Approved: ClubRoleLabel[member.role] ?? 'Thành viên',
    Rejected: 'Đã bị từ chối',
    Left: 'Đã rời CLB',
  };
  return <span className={cn('membership-status', `membership-status--${status.toLowerCase()}`)}>{labels[status] ?? status}</span>;
}

export function ClubCard({
  club,
  membership,
  joinAction,
}: {
  club: Club;
  membership?: ClubMember;
  joinAction?: ReactNode;
}) {
  return (
    <article className="club-card" data-gsap-item>
      <div className="club-card__top">
        <ClubLogo club={club} />
        <ClubStatusBadge status={club.status} />
      </div>
      <div className="club-card__content">
        <div>
          <h2>{club.name}</h2>
          {club.category && <p className="club-card__category">{club.category}</p>}
        </div>
        <p className="club-card__description">{club.description || 'CLB chưa cập nhật mô tả.'}</p>
        {club.establishedDate && <p className="club-card__meta"><CalendarDays size={14} aria-hidden="true" />Thành lập {formatDate(club.establishedDate)}</p>}
        {membership && <MembershipStatusBadge member={membership} />}
      </div>
      <div className="club-card__actions">
        <Link to={`/clubs/${club.id}`}>Xem câu lạc bộ <ArrowRight size={15} aria-hidden="true" /></Link>
        {joinAction}
      </div>
    </article>
  );
}

export function ClubGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="clubs-grid" role="status" aria-label="Đang tải danh sách câu lạc bộ">
      {Array.from({ length: count }, (_, index) => (
        <div className="club-card" key={index}>
          <div className="club-card__top"><Skeleton className="size-14 bg-slate-200" /><Skeleton className="h-6 w-20 bg-slate-200" /></div>
          <Skeleton className="mt-6 h-5 w-3/4 bg-slate-200" />
          <Skeleton className="mt-4 h-14 w-full bg-slate-200" />
          <Skeleton className="mt-6 h-11 w-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function ClubSection({
  title,
  description,
  children,
  action,
  busy,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  busy?: boolean;
}) {
  return (
    <section className="club-section" data-gsap-item aria-busy={busy || undefined}>
      <div className="club-section__header">
        <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ClubEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="club-empty">
      <Building2 size={28} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ClubErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="club-error" role="alert">
      <AlertCircle size={24} aria-hidden="true" />
      <div><h3>Không thể tải dữ liệu</h3><p>{message}</p></div>
      <Button variant="outline" size="sm" onClick={onRetry} icon={<RotateCcw size={15} aria-hidden="true" />}>Thử lại</Button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
        <Button type="button" variant="danger" loading={pending} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
