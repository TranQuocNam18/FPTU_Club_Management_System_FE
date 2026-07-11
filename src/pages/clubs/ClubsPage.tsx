import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Building2, Users, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import { useAuthStore } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner, EmptyState, Skeleton } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { getStatusColor, formatDate } from '../../utils';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import type { Club } from '../../types';

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  logoUrl: z.string().url().optional().or(z.literal('')),
  establishedDate: z.string(),
});
type CreateForm = z.infer<typeof createSchema>;

export default function ClubsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';

  const { data: res, isLoading } = useQuery({ queryKey: ['clubs'], queryFn: () => clubApi.getAll() });
  const clubs: Club[] = res?.data?.data ?? [];

  const joinMutation = useMutation({
    mutationFn: (id: string) => clubApi.joinClub(id),
    onSuccess: () => { toast.success('Da gui don gia nhap CLB!'); qc.invalidateQueries({ queryKey: ['clubs'] }); },
    onError: () => toast.error('Khong the gia nhap CLB'),
  });

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => clubApi.create({
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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.category ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div>
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-56" />
            {isAdmin && <Skeleton className="h-10 w-28" />}
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-5 space-y-4">
              <Skeleton className="h-24 w-full -mx-5 -mt-5 rounded-none" />
              <div className="flex flex-col items-center space-y-2 pt-4">
                <Skeleton className="h-14 w-14 rounded-2xl -mt-10 border-2 border-white shadow-md" />
                <Skeleton className="h-5 w-32 mt-2" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 mt-2" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cau lac bo</h1>
          <p className="text-slate-500 text-sm mt-1">{clubs.length} CLB trong he thong</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tim kiem CLB..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-56"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
          {isAdmin && (
            <Button
              icon={<Plus size={16} />}
              onClick={() => setShowCreate(true)}
            >
              Tao CLB
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Building2 size={48} />} title="Khong tim thay CLB nao" description="Thu tim voi tu khoa khac" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(club => (
            <div key={club.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
              {/* Cover */}
              <div className="h-24 bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,white,transparent)]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-2xl font-bold text-indigo-600 border-2 border-white">
                  {club.logoUrl ? (
                    <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    club.name.charAt(0)
                  )}
                </div>
              </div>

              <div className="pt-9 pb-5 px-5 text-center">
                <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{club.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{club.category ?? 'Chua phan loai'}</p>
                <Badge className={`${getStatusColor(String(club.status))} mt-2`}>{club.status}</Badge>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{club.description}</p>

                <div className="flex gap-2 mt-4">
                  <Link to={`/clubs/${club.id}`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                      Chi ti?t <ArrowRight size={12} />
                    </button>
                  </Link>
                  {user?.role === 'Student' && (
                    <button
                      onClick={() => joinMutation.mutate(club.id)}
                      disabled={joinMutation.isPending || club.status !== 'Active'}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Users size={12} /> Gia nh?p
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Tao Cau lac bo moi" size="md">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ten CLB</label>
            <input {...register('name')} className="input-field" placeholder="Ten cau lac bo" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Danh muc</label>
            <select {...register('category')} className="input-field">
              <option value="">Chon danh muc</option>
              {['Ky thuat', 'Van hoa', 'The thao', 'Hoc thuat', 'Nghe thuat', 'Cong nghe', 'Tinh nguyen'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mo ta</label>
            <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="Mo ta hoat dong cua CLB..." />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL Logo (tuy chon)</label>
            <input {...register('logoUrl')} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngay thanh lap</label>
            <input {...register('establishedDate')} type="date" className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowCreate(false); reset(); }}>Huy</Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>Tao CLB</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
