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
    onSuccess: () => { toast.success('Join request sent.'); qc.invalidateQueries({ queryKey: ['clubs'] }); },
    onError: () => toast.error('Unable to join this club'),
  });

  const createMutation = useMutation({
    mutationFn: (d: CreateForm) => clubApi.create({
      name: d.name,
      description: d.description,
      logoUrl: d.logoUrl || null,
      category: d.category,
      establishedDate: d.establishedDate,
      advisorId: user?.id || ''
    } as any),
    onSuccess: () => { toast.success('Club created.'); qc.invalidateQueries({ queryKey: ['clubs'] }); setShowCreate(false); reset(); },
    onError: () => toast.error('Unable to create club'),
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
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clubs</h1>
          <p className="text-slate-500 text-sm mt-1">{clubs.length} clubs in the system</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clubs..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
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
              Create Club
            </Button>
          )}
        </div>
      </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Building2 size={48} />} title="No clubs found" description="Try a different search term." />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(club => (
            <div key={club.id} className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xl font-bold text-white shadow-sm">
                  {club.logoUrl ? (
                    <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    club.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-indigo-600">{club.name}</h3>
                      <p className="mt-0.5 text-sm text-slate-500">{club.category ?? 'Uncategorized'}</p>
                    </div>
                    <Badge className={`${getStatusColor(String(club.status))} flex-shrink-0`}>{club.status}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{club.description}</p>
                </div>
              </div>

                <div className="mt-5 flex gap-3">
                  <Link to={`/clubs/${club.id}`} className="flex-1">
                    <button className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-indigo-300 hover:text-indigo-600">
                      View details <ArrowRight size={14} />
                    </button>
                  </Link>
                  {user?.role === 'Student' && (
                    <button
                      onClick={() => joinMutation.mutate(club.id)}
                      disabled={joinMutation.isPending || club.status !== 'Active'}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Users size={14} /> Join
                    </button>
                  )}
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Create Club" size="md">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Club name</label>
            <input {...register('name')} className="input-field" placeholder="Club name" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select {...register('category')} className="input-field">
              <option value="">Select category</option>
              {['Technology', 'Culture', 'Sports', 'Academic', 'Arts', 'Community'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="Describe the club..." />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL (optional)</label>
            <input {...register('logoUrl')} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Established date</label>
            <input {...register('establishedDate')} type="date" className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
