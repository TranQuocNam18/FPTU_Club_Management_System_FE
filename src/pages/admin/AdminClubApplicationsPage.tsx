import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { clubApplicationApi } from '../../api/club.api';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { getApiError } from '../../utils';

export default function AdminClubApplicationsPage() {
  const user = useAuthStore((state) => state.user);
  const client = useQueryClient();
  const [reason, setReason] = useState<Record<string, string>>({});
  const isAdmin = user?.role === 'StudentAffairsAdmin';
  const query = useQuery({ queryKey: ['club-applications', 'admin'], queryFn: clubApplicationApi.all, enabled: isAdmin });
  const refresh = () => client.invalidateQueries({ queryKey: ['club-applications'] });
  const approve = useMutation({
    mutationFn: clubApplicationApi.approve,
    onSuccess: async () => { toast.success('Đã duyệt đơn và bootstrap ClubLeader.'); await refresh(); },
    onError: (error) => toast.error(getApiError(error, 'Không thể duyệt đơn.')),
  });
  const reject = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => clubApplicationApi.reject(id, value),
    onSuccess: async () => { toast.success('Đã từ chối đơn.'); await refresh(); },
    onError: (error) => toast.error(getApiError(error, 'Không thể từ chối đơn.')),
  });
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  const applications = query.data?.data.data ?? [];

  return (
    <div className="admin-clubs-page">
      <header className="clubs-header"><div><p className="clubs-eyebrow">Governance</p>
        <h1>Duyệt đơn thành lập CLB</h1><p>Admin review; không tạo CLB thay sinh viên trong luồng chính.</p></div>
        <Link to="/admin/clubs">Quản trị CLB hiện có</Link>
      </header>
      {query.isLoading ? <p>Đang tải...</p> : query.isError ? <p role="alert">Không thể tải review queue.</p> : (
        <div className="admin-club-list">
          {applications.map((item) => (
            <article key={item.id}>
              <div className="admin-club-list__identity"><h2>{item.proposedClubName}</h2>
                <p>{item.description}</p><p>Mục tiêu: {item.objectives}</p></div>
              <strong>{item.status}</strong>
              {item.status === 'PendingApproval' && <div className="admin-club-list__actions">
                <input aria-label={`Lý do từ chối ${item.proposedClubName}`} placeholder="Lý do từ chối"
                  value={reason[item.id] ?? ''} onChange={(event) => setReason({ ...reason, [item.id]: event.target.value })} />
                <Button variant="outline" disabled={!reason[item.id]?.trim()} onClick={() => reject.mutate({ id: item.id, value: reason[item.id] })}>Từ chối</Button>
                <Button onClick={() => approve.mutate(item.id)}>Duyệt</Button>
              </div>}
            </article>
          ))}
          {applications.length === 0 && <p>Không có đơn thành lập CLB.</p>}
        </div>
      )}
    </div>
  );
}
