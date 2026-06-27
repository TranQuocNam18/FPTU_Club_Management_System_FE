import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { financeApi } from '../../api/finance.api';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner, EmptyState } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { getStatusColor, formatDate, formatCurrency } from '../../utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BudgetProposal } from '../../types';

const createSchema = z.object({
  clubId: z.string().min(1),
  eventName: z.string().min(3),
  requestedAmount: z.number().min(1000, 'Tối thiểu 1,000 VND'),
  budgetDetailsJson: z.string().min(5),
});
type CreateForm = z.infer<typeof createSchema>;

const mockProposals: BudgetProposal[] = [
  { id: '1', clubId: 'c1', clubName: 'CLB Kỹ thuật', proposerId: 'u1', eventName: 'Hackathon 2025', requestedAmount: 5000000, proposedDate: new Date().toISOString(), status: 'Pending' },
  { id: '2', clubId: 'c2', clubName: 'CLB Văn hóa', proposerId: 'u2', eventName: 'Đêm gala cuối năm', requestedAmount: 8000000, approvedAmount: 7000000, proposedDate: new Date(Date.now() - 86400000).toISOString(), status: 'Approved' },
  { id: '3', clubId: 'c3', clubName: 'CLB Thể thao', proposerId: 'u3', eventName: 'Giải bóng đá nội bộ', requestedAmount: 3000000, proposedDate: new Date(Date.now() - 172800000).toISOString(), status: 'Rejected' },
];

export default function FinancePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';
  const [showCreate, setShowCreate] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<BudgetProposal | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Rejected'>('Approved');

  const { data: res, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => isAdmin ? financeApi.getPendingProposals() : financeApi.getProposals(),
  });
  const proposals: BudgetProposal[] = res?.data?.data?.length ? res.data.data : mockProposals;

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => financeApi.createProposal(d),
    onSuccess: () => { toast.success('Gửi đề xuất ngân sách thành công!'); qc.invalidateQueries({ queryKey: ['proposals'] }); setShowCreate(false); createReset(); },
    onError: () => toast.error('Không thể gửi đề xuất'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => financeApi.reviewProposal(reviewTarget!.id, { status: reviewStatus, approvedAmount: Number(approvedAmount) }),
    onSuccess: () => { toast.success('Đã duyệt đề xuất!'); qc.invalidateQueries({ queryKey: ['proposals'] }); setReviewTarget(null); },
    onError: () => toast.error('Không thể duyệt đề xuất'),
  });

  const { register: createReg, handleSubmit: handleCreateForm, reset: createReset } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const stats = {
    total: proposals.length,
    pending: proposals.filter(p => p.status === 'Pending').length,
    approved: proposals.filter(p => p.status === 'Approved').length,
    totalApproved: proposals.filter(p => p.status === 'Approved').reduce((sum, p) => sum + (p.approvedAmount ?? 0), 0),
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isAdmin ? 'Duyệt ngân sách' : 'Đề xuất ngân sách'}</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý kinh phí sự kiện CLB</p>
        </div>
        {!isAdmin && (
          <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Đề xuất ngân sách</Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng đề xuất', value: stats.total, icon: <DollarSign size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Chờ duyệt', value: stats.pending, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Đã duyệt', value: stats.approved, icon: <CheckCircle size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tổng đã cấp', value: formatCurrency(stats.totalApproved), icon: <TrendingUp size={18} />, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center flex-shrink-0`}>{icon}</div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <EmptyState icon={<DollarSign size={48} />} title="Chưa có đề xuất nào"
          description="Tạo đề xuất ngân sách cho sự kiện CLB của bạn"
          action={!isAdmin ? <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>Đề xuất ngân sách</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${p.status === 'Approved' ? 'bg-emerald-50' : p.status === 'Rejected' ? 'bg-red-50' : 'bg-amber-50'}`}>
                {p.status === 'Approved' ? <CheckCircle size={22} className="text-emerald-500" />
                  : p.status === 'Rejected' ? <XCircle size={22} className="text-red-400" />
                  : <Clock size={22} className="text-amber-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-800">{p.eventName}</h3>
                  <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                </div>
                {p.clubName && <p className="text-xs text-slate-500 mt-0.5">{p.clubName}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>Yêu cầu: <span className="font-semibold text-slate-600">{formatCurrency(p.requestedAmount)}</span></span>
                  {p.approvedAmount !== undefined && p.approvedAmount !== null && (
                    <span>Duyệt: <span className="font-semibold text-emerald-600">{formatCurrency(p.approvedAmount)}</span></span>
                  )}
                  <span>Ngày: {formatDate(p.proposedDate)}</span>
                </div>
              </div>
              {isAdmin && p.status === 'Pending' && (
                <Button size="sm" variant="secondary" onClick={() => { setReviewTarget(p); setApprovedAmount(String(p.requestedAmount)); }}>
                  Duyệt
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); createReset(); }} title="Đề xuất ngân sách sự kiện">
        <form onSubmit={handleCreateForm((d) => createMutation.mutate(d as CreateForm))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CLB</label>
            <input {...createReg('clubId')} className="input-field" placeholder="ID của CLB" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên sự kiện</label>
            <input {...createReg('eventName')} className="input-field" placeholder="Tên sự kiện xin kinh phí" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền xin cấp (VND)</label>
            <input {...createReg('requestedAmount', { valueAsNumber: true })} type="number" min={1000} className="input-field" placeholder="5000000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chi tiết dự trù kinh phí</label>
            <textarea {...createReg('budgetDetailsJson')} rows={4} className="input-field resize-none"
              placeholder="Liệt kê các hạng mục chi tiêu: thuê địa điểm, in ấn, âm thanh ánh sáng..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowCreate(false); createReset(); }}>Hủy</Button>
            <Button type="submit" loading={createMutation.isPending}>Gửi đề xuất</Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={!!reviewTarget} onClose={() => setReviewTarget(null)} title="Duyệt đề xuất ngân sách">
        {reviewTarget && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm font-semibold text-slate-800">{reviewTarget.eventName}</p>
              <p className="text-sm text-slate-600 mt-1">Số tiền yêu cầu: <strong className="text-indigo-600">{formatCurrency(reviewTarget.requestedAmount)}</strong></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Quyết định</label>
              <div className="flex gap-3">
                {(['Approved', 'Rejected'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setReviewStatus(s)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                      ${reviewStatus === s
                        ? s === 'Approved' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-600'
                        : 'border-slate-200 text-slate-500'}`}>
                    {s === 'Approved' ? '✓ Phê duyệt' : '✗ Từ chối'}
                  </button>
                ))}
              </div>
            </div>
            {reviewStatus === 'Approved' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền phê duyệt thực tế</label>
                <input type="number" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)}
                  className="input-field" placeholder="Có thể điều chỉnh thấp hơn yêu cầu" />
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setReviewTarget(null)}>Hủy</Button>
              <Button onClick={() => reviewMutation.mutate()} loading={reviewMutation.isPending}
                variant={reviewStatus === 'Approved' ? 'primary' : 'danger'}>
                {reviewStatus === 'Approved' ? 'Phê duyệt' : 'Từ chối'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
