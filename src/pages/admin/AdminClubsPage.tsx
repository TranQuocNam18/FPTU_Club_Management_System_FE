import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner, EmptyState, Skeleton } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { getStatusColor, formatDate } from '../../utils';
import { useForm } from 'react-hook-form';
import type { Club, ClubStatus } from '../../types';
import { useAuthStore } from '../../stores/authStore';

export default function AdminClubsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Club | null>(null);

  const { data: res, isLoading } = useQuery({ queryKey: ['clubs'], queryFn: () => clubApi.getAll() });
  const clubs: Club[] = res?.data?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clubApi.delete(id),
    onSuccess: () => { toast.success('Da tam ngung CLB'); qc.invalidateQueries({ queryKey: ['clubs'] }); },
    onError: () => toast.error('Khong the thuc hien'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: number }) => clubApi.review(id, status),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 1 ? 'Phe duyet CLB thanh cong!' : 'Da tu choi don thanh lap CLB.');
      qc.invalidateQueries({ queryKey: ['clubs'] });
    },
    onError: () => toast.error('Co loi xay ra khi duyet CLB'),
  });

  const { register, handleSubmit, reset, setValue } = useForm<{
    name: string; description: string; category: string; logoUrl: string; establishedDate: string; status: ClubStatus;
  }>();

  const createMutation = useMutation({
    mutationFn: (d: any) => clubApi.create({
      name: d.name,
      description: d.description,
      logoUrl: d.logoUrl || null,
      category: d.category,
      establishedDate: d.establishedDate,
      advisorId: user?.id || "22222222-2222-2222-2222-222222222222"
    } as any),
    onSuccess: () => { toast.success('Tao CLB thanh cong!'); qc.invalidateQueries({ queryKey: ['clubs'] }); setShowCreate(false); reset(); },
    onError: () => toast.error('Khong the tao CLB'),
  });

  const updateMutation = useMutation({
    mutationFn: (d: any) => clubApi.update(editTarget!.id, {
      name: d.name,
      description: d.description,
      logoUrl: d.logoUrl || null,
      category: d.category,
      establishedDate: d.establishedDate,
      status: d.status,
    } as any),
    onSuccess: () => { toast.success('Cap nhat CLB thanh cong!'); qc.invalidateQueries({ queryKey: ['clubs'] }); setEditTarget(null); reset(); },
    onError: () => toast.error('Khong the cap nhat CLB'),
  });

  const openEdit = (club: Club) => {
    setEditTarget(club);
    setValue('name', club.name);
    setValue('description', club.description);
    setValue('category', club.category ?? 'Khac');
    setValue('logoUrl', club.logoUrl ?? '');
    setValue('status', club.status as ClubStatus);
  };

  const handleSuspend = (club: Club) => {
    const confirmed = window.confirm(`Tam ngung CLB "${club.name}"? Hanh dong nay se an CLB khoi cac luong hoat dong.`);
    if (confirmed) deleteMutation.mutate(club.id);
  };

  const statusMap: Record<number | string, string> = {
    0: 'Pending',
    1: 'Active',
    2: 'Suspended',
    3: 'Inactive',
    'PendingApproval': 'Pending',
    'Active': 'Active',
    'Suspended': 'Suspended',
    'Inactive': 'Inactive'
  };

  const getStatusLabel = (status: any) => {
    return statusMap[status] ?? 'Pending';
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-16" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quan ly Cau lac bo</h1>
          <p className="text-slate-500 text-sm mt-1">{clubs.length} CLB trong he thong</p>
        </div>
        <Button
          icon={<Plus size={16} />}
          onClick={() => setShowCreate(true)}
        >
          Tao CLB moi
        </Button>
      </div>

      {clubs.length === 0 ? (
        <EmptyState icon={<Building2 size={48} />} title="Chua co CLB nao"
          action={
            <Button
              icon={<Plus size={16} />}
              onClick={() => setShowCreate(true)}
            >
              Tao CLB dau tien
            </Button>
          } />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CLB</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Danh muc</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Thanh lap</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trang thai</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clubs.map(club => {
                  const mappedStatus = getStatusLabel(club.status);
                  const isPending = (club.status as any) === 0 || (club.status as any) === '0' || (club.status as any) === 'PendingApproval';
                  return (
                    <tr key={club.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {club.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{club.name}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-48">{club.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{club.category ?? 'Chua phan loai'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{club.establishedDate ? formatDate(club.establishedDate) : 'Chua co'}</td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(mappedStatus)}>{mappedStatus}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <>
                              <button onClick={() => reviewMutation.mutate({ id: club.id, status: 1 })}
                                disabled={reviewMutation.isPending}
                                className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                                Duyet
                              </button>
                              <button onClick={() => reviewMutation.mutate({ id: club.id, status: 3 })}
                                disabled={reviewMutation.isPending}
                                className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                                Tu choi
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEdit(club)}
                            aria-label={`Chinh sua ${club.name}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleSuspend(club)}
                            disabled={deleteMutation.isPending}
                            aria-label={`Tam ngung ${club.name}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreate || !!editTarget}
        onClose={() => { setShowCreate(false); setEditTarget(null); reset(); }}
        title={editTarget ? 'Chinh sua CLB' : 'Tao CLB moi'}
      >
        <form onSubmit={handleSubmit(d => editTarget ? updateMutation.mutate(d) : createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ten CLB</label>
            <input {...register('name', { required: true })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Danh muc</label>
            <select {...register('category', { required: true })} className="input-field">
              {['Ky thuat', 'Van hoa', 'The thao', 'Hoc thuat', 'Nghe thuat', 'Cong nghe', 'Tinh nguyen'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mo ta</label>
            <textarea {...register('description')} rows={3} className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL Logo</label>
            <input {...register('logoUrl')} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngay thanh lap</label>
            <input {...register('establishedDate')} type="date" className="input-field" />
          </div>
          {editTarget && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trang thai</label>
              <select {...register('status')} className="input-field">
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowCreate(false); setEditTarget(null); reset(); }}>Huy</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editTarget ? 'Cap nhat' : 'Tao CLB'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
