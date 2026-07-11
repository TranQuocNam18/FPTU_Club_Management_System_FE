import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users, Plus, Crown, Wallet, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import { eventApi } from '../../api/event.api';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { getStatusColor, formatDate, formatDateTime, getRoleLabel } from '../../utils';
import { useForm } from 'react-hook-form';

const memberStatusMap: Record<number | string, string> = {
  0: 'Pending',
  1: 'Approved',
  2: 'Rejected',
  3: 'Left',
  'Pending': 'Pending',
  'Approved': 'Approved',
  'Rejected': 'Rejected',
  'Left': 'Left'
};

const memberRoleMap: Record<number | string, string> = {
  0: 'Member',
  1: 'Leader',
  2: 'President',
  'Member': 'Member',
  'Leader': 'Leader',
  'President': 'President'
};

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'info' | 'members' | 'events'>('info');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';

  const { data: clubRes, isLoading } = useQuery({ queryKey: ['club', id], queryFn: () => clubApi.getById(id!) });
  const { data: membersRes } = useQuery({ queryKey: ['club-members', id], queryFn: () => clubApi.getMembers(id!) });
  const { data: eventsRes } = useQuery({ queryKey: ['club-events', id], queryFn: () => eventApi.getByClub(id!) });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => clubApi.removeMember(id!, userId),
    onSuccess: () => { toast.success('Da xoa thanh vien khoi cau lac bo'); qc.invalidateQueries({ queryKey: ['club-members', id] }); },
    onError: () => toast.error('Khong the xoa thanh vien'),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => clubApi.updateMemberRole(id!, userId, 0, 1),
    onSuccess: () => {
      toast.success('Da phe duyet yeu cau gia nhap!');
      qc.invalidateQueries({ queryKey: ['club-members', id] });
    },
    onError: () => toast.error('Khong the phe duyet yeu cau'),
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => clubApi.updateMemberRole(id!, userId, 0, 2),
    onSuccess: () => {
      toast.success('Da tu choi yeu cau gia nhap!');
      qc.invalidateQueries({ queryKey: ['club-members', id] });
    },
    onError: () => toast.error('Khong the tu choi yeu cau'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: number }) =>
      clubApi.updateMemberRole(id!, userId, role, 1),
    onSuccess: () => {
      toast.success('Cap nhat vai tro thanh cong!');
      qc.invalidateQueries({ queryKey: ['club-members', id] });
    },
    onError: () => toast.error('Khong the cap nhat vai tro'),
  });

  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Advisor' || user?.role === 'ClubManager';

  const { register, handleSubmit, reset } = useForm<{
    title: string; description: string; startTime: string; endTime: string; location: string;
  }>();

  const createEventMutation = useMutation({
    mutationFn: (d: any) => eventApi.create({ ...d, clubId: id! }),
    onSuccess: () => {
      toast.success('Tao su kien thanh cong!');
      qc.invalidateQueries({ queryKey: ['club-events', id] });
      setShowCreateEvent(false);
      reset();
    },
    onError: () => toast.error('Khong the tao su kien'),
  });

  if (isLoading) return <PageSpinner />;
  const club = clubRes?.data?.data;
  const members = membersRes?.data?.data ?? [];
  const events = eventsRes?.data?.data ?? [];

  if (!club) return <div className="text-center py-12 text-slate-500">CLB khong ton tai</div>;

  const roleIcon = (role: string) => {
    if (role === 'Leader') return <Crown size={12} className="text-amber-500" />;
    if (role === 'Treasurer') return <Wallet size={12} className="text-emerald-500" />;
    return null;
  };

  return (
    <div>
      <Link to="/clubs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-5 transition-colors">
        <ArrowLeft size={16} /> Quay lai danh sach
      </Link>

      {/* Hero */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="h-36 bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-700 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_50%,white,transparent_70%)]" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border-2 border-white flex items-center justify-center text-3xl font-bold text-indigo-600">
              {club.logoUrl ? <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover rounded-2xl" /> : club.name.charAt(0)}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-800">{club.name}</h1>
                <Badge className={getStatusColor(String(club.status))}>{club.status}</Badge>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {club.category ?? 'Chua phan loai'} - Thanh lap {club.establishedDate ? formatDate(club.establishedDate) : 'chua co'}
              </p>
            </div>
            {(isAdmin || user?.role === 'ClubManager') && (
              <Button
                icon={<Plus size={16} />}
                size="sm"
                onClick={() => setShowCreateEvent(true)}
              >
                Tao su kien
              </Button>
            )}
          </div>
          <p className="text-sm text-slate-600">{club.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {(['info', 'members', 'events'] as const).map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'info' ? 'Thong tin' : t === 'members' ? `Thanh vien (${members.length})` : `Su kien (${events.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'members' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Thanh vien</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai tro</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngay tham gia</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trang thai</th>
                  {isManagerOrAdmin && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tac</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map((m: any) => {
                  const mappedStatus = memberStatusMap[m.status] ?? m.status;
                  const isPending = m.status === 0 || m.status === 'Pending';
                  return (
                    <tr key={m.id || m.userId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {m.fullName?.charAt(0) ?? 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{m.fullName || 'Thanh vien'}</p>
                            <p className="text-xs text-slate-400">{m.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isManagerOrAdmin && !isPending ? (
                          <select
                            value={m.role !== undefined ? m.role : 0}
                            onChange={(e) => updateRoleMutation.mutate({
                              userId: m.userId,
                              role: parseInt(e.target.value)
                            })}
                            className="text-sm text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            <option value={0}>Thanh vien</option>
                            <option value={1}>Quan ly CLB</option>
                            <option value={2}>Chu nhiem</option>
                          </select>
                        ) : (
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            {roleIcon(m.roleInClub)} {m.role !== undefined ? memberRoleMap[m.role] : getRoleLabel(m.roleInClub)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(m.joinedAt || m.joinDate)}</td>
                      <td className="px-6 py-4"><Badge className={getStatusColor(mappedStatus)}>{mappedStatus}</Badge></td>
                      {isManagerOrAdmin && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => approveMutation.mutate(m.userId)}
                                  disabled={approveMutation.isPending}
                                  className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Duyet
                                </button>
                                <button
                                  onClick={() => rejectMutation.mutate(m.userId)}
                                  disabled={rejectMutation.isPending}
                                  className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  Tu choi
                                </button>
                              </>
                            )}
                            {!isPending && (
                              <button onClick={() => removeMutation.mutate(m.userId)}
                                disabled={removeMutation.isPending}
                                className="text-red-400 hover:text-red-600 transition-colors p-1">
                                <UserMinus size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Chua co su kien nao</div>
          ) : events.map((e: any) => (
            <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Calendar size={22} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-800">{e.title}</h3>
                  <Badge className={getStatusColor(e.status)}>{e.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{e.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Calendar size={12} />{formatDateTime(e.startTime)}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} />{e.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'info' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Thong tin chi tiet</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Ten CLB', value: club.name },
              { label: 'Danh muc', value: club.category ?? 'Chua phan loai' },
              { label: 'Trang thai', value: club.status },
              { label: 'Ngay thanh lap', value: club.establishedDate ? formatDate(club.establishedDate) : 'Chua co' },
              { label: 'So thanh vien', value: members.length },
              { label: 'So su kien', value: events.length },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-700">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      <Modal isOpen={showCreateEvent} onClose={() => { setShowCreateEvent(false); reset(); }} title="Tao su kien moi">
        <form onSubmit={handleSubmit(d => createEventMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ten su kien</label>
            <input {...register('title', { required: true })} className="input-field" placeholder="Ten su kien" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mo ta</label>
            <textarea {...register('description')} rows={3} className="input-field resize-none" placeholder="Mo ta chi ti?t..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bat dau</label>
              <input {...register('startTime', { required: true })} type="datetime-local" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ket thuc</label>
              <input {...register('endTime', { required: true })} type="datetime-local" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dia diem</label>
            <input {...register('location', { required: true })} className="input-field" placeholder="Phong hoc, hoi truong..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowCreateEvent(false); reset(); }}>Huy</Button>
            <Button type="submit" loading={createEventMutation.isPending}>Tao su kien</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
