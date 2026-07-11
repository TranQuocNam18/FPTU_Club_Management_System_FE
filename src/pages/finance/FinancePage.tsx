import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { financeApi } from '../../api/finance.api';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, Skeleton } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { getStatusColor, formatDate, formatCurrency } from '../../utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { BudgetProposal } from '../../types';

const createSchema = z.object({
  clubId: z.string().min(1),
  eventName: z.string().min(3),
  requestedAmount: z.number().min(1000, 'Toi thieu 1,000 VND'),
  budgetDetailsJson: z.string().min(5),
});
type CreateForm = z.infer<typeof createSchema>;

export default function FinancePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';
  const [showCreate, setShowCreate] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<BudgetProposal | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Rejected'>('Approved');

  const { data: res, isLoading } = useQuery({ queryKey: ['proposals'], queryFn: () => isAdmin ? financeApi.getPendingProposals() : financeApi.getProposals() });
  const proposals: BudgetProposal[] = res?.data?.data ?? [];

  const { register: createReg, handleSubmit: handleCreateForm, reset: createReset } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => financeApi.createProposal(d),
    onSuccess: () => { toast.success('Gui de xuat ngan sach thanh cong!'); qc.invalidateQueries({ queryKey: ['proposals'] }); setShowCreate(false); createReset(); },
    onError: () => toast.error('Khong the gui de xuat'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => financeApi.reviewProposal(reviewTarget!.id, { status: reviewStatus, approvedAmount: Number(approvedAmount) }),
    onSuccess: () => { toast.success(reviewStatus === 'Approved' ? 'Da phe duyet de xuat!' : 'Da tu choi de xuat!'); qc.invalidateQueries({ queryKey: ['proposals'] }); setReviewTarget(null); },
    onError: () => toast.error('Khong the duyet de xuat'),
  });

  const stats = {
    total: proposals.length,
    pending: proposals.filter(p => p.status === 'Pending').length,
    approved: proposals.filter(p => p.status === 'Approved').length,
    totalApproved: proposals.filter(p => p.status === 'Approved').reduce((sum, p) => sum + (p.approvedAmount ?? 0), 0),
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-800">{isAdmin ? 'Duyet ngan sach' : 'De xuat ngan sach'}</h1><p className="text-slate-500 text-sm mt-1">Quan ly kinh phi su kien CLB bang mock data</p></div>
        {!isAdmin && <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>De xuat ngan sach</Button>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tong de xuat', value: stats.total, icon: <DollarSign size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Cho duyet', value: stats.pending, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Da duyet', value: stats.approved, icon: <CheckCircle size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tong da cap', value: formatCurrency(stats.totalApproved), icon: <TrendingUp size={18} />, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-3"><div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>{icon}</div><div><p className="text-xs text-slate-400">{label}</p><p className={`text-lg font-bold ${color}`}>{value}</p></div></div>
        ))}
      </div>
      {proposals.length === 0 ? <EmptyState icon={<DollarSign size={48} />} title="Chua co de xuat nao" action={!isAdmin ? <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>De xuat ngan sach</Button> : undefined} /> : (
        <div className="space-y-3">{proposals.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${p.status === 'Approved' ? 'bg-emerald-50' : p.status === 'Rejected' ? 'bg-red-50' : 'bg-amber-50'}`}>
              {p.status === 'Approved' ? <CheckCircle size={22} className="text-emerald-500" /> : p.status === 'Rejected' ? <XCircle size={22} className="text-red-400" /> : <Clock size={22} className="text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap"><h3 className="text-sm font-semibold text-slate-800">{p.eventName}</h3><Badge className={getStatusColor(p.status)}>{p.status}</Badge></div>
              {p.clubName && <p className="text-xs text-slate-500 mt-0.5">{p.clubName}</p>}
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.budgetDetailsJson}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400"><span>Yeu cau: <strong>{formatCurrency(p.requestedAmount)}</strong></span>{p.approvedAmount != null && <span>Duyet: <strong className="text-emerald-600">{formatCurrency(p.approvedAmount)}</strong></span>}<span>{formatDate(p.proposedDate)}</span></div>
            </div>
            {isAdmin && p.status === 'Pending' && <Button size="sm" variant="secondary" onClick={() => { setReviewTarget(p); setApprovedAmount(String(p.requestedAmount)); }}>Duyet</Button>}
          </div>
        ))}</div>
      )}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); createReset(); }} title="De xuat ngan sach su kien">
        <form onSubmit={handleCreateForm(d => createMutation.mutate(d))} className="space-y-4">
          <input {...createReg('clubId')} className="input-field" placeholder="ID CLB, VD: club-tech" />
          <input {...createReg('eventName')} className="input-field" placeholder="Ten su kien" />
          <input {...createReg('requestedAmount', { valueAsNumber: true })} type="number" min={1000} className="input-field" placeholder="5000000" />
          <textarea {...createReg('budgetDetailsJson')} rows={4} className="input-field resize-none" placeholder="Line items: thue phong, nuoc uong, truyen thong..." />
          <div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Huy</Button><Button type="submit" loading={createMutation.isPending}>Gui de xuat</Button></div>
        </form>
      </Modal>
      <Modal isOpen={!!reviewTarget} onClose={() => setReviewTarget(null)} title="Duyet de xuat ngan sach">
        {reviewTarget && <div className="space-y-4"><div className="p-4 bg-slate-50 rounded-xl"><p className="text-sm font-semibold">{reviewTarget.eventName}</p><p className="text-sm text-slate-600">Yeu cau: <strong>{formatCurrency(reviewTarget.requestedAmount)}</strong></p></div>
          <div className="flex gap-3">{(['Approved', 'Rejected'] as const).map(s => <button key={s} type="button" onClick={() => setReviewStatus(s)} className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium ${reviewStatus === s ? s === 'Approved' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 text-slate-500'}`}>{s === 'Approved' ? 'Phe duyet' : 'Tu choi'}</button>)}</div>
          {reviewStatus === 'Approved' && <input type="number" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} className="input-field" placeholder="So tien phe duyet" />}
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setReviewTarget(null)}>Huy</Button><Button onClick={() => reviewMutation.mutate()} loading={reviewMutation.isPending} variant={reviewStatus === 'Approved' ? 'primary' : 'danger'}>{reviewStatus === 'Approved' ? 'Phe duyet' : 'Tu choi'}</Button></div>
        </div>}
      </Modal>
    </div>
  );
}
