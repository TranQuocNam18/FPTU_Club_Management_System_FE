import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Eye, Search, Shield, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '../../api/user.api';
import { useAuthStore } from '../../stores/authStore';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { getApiError, getRoleLabel } from '../../utils';
import type { User } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  AccountStatusBadge,
  AdminEmptyState,
  AdminErrorState,
  AdminSkeleton,
  EmailVerificationBadge,
  UserCard,
  UserIdentity,
  UserRoleBadge,
} from '../../components/admin/AdminPrimitives';

type Role = User['role'];
type PendingChange = { user: User; kind: 'role'; role: Role } | { user: User; kind: 'status' };
const PAGE_SIZE = 10;
const roles: Role[] = ['StudentAffairsAdmin', 'ClubManager', 'Student'];

function numberMeta(meta: Record<string, unknown> | null | undefined, key: string, fallback: number) {
  return typeof meta?.[key] === 'number' ? meta[key] as number : fallback;
}

export default function AdminUsersPage() {
  const scope = useGsapReveal<HTMLDivElement>();
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());

  const usersQuery = useQuery({
    queryKey: ['users', { search: debouncedSearch, role, status, page, pageSize: PAGE_SIZE }],
    queryFn: () => userApi.getAll({
      search: debouncedSearch || undefined,
      role: role || undefined,
      isActive: status ? status === 'active' : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  });

  const mutation = useMutation({
    mutationFn: async (change: PendingChange) => {
      if (change.kind === 'role') {
        await userApi.updateRole(change.user.id, change.role);
      } else {
        await userApi.updateStatus(change.user.id, !change.user.isActive);
      }
    },
    onSuccess: (_, change) => {
      toast.success(change.kind === 'role' ? 'Đã cập nhật vai trò.' : 'Đã cập nhật trạng thái tài khoản.');
      setPendingChange(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(getApiError(error)),
  });

  const response = usersQuery.data?.data;
  const users = response?.data ?? [];
  const total = numberMeta(response?.meta, 'total', users.length);
  const totalPages = Math.max(1, numberMeta(response?.meta, 'totalPages', Math.ceil(total / PAGE_SIZE)));

  return (
    <div ref={scope} className="admin-users-page">
      <header className="admin-page-heading" data-gsap-item>
        <div>
          <p className="admin-eyebrow">Administration</p>
          <h1>Quản lý người dùng</h1>
          <p>Kiểm tra tài khoản, vai trò và trạng thái bằng các thao tác có xác nhận.</p>
        </div>
        <div className="admin-total"><strong>{total}</strong><span>tài khoản</span></div>
      </header>

      <section className="admin-user-filters" aria-label="Bộ lọc người dùng" data-gsap-item>
        <label className="admin-search">
          <span className="sr-only">Tìm người dùng</span>
          <Search size={17} />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm theo tên hoặc email" />
        </label>
        <label>
          <span className="sr-only">Lọc vai trò</span>
          <select className="input-field" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}>
            <option value="">Tất cả vai trò</option>
            {roles.map((item) => <option key={item} value={item}>{getRoleLabel(item)}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Lọc trạng thái</span>
          <select className="input-field" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã vô hiệu hóa</option>
          </select>
        </label>
      </section>

      {usersQuery.isLoading ? <AdminSkeleton /> : usersQuery.isError ? (
        <AdminErrorState onRetry={() => usersQuery.refetch()} />
      ) : users.length === 0 ? (
        <AdminEmptyState title="Không tìm thấy người dùng" description="Thử thay đổi từ khóa hoặc bộ lọc hiện tại." />
      ) : (
        <div className="admin-user-grid">
          {users.map((user) => {
            const self = user.id === currentUser?.id;
            return (
              <UserCard key={user.id}>
                <div className="admin-card-top">
                  <UserIdentity user={user} />
                  {self && <span className="admin-self-label">Bạn (You)</span>}
                </div>
                <div className="admin-card-meta">
                  <UserRoleBadge role={user.role} />
                  <AccountStatusBadge active={user.isActive} />
                </div>
                <EmailVerificationBadge verified={user.isEmailVerified} />
                <div className="admin-card-actions">
                  <Button variant="ghost" size="sm" icon={<Eye size={15} />} onClick={() => setSelectedUser(user)}>Chi tiết</Button>
                  <Button variant="outline" size="sm" icon={<UserCog size={15} />} disabled={self} onClick={() => setPendingChange({ user, kind: 'role', role: user.role })}>Vai trò</Button>
                  <Button variant={user.isActive ? 'ghost' : 'outline'} size="sm" disabled={self} onClick={() => setPendingChange({ user, kind: 'status' })}>
                    {user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  </Button>
                </div>
              </UserCard>
            );
          })}
        </div>
      )}

      {!usersQuery.isLoading && totalPages > 1 && (
        <nav className="admin-pagination" aria-label="Phân trang người dùng">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button>
          <span>Trang <strong>{page}</strong> / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau <ChevronRight size={16} /></Button>
        </nav>
      )}

      <Modal isOpen={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} title="Chi tiết người dùng">
        {selectedUser && <div className="admin-user-detail">
          <UserIdentity user={selectedUser} />
          <dl>
            <div><dt>Vai trò</dt><dd><UserRoleBadge role={selectedUser.role} /></dd></div>
            <div><dt>Trạng thái</dt><dd><AccountStatusBadge active={selectedUser.isActive} /></dd></div>
            <div><dt>Xác minh</dt><dd><EmailVerificationBadge verified={selectedUser.isEmailVerified} /></dd></div>
            <div><dt>User ID</dt><dd className="admin-mono">{selectedUser.id}</dd></div>
          </dl>
        </div>}
      </Modal>

      <Modal isOpen={Boolean(pendingChange)} onClose={() => !mutation.isPending && setPendingChange(null)} title={pendingChange?.kind === 'role' ? 'Thay đổi vai trò' : 'Xác nhận trạng thái'}>
        {pendingChange && <div className="admin-confirm">
          <div className="admin-warning"><Shield size={20} /><p>Thay đổi này ảnh hưởng đến quyền truy cập của <strong>{pendingChange.user.fullName}</strong>.</p></div>
          {pendingChange.kind === 'role' ? (
            <label>Vai trò mới
              <select className="input-field" value={pendingChange.role} onChange={(event) => setPendingChange({ ...pendingChange, role: event.target.value as Role })}>
                {roles.map((item) => <option key={item} value={item}>{getRoleLabel(item)}</option>)}
              </select>
            </label>
          ) : <p>Tài khoản sẽ được <strong>{pendingChange.user.isActive ? 'vô hiệu hóa' : 'kích hoạt'}</strong> sau khi xác nhận.</p>}
          <div className="admin-dialog-actions">
            <Button variant="ghost" onClick={() => setPendingChange(null)} disabled={mutation.isPending}>Hủy</Button>
            <Button
              variant={pendingChange.kind === 'status' && pendingChange.user.isActive ? 'danger' : 'primary'}
              loading={mutation.isPending}
              disabled={pendingChange.kind === 'role' && pendingChange.role === pendingChange.user.role}
              onClick={() => mutation.mutate(pendingChange)}
            >
              Xác nhận thay đổi
            </Button>
          </div>
        </div>}
      </Modal>
    </div>
  );
}
