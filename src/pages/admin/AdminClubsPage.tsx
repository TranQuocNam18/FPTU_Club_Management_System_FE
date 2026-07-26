import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, ExternalLink, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import {
  ClubEmptyState,
  ClubErrorState,
  ClubGridSkeleton,
  ClubLogo,
  ClubStatusBadge,
  ConfirmDialog,
} from '../../components/clubs/ClubPrimitives';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useAuthStore } from '../../stores/authStore';
import type { Club, CreateClubRequest } from '../../types';
import { ClubStatusMap } from '../../types';
import { getApiError } from '../../utils';

interface ClubFormValues {
  name: string;
  description: string;
  logoUrl: string;
  status: string;
}

export default function AdminClubsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Club | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Club | null>(null);
  const scopeRef = useGsapReveal<HTMLDivElement>({ animationKey: 'admin-clubs' });
  const form = useForm<ClubFormValues>();
  const isAdmin = user?.role === 'StudentAffairsAdmin';

  const clubsQuery = useQuery({
    queryKey: ['clubs'],
    queryFn: clubApi.getAll,
    enabled: isAdmin,
  });
  const clubs = clubsQuery.data?.data.data ?? [];

  const invalidateClubs = () => queryClient.invalidateQueries({ queryKey: ['clubs'] });
  const createMutation = useMutation({
    mutationFn: (values: ClubFormValues) => clubApi.create(toClubPayload(values)),
    onSuccess: async () => {
      toast.success('Tạo câu lạc bộ thành công.');
      closeForm();
      await invalidateClubs();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể tạo câu lạc bộ.')),
  });
  const updateMutation = useMutation({
    mutationFn: async (values: ClubFormValues) => {
      if (!editTarget) return;
      await clubApi.update(editTarget.id, toClubPayload(values));
      const nextStatus = Number(values.status);
      const currentStatus = normalizeStatusNumber(editTarget.status);
      if (nextStatus !== currentStatus) await clubApi.review(editTarget.id, nextStatus);
    },
    onSuccess: async () => {
      toast.success('Cập nhật câu lạc bộ thành công.');
      closeForm();
      await invalidateClubs();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể cập nhật câu lạc bộ.')),
  });
  const reviewMutation = useMutation({
    mutationFn: ({ clubId, status }: { clubId: string; status: number }) => clubApi.review(clubId, status),
    onSuccess: async () => { toast.success('Đã cập nhật trạng thái câu lạc bộ.'); await invalidateClubs(); },
    onError: (error) => toast.error(getApiError(error, 'Không thể cập nhật trạng thái.')),
  });
  const deleteMutation = useMutation({
    mutationFn: (clubId: string) => clubApi.delete(clubId),
    onSuccess: async () => {
      toast.success('Đã thực hiện xóa mềm câu lạc bộ.');
      setDeleteTarget(null);
      await invalidateClubs();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể xóa câu lạc bộ.')),
  });

  function closeForm() {
    setFormMode(null);
    setEditTarget(null);
    form.reset();
  }

  function openEdit(club: Club) {
    setEditTarget(club);
    form.reset({
      name: club.name,
      description: club.description,
      logoUrl: club.logoUrl ?? '',
      status: String(normalizeStatusNumber(club.status)),
    });
    setFormMode('edit');
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div ref={scopeRef} className="admin-clubs-page">
      <header className="clubs-header" data-gsap-item>
        <div>
          <p className="clubs-eyebrow">Administration</p>
          <h1>Quản lý câu lạc bộ</h1>
          <p>Tạo, cập nhật và kiểm soát trạng thái theo workflow hiện có.</p>
        </div>
        <Link className="clubs-admin-link" to="/admin/club-applications">Duyệt đơn thành lập CLB</Link>
      </header>

      {clubsQuery.isLoading ? <ClubGridSkeleton count={3} /> : clubsQuery.isError ? (
        <ClubErrorState message="Không thể tải danh sách quản trị CLB." onRetry={() => void clubsQuery.refetch()} />
      ) : clubs.length === 0 ? (
        <ClubEmptyState title="Chưa có câu lạc bộ" description="CLB sẽ xuất hiện sau khi Admin duyệt đơn thành lập của sinh viên." />
      ) : (
        <div className="admin-club-list" data-gsap-item>
          {clubs.map((club) => {
            const pending = ClubStatusMap[club.status] === 'PendingApproval';
            return (
              <article key={club.id}>
                <ClubLogo club={club} size="sm" />
                <div className="admin-club-list__identity"><h2>{club.name}</h2><p>{club.description || 'Chưa có mô tả.'}</p></div>
                <ClubStatusBadge status={club.status} />
                <div className="admin-club-list__actions">
                  {pending && (
                    <>
                      <Button size="sm" variant="outline" loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ clubId: club.id, status: 3 })}>Không duyệt</Button>
                      <Button size="sm" loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ clubId: club.id, status: 1 })}>Duyệt</Button>
                    </>
                  )}
                  <Link to={`/clubs/${club.id}`} aria-label={`Xem ${club.name}`}><ExternalLink size={17} aria-hidden="true" /></Link>
                  <button type="button" onClick={() => openEdit(club)} aria-label={`Chỉnh sửa ${club.name}`}><Edit2 size={17} aria-hidden="true" /></button>
                  <button type="button" onClick={() => setDeleteTarget(club)} aria-label={`Xóa ${club.name}`}><Trash2 size={17} aria-hidden="true" /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal isOpen={formMode !== null} onClose={closeForm} title={formMode === 'edit' ? 'Chỉnh sửa câu lạc bộ' : 'Tạo câu lạc bộ'}>
        <form className="club-form" onSubmit={form.handleSubmit((values) => formMode === 'edit' ? updateMutation.mutate(values) : createMutation.mutate(values))}>
          <label>Tên câu lạc bộ<input {...form.register('name', { required: 'Vui lòng nhập tên câu lạc bộ.' })} />{form.formState.errors.name && <span role="alert">{form.formState.errors.name.message}</span>}</label>
          <label>Mô tả<textarea rows={4} {...form.register('description')} /></label>
          <label>URL logo<input type="url" placeholder="https://..." {...form.register('logoUrl')} /></label>
          {formMode === 'edit' && (
            <label>Trạng thái<select {...form.register('status')}>
              <option value="0">Chờ duyệt</option><option value="1">Hoạt động</option><option value="2">Tạm dừng</option><option value="3">Không hoạt động</option>
            </select></label>
          )}
          <div><Button type="button" variant="outline" onClick={closeForm}>Hủy</Button><Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>Lưu câu lạc bộ</Button></div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa câu lạc bộ"
        description={`Thao tác này gọi endpoint xóa mềm hiện có cho ${deleteTarget?.name ?? 'câu lạc bộ này'}.`}
        confirmLabel="Xác nhận xóa"
        pending={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}

function toClubPayload(values: ClubFormValues): CreateClubRequest {
  const logoUrl = values.logoUrl.trim();
  return { name: values.name.trim(), description: values.description.trim(), logoUrl: logoUrl || null };
}

function normalizeStatusNumber(status: Club['status']) {
  if (typeof status === 'number') return status;
  const mapping: Record<string, number> = { PendingApproval: 0, Active: 1, Suspended: 2, Inactive: 3 };
  return mapping[status] ?? 0;
}
