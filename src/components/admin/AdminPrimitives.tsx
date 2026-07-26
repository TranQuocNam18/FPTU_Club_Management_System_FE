import type { ReactNode } from 'react';
import { AlertCircle, MailCheck, MailWarning, UserRoundSearch } from 'lucide-react';
import type { User } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

const roleLabels: Record<string, string> = {
  StudentAffairsAdmin: 'Cán bộ Phòng CTSV',
  ClubManager: 'Quản lý CLB',
  Student: 'Sinh viên',
  Admin: 'Admin (legacy)',
  Advisor: 'Advisor (legacy)',
};

export function UserRoleBadge({ role }: { role: string }) {
  const canonical = ['StudentAffairsAdmin', 'ClubManager', 'Student'].includes(role);
  return <span className={`admin-badge admin-role-${canonical ? role : 'legacy'}`}>{roleLabels[role] ?? `${role} (legacy)`}</span>;
}

export function AccountStatusBadge({ active }: { active: boolean }) {
  return <span className={`admin-badge ${active ? 'admin-status-active' : 'admin-status-inactive'}`}>{active ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}</span>;
}

export function EmailVerificationBadge({ verified }: { verified?: boolean }) {
  return (
    <span className={`admin-email-state ${verified ? 'is-verified' : 'is-unverified'}`}>
      {verified ? <MailCheck size={15} /> : <MailWarning size={15} />}
      {verified ? 'Email đã xác minh' : 'Email chưa xác minh'}
    </span>
  );
}

export function UserIdentity({ user }: { user: User }) {
  return (
    <div className="admin-user-identity">
      <Avatar name={user.fullName} />
      <div>
        <strong>{user.fullName}</strong>
        <span>{user.email}</span>
      </div>
    </div>
  );
}

export function UserCard({ children }: { children: ReactNode }) {
  return <article className="admin-user-card" data-gsap-item>{children}</article>;
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="admin-state" data-gsap-item>
      <UserRoundSearch size={34} />
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function AdminErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="admin-state admin-state-error" role="alert">
      <AlertCircle size={34} />
      <h2>Không thể tải danh sách người dùng</h2>
      <p>Vui lòng kiểm tra kết nối và thử lại.</p>
      <Button variant="outline" onClick={onRetry}>Thử lại</Button>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="admin-user-grid" aria-label="Đang tải danh sách người dùng">
      {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-52 rounded-[var(--radius-lg)]" />)}
    </div>
  );
}
