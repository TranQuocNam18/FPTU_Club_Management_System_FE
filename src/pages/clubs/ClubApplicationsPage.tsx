import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clubApplicationApi } from '../../api/club.api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../stores/authStore';
import type { ClubApplicationRequest } from '../../types';
import { getApiError } from '../../utils';

type FormValues = Omit<ClubApplicationRequest, 'evidenceUrls'> & { evidenceUrl: string };

export default function ClubApplicationsPage() {
  const user = useAuthStore((state) => state.user);
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>();
  const isStudent = user?.role === 'Student';
  const query = useQuery({ queryKey: ['club-applications', 'mine'], queryFn: clubApplicationApi.mine, enabled: isStudent });
  const mutation = useMutation({
    mutationFn: (values: FormValues) => clubApplicationApi.create({
      proposedClubName: values.proposedClubName.trim(),
      description: values.description.trim(),
      objectives: values.objectives.trim(),
      evidenceUrls: values.evidenceUrl.trim() ? [values.evidenceUrl.trim()] : [],
    }),
    onSuccess: async () => {
      toast.success('Đã gửi đơn đăng ký thành lập CLB.');
      setOpen(false);
      form.reset();
      await client.invalidateQueries({ queryKey: ['club-applications', 'mine'] });
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể gửi đơn thành lập CLB.')),
  });
  if (!isStudent) return <Navigate to="/clubs" replace />;
  const applications = query.data?.data.data ?? [];

  return (
    <div className="clubs-page">
      <header className="clubs-header">
        <div><p className="clubs-eyebrow">Club establishment</p><h1>Đơn thành lập câu lạc bộ</h1>
          <p>Sinh viên đề xuất CLB; Student Affairs Admin sẽ duyệt hoặc từ chối.</p></div>
        <Button onClick={() => setOpen(true)}>Đăng ký thành lập CLB</Button>
      </header>
      {query.isLoading ? <p>Đang tải đơn...</p> : query.isError ? <p role="alert">Không thể tải danh sách đơn.</p> : (
        <div className="admin-club-list">
          {applications.length === 0 && <p>Bạn chưa gửi đơn nào.</p>}
          {applications.map((item) => (
            <article key={item.id}>
              <div className="admin-club-list__identity">
                <h2>{item.proposedClubName}</h2>
                <p>{item.objectives}</p>
                {item.reviewFeedback && <p>Lý do review: {item.reviewFeedback}</p>}
              </div>
              <strong>{item.status === 'PendingApproval' ? 'Chờ duyệt' : item.status === 'Approved' ? 'Đã duyệt' : 'Bị từ chối'}</strong>
              {item.createdClubId && <Link to={`/clubs/${item.createdClubId}`}>Mở CLB</Link>}
            </article>
          ))}
        </div>
      )}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Đăng ký thành lập CLB">
        <form className="club-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <label>Tên CLB<input {...form.register('proposedClubName', { required: true })} /></label>
          <label>Mô tả<textarea rows={3} {...form.register('description', { required: true })} /></label>
          <label>Mục tiêu<textarea rows={4} {...form.register('objectives', { required: true })} /></label>
          <label>URL minh chứng (không bắt buộc)<input type="url" {...form.register('evidenceUrl')} /></label>
          <div><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" loading={mutation.isPending}>Gửi đơn</Button></div>
        </form>
      </Modal>
    </div>
  );
}
