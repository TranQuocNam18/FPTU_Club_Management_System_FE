import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users, Plus, Crown, Wallet, UserMinus, Edit2, X, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import { eventApi } from '../../api/event.api';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import {
  getStatusColor, formatDate, formatDateTime,
} from '../../utils';
import { useForm } from 'react-hook-form';
import {
  ClubRoleMap, ClubRoleLabel, MembershipStatusMap,
  EventStatusMap, EventStatusLabel,
} from '../../types';

// ── Helpers ──────────────────────────────────────────────────────────────────
const memberStatusMap: Record<number | string, string> = {
  0: 'Pending', 1: 'Approved', 2: 'Rejected', 3: 'Left',
  Pending: 'Pending', Approved: 'Approved', Rejected: 'Rejected', Left: 'Left',
};

const getClubStatusDisplay = (status: any): string => {
  const s = String(status);
  return ({ '0': 'PendingApproval', '1': 'Active', '2': 'Suspended', '3': 'Inactive' }[s]) ?? s;
};

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'info' | 'members' | 'events'>('info');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editEventTarget, setEditEventTarget] = useState<any>(null);

  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';
  // Only Admin/ClubManager can manage (update members, create events, etc.)
  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Advisor' || user?.role === 'ClubManager';

  const { data: clubRes, isLoading } = useQuery({
    queryKey: ['club', id],
    queryFn: () => clubApi.getById(id!),
  });
  const { data: membersRes } = useQuery({
    queryKey: ['club-members', id],
    queryFn: () => clubApi.getMembers(id!),
  });
  const { data: eventsRes } = useQuery({
    queryKey: ['club-events', id],
    queryFn: () => eventApi.getByClub(id!),
  });

  // Check if current ClubManager is a Manager/President of THIS specific club
  // BE ClubRole: Member=0, Manager=1, President=2
  const isManagerOfThisClub = React.useMemo(() => {
    if (user?.role === 'Admin' || user?.role === 'Advisor') return true;
    if (user?.role !== 'ClubManager') return false;
    const members: any[] = membersRes?.data?.data ?? [];
    return members.some((m: any) =>
      m.userId === user?.id &&
      (m.role === 1 || m.role === 2) && // Manager=1, President=2
      (m.status === 1) // Approved
    );
  }, [membersRes, user]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (userId: string) => clubApi.removeMember(id!, userId),
    onSuccess: () => { toast.success('Đã xóa thành viên'); qc.invalidateQueries({ queryKey: ['club-members', id] }); },
    onError: () => toast.error('Không thể xóa thành viên'),
  });

  const approveMemberMutation = useMutation({
    mutationFn: ({ userId, role, status }: { userId: string; role: number; status: number }) =>
      clubApi.updateMemberRole(id!, userId, role, status),
    onSuccess: () => {
      toast.success('Cập nhật thành viên thành công!');
      qc.invalidateQueries({ queryKey: ['club-members', id] });
    },
    onError: () => toast.error('Không thể cập nhật thành viên'),
  });

  // ── Event Form ─────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<{
    title: string; description: string; expectedDate: string; location: string;
  }>();

  const createEventMutation = useMutation({
    mutationFn: (d: any) => eventApi.create({ ...d, clubId: id! }),
    onSuccess: () => {
      toast.success('Tạo sự kiện thành công!');
      qc.invalidateQueries({ queryKey: ['club-events', id] });
      setShowCreateEvent(false);
      reset();
    },
    onError: (error: any) => {
      const serverError = error.response?.data;
      let errorMsg = 'Không thể tạo sự kiện';
      if (serverError?.errors) {
        errorMsg = Object.entries(serverError.errors)
          .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
          .join('; ');
      } else if (serverError?.message || serverError?.Message) {
        errorMsg = serverError.message || serverError.Message;
      }
      toast.error(errorMsg);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: (d: any) => eventApi.update(editEventTarget.id, d),
    onSuccess: () => {
      toast.success('Cập nhật sự kiện thành công!');
      qc.invalidateQueries({ queryKey: ['club-events', id] });
      setEditEventTarget(null);
      reset();
    },
    onError: () => toast.error('Không thể cập nhật sự kiện'),
  });

  const cancelEventMutation = useMutation({
    mutationFn: (eventId: string) => eventApi.cancel(eventId),
    onSuccess: () => {
      toast.success('Đã hủy sự kiện');
      qc.invalidateQueries({ queryKey: ['club-events', id] });
    },
    onError: () => toast.error('Không thể hủy sự kiện'),
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) return <PageSpinner />;
  const club = clubRes?.data?.data;
  const members: any[] = membersRes?.data?.data ?? [];
  const events: any[] = eventsRes?.data?.data ?? [];

  if (!club) return <div className="text-center py-12 text-slate-500">CLB không tồn tại</div>;

  const openEditEvent = (event: any) => {
    setEditEventTarget(event);
    setValue('title', event.title);
    setValue('description', event.description);
    setValue('expectedDate', event.expectedDate ? event.expectedDate.slice(0, 16) : '');
    setValue('location', event.location);
  };

  const clubStatusDisplay = getClubStatusDisplay(club.status);

  return (
    <div>
      <Link to="/clubs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-5 transition-colors">
        <ArrowLeft size={16} /> Quay lại danh sách
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
                <Badge className={getStatusColor(clubStatusDisplay)}>{clubStatusDisplay}</Badge>
              </div>
              {club.category && <p className="text-sm text-slate-500 mt-0.5">{club.category}{club.establishedDate ? ` • Thành lập ${formatDate(club.establishedDate)}` : ''}</p>}
            </div>
            {/* Tạo sự kiện: chỉ Admin/Advisor hoặc ClubManager của club này */}
            {isManagerOfThisClub && (
              <Button icon={<Plus size={16} />} size="sm" onClick={() => { reset(); setShowCreateEvent(true); }}>Tạo sự kiện</Button>
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
            {t === 'info' ? 'Thông tin' : t === 'members' ? `Thành viên (${members.length})` : `Sự kiện (${events.length})`}
          </button>
        ))}
      </div>

      {/* ── Members Tab ───────────────────────────────────────────────────── */}
      {tab === 'members' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Thành viên</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tham gia</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  {isManagerOfThisClub && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.map((m: any) => {
                  const mappedStatus = memberStatusMap[m.status] ?? String(m.status);
                  const isPending = m.status === 0 || m.status === 'Pending';
                  const roleLabel = ClubRoleLabel[m.role] ?? `Role ${m.role}`;
                  const roleIcon = m.role === 2 ? <Crown size={12} className="text-amber-500" /> :
                    m.role === 1 ? <Wallet size={12} className="text-emerald-500" /> : null;
                  return (
                    <tr key={m.id || m.userId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {m.fullName?.charAt(0) ?? m.userId?.charAt(0)?.toUpperCase() ?? 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{m.fullName || `Thành viên (${m.userId?.slice(0, 8)}...)`}</p>
                            <p className="text-xs text-slate-400">{m.email || m.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isManagerOfThisClub && !isPending ? (
                          <select
                            value={m.role ?? 0}
                            onChange={(e) => approveMemberMutation.mutate({
                              userId: m.userId,
                              role: parseInt(e.target.value),
                              status: 1,
                            })}
                            className="text-sm text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          >
                            <option value={0}>Thành viên</option>
                            <option value={1}>Quản lý CLB</option>
                            <option value={2}>Chủ nhiệm</option>
                          </select>
                        ) : (
                          <span className="flex items-center gap-1.5 text-sm text-slate-600">
                            {roleIcon} {roleLabel}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(m.joinedAt || m.joinDate)}</td>
                      <td className="px-6 py-4"><Badge className={getStatusColor(mappedStatus)}>{mappedStatus}</Badge></td>
                      {isManagerOfThisClub && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => approveMemberMutation.mutate({ userId: m.userId, role: 0, status: 1 })}
                                  disabled={approveMemberMutation.isPending}
                                  className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >Duyệt</button>
                                <button
                                  onClick={() => removeMutation.mutate(m.userId)}
                                  disabled={removeMutation.isPending}
                                  className="text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >Từ chối</button>
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

      {/* ── Events Tab ────────────────────────────────────────────────────── */}
      {tab === 'events' && (
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100">
              <Calendar size={40} className="mx-auto mb-3 text-slate-200" />
              <p>Chưa có sự kiện nào</p>
              {isManagerOfThisClub && (
                <Button icon={<Plus size={14} />} size="sm" className="mt-4" onClick={() => { reset(); setShowCreateEvent(true); }}>Tạo sự kiện đầu tiên</Button>
              )}
            </div>
          ) : events.map((e: any) => {
            const statusLabel = EventStatusLabel[e.status] ?? EventStatusMap[e.status] ?? String(e.status);
            const isCancellable = e.status !== 4 && e.status !== 5 && e.status !== 'Completed' && e.status !== 'Cancelled';
            return (
              <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Calendar size={22} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-800">{e.title}</h3>
                    <Badge className={getStatusColor(statusLabel)}>{statusLabel}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{e.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar size={12} />{formatDateTime(e.expectedDate)}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{e.location}</span>
                  </div>
                </div>
                {isManagerOfThisClub && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => openEditEvent(e)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                      <Edit2 size={14} />
                    </button>
                    {isCancellable && (
                      <button onClick={() => cancelEventMutation.mutate(e.id)}
                        disabled={cancelEventMutation.isPending}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
                        <Ban size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Info Tab ──────────────────────────────────────────────────────── */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Thông tin chi tiết</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Tên CLB', value: club.name },
              { label: 'Trạng thái', value: clubStatusDisplay },
              { label: 'Danh mục', value: club.category || 'N/A' },
              { label: 'Ngày thành lập', value: club.establishedDate ? formatDate(club.establishedDate) : 'N/A' },
              { label: 'Số thành viên', value: members.length },
              { label: 'Số sự kiện', value: events.length },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-700">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Event Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showCreateEvent}
        onClose={() => { setShowCreateEvent(false); reset(); }}
        title="Tạo sự kiện mới"
      >
        <form onSubmit={handleSubmit(d => createEventMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên sự kiện * <span className="text-xs text-slate-400 font-normal">(3 - 200 ký tự)</span>
            </label>
            <input
              {...register('title', {
                required: 'Vui lòng nhập tên sự kiện',
                minLength: { value: 3, message: 'Tối thiểu 3 ký tự' },
                maxLength: { value: 200, message: 'Tối đa 200 ký tự' },
              })}
              className="input-field"
              placeholder="VD: Hội nghị CLB..."
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mô tả * <span className="text-xs text-slate-400 font-normal">(tối đa 1000 ký tự)</span>
            </label>
            <textarea
              {...register('description', {
                required: 'Vui lòng nhập mô tả',
                maxLength: { value: 1000, message: 'Tối đa 1000 ký tự' },
              })}
              rows={3}
              className="input-field resize-none"
              placeholder="Mô tả chi tiết nội dung sự kiện..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ngày & Giờ dự kiến *
            </label>
            <input
              {...register('expectedDate', { required: 'Vui lòng chọn ngày' })}
              type="datetime-local"
              className="input-field"
            />
            {errors.expectedDate && <p className="text-red-500 text-xs mt-1">{errors.expectedDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Địa điểm * <span className="text-xs text-slate-400 font-normal">(tối đa 250 ký tự)</span>
            </label>
            <input
              {...register('location', {
                required: 'Vui lòng nhập địa điểm',
                maxLength: { value: 250, message: 'Tối đa 250 ký tự' },
              })}
              className="input-field"
              placeholder="Phòng học, hội trường..."
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowCreateEvent(false); reset(); }}>Hủy</Button>
            <Button type="submit" loading={createEventMutation.isPending}>Tạo sự kiện</Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Event Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editEventTarget}
        onClose={() => { setEditEventTarget(null); reset(); }}
        title="Chỉnh sửa sự kiện"
      >
        <form onSubmit={handleSubmit(d => updateEventMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên sự kiện *</label>
            <input {...register('title', { required: true, minLength: 3, maxLength: 200 })} className="input-field" />
            {errors.title && <p className="text-red-500 text-xs mt-1">Tên phải từ 3-200 ký tự</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả *</label>
            <textarea {...register('description', { required: true, maxLength: 1000 })} rows={3} className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày & Giờ dự kiến *</label>
            <input {...register('expectedDate', { required: true })} type="datetime-local" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm *</label>
            <input {...register('location', { required: true, maxLength: 250 })} className="input-field" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setEditEventTarget(null); reset(); }}>Hủy</Button>
            <Button type="submit" loading={updateEventMutation.isPending}>Cập nhật</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
