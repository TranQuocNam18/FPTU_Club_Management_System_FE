import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { clubApi } from '../../api/club.api';
import { eventApi } from '../../api/event.api';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { getStatusColor, formatDateTime } from '../../utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ClubEvent } from '../../types';

export default function EventsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const { data: clubsRes } = useQuery({ queryKey: ['clubs'], queryFn: () => clubApi.getAll() });
  const clubs = clubsRes?.data?.data ?? [];

  const { data: eventsRes, isLoading } = useQuery({
    queryKey: ['events', selectedClubId],
    queryFn: () => eventApi.getByClub(selectedClubId),
    enabled: !!selectedClubId,
  });
  const events: ClubEvent[] = (eventsRes as any)?.data?.data ?? [];

  // Calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsOnDay = (day: Date) => events.filter(e => {
    try { return isSameDay(parseISO(e.startTime), day); } catch { return false; }
  });

  const selectedDayEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  if (isLoading && selectedClubId) return <PageSpinner />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lịch hoạt động</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi lịch sinh hoạt và sự kiện của các CLB</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClubId}
            onChange={e => setSelectedClubId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Chọn CLB</option>
            {clubs.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
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
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-800">
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

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
              ))}
            </div>

            {/* Days grid */}
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
                      ${!isCurrentMonth && !isSelected && !isTodays ? 'text-slate-400' : ''}
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

          {/* Day Events Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              {selectedDay ? format(selectedDay, 'EEEE, dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
            </h3>
            {!selectedClubId ? (
              <p className="text-sm text-slate-400 text-center py-8">Chọn CLB để xem sự kiện</p>
            ) : selectedDayEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">Không có sự kiện</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map(e => (
                  <div key={e.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-sm font-medium text-slate-800 flex-1 truncate">{e.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 pl-4">
                      <span className="flex items-center gap-1"><Clock size={11} />{format(parseISO(e.startTime), 'HH:mm')}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{e.location}</span>
                    </div>
                    <div className="pl-4 mt-1.5">
                      <Badge className={getStatusColor(e.status)}>{e.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {!selectedClubId ? (
            <div className="text-center py-16 text-slate-400">
              <Building2 size={40} className="mx-auto mb-3 text-slate-200" />
              <p>Chọn câu lạc bộ để xem danh sách sự kiện</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Chưa có sự kiện nào</div>
          ) : events.map(e => (
            <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-indigo-600">{format(parseISO(e.startTime), 'd')}</span>
                <span className="text-xs text-indigo-400">{format(parseISO(e.startTime), 'MMM', { locale: vi })}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-800">{e.title}</h3>
                  <Badge className={getStatusColor(e.status)}>{e.status}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{e.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={12} />{formatDateTime(e.startTime)} – {format(parseISO(e.endTime), 'HH:mm')}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} />{e.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
