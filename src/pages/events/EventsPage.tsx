import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import { eventApi } from '../../api/event.api';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { getStatusColor, formatDateTime } from '../../utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import type { ClubEvent } from '../../types';
import { EventStatusLabel } from '../../types';

export default function EventsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  const isAdmin = user?.role === 'Admin' || user?.role === 'Advisor';
  const isClubManager = user?.role === 'ClubManager';
  const canManageEvents = isAdmin || isClubManager;

  // ── Fetch clubs ────────────────────────────────────────────────────────────
  const { data: clubsRes } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => clubApi.getAll(),
  });
  const allClubs: any[] = clubsRes?.data?.data ?? [];

  // For ClubManager: only show clubs they manage (role=1 Manager or role=2 President, status=1 Approved)
  const membersQueries = useQueries({
    queries: isClubManager ? allClubs.map(c => ({
      queryKey: ['club-members', c.id],
      queryFn: () => clubApi.getMembers(c.id),
      enabled: allClubs.length > 0,
    })) : [],
  });

  // Clubs available in dropdown filter
  const availableClubs = React.useMemo(() => {
    if (isAdmin) return allClubs;
    if (isClubManager) {
      return allClubs.filter((club, idx) => {
        const query = membersQueries[idx];
        if (!query?.data) return false;
        const members: any[] = query.data.data?.data ?? [];
        return members.some((m: any) =>
          m.userId === user?.id && (m.role === 1 || m.role === 2) && m.status === 1
        );
      });
    }
    return allClubs; // Student sees all clubs for viewing
  }, [allClubs, membersQueries, user, isAdmin, isClubManager]);

  // ── Fetch events ──────────────────────────────────────────────────────────
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', selectedClubId, availableClubs.map(c => c.id).join(',')],
    queryFn: async () => {
      const clubsToFetch = selectedClubId
        ? [allClubs.find(c => c.id === selectedClubId)].filter(Boolean)
        : availableClubs;

      const promises = clubsToFetch.map((c: any) =>
        eventApi.getByClub(c.id)
          .then((res: any) => (res.data?.data ?? []).map((e: any) => ({ ...e, clubName: c.name })))
          .catch(() => [])
      );
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: availableClubs.length > 0 || allClubs.length > 0,
  });
  const eventList: any[] = events ?? [];

  // ── Event form ────────────────────────────────────────────────────────────
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    clubId: string; title: string; description: string; expectedDate: string; location: string;
  }>();

  const createEventMutation = useMutation({
    mutationFn: (d: any) => eventApi.create(d),
    onSuccess: () => {
      toast.success('Tạo sự kiện thành công!');
      qc.invalidateQueries({ queryKey: ['events'] });
      setShowCreateEvent(false);
      reset();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.Message || 'Không thể tạo sự kiện';
      toast.error(msg);
    },
  });

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsOnDay = (day: Date) => eventList.filter(e => {
    try { return isSameDay(parseISO(e.expectedDate), day); } catch { return false; }
  });
  const selectedDayEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  if (isLoading && allClubs.length > 0) return <PageSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lịch hoạt động</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi lịch sinh hoạt và sự kiện của các CLB</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Club filter */}
          <select
            value={selectedClubId}
            onChange={e => setSelectedClubId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Tất cả câu lạc bộ</option>
            {allClubs.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Tạo sự kiện: chỉ Admin/Advisor/ClubManager */}
          {canManageEvents && (
            <Button icon={<Plus size={16} />} onClick={() => { reset(); setShowCreateEvent(true); }}>
              Tạo sự kiện
            </Button>
          )}

          {/* View toggle */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['calendar', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                {v === 'calendar' ? 'Lịch' : 'Danh sách'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800 capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: vi })}
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
                    Hôm nay
                  </button>
                  <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2 border-b border-slate-100 pb-2">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map(day => {
                  const dayEvents = eventsOnDay(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const isTodays = isToday(day);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={`calendar-grid-cell ${!isCurrentMonth ? 'opacity-30' : ''}`}
                    >
                      <span className={`calendar-day-badge
                        ${isSelected ? 'selected' : ''}
                        ${isTodays ? 'today' : ''}
                        ${isCurrentMonth && !isSelected && !isTodays ? 'text-slate-700' : ''}
                      `}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-1 mt-1 justify-center h-1.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-indigo-500'}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Bản nháp</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Chờ duyệt</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đã duyệt</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Hoàn thành</span>
            </div>
          </div>

          {/* Day Events Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Sự kiện ngày:</span>
              <span className="text-indigo-600 font-medium">{selectedDay ? format(selectedDay, 'dd/MM/yyyy') : 'Chọn ngày'}</span>
            </h3>
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-16">
                <Calendar size={36} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">Không có sự kiện diễn ra</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {selectedDayEvents.map(e => {
                  const statusLabel = EventStatusLabel[e.status] ?? String(e.status);
                  return (
                    <div key={e.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 hover:shadow-sm transition-all group">
                      {e.clubName && <div className="text-[10px] text-indigo-600 font-semibold mb-1 truncate">{e.clubName}</div>}
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{e.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Clock size={11} />{format(parseISO(e.expectedDate), 'HH:mm')}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} />{e.location}</span>
                      </div>
                      <div className="mt-2.5">
                        <Badge className={getStatusColor(statusLabel)}>{statusLabel}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {eventList.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
              <Calendar size={40} className="mx-auto mb-3 text-slate-200" />
              <p>Chưa có sự kiện nào</p>
            </div>
          ) : eventList.map(e => {
            const statusLabel = EventStatusLabel[e.status] ?? String(e.status);
            return (
              <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex flex-col items-center justify-center flex-shrink-0 text-white shadow-sm">
                  <span className="text-lg font-bold leading-none">{format(parseISO(e.expectedDate), 'd')}</span>
                  <span className="text-[10px] uppercase font-semibold mt-1">{format(parseISO(e.expectedDate), 'MMM', { locale: vi })}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {e.clubName && <div className="text-xs font-semibold text-indigo-600 mb-1">{e.clubName}</div>}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{e.title}</h3>
                    <Badge className={getStatusColor(statusLabel)}>{statusLabel}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{e.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={12} />{formatDateTime(e.expectedDate)}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{e.location}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Event Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showCreateEvent} onClose={() => { setShowCreateEvent(false); reset(); }} title="Tạo sự kiện mới">
        <form onSubmit={handleSubmit(d => createEventMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Câu lạc bộ *</label>
            <select {...register('clubId', { required: 'Chọn CLB' })} className="input-field">
              <option value="">-- Chọn CLB --</option>
              {(isAdmin ? allClubs : availableClubs).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.clubId && <p className="text-red-500 text-xs mt-1">{errors.clubId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên sự kiện *</label>
            <input {...register('title', { required: true, minLength: 3, maxLength: 200 })} className="input-field" placeholder="VD: Hội nghị CLB..." />
            {errors.title && <p className="text-red-500 text-xs mt-1">Tên phải từ 3-200 ký tự</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả *</label>
            <textarea {...register('description', { required: true, maxLength: 1000 })} rows={3} className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ngày & Giờ dự kiến *</label>
            <input {...register('expectedDate', { required: 'Chọn ngày tổ chức' })} type="datetime-local" className="input-field" />
            {errors.expectedDate && <p className="text-red-500 text-xs mt-1">{errors.expectedDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm *</label>
            <input {...register('location', { required: true, maxLength: 250 })} className="input-field" placeholder="Phòng học, hội trường..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => { setShowCreateEvent(false); reset(); }}>Hủy</Button>
            <Button type="submit" loading={createEventMutation.isPending}>Tạo sự kiện</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
