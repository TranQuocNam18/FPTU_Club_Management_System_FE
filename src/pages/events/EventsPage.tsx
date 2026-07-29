import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Edit3, MapPin, Plus, Search, Send, ShieldCheck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import { eventApi } from '../../api/event.api';
import { EventForm } from '../../components/events/EventForm';
import {
  EventCard,
  EventDateTime,
  EventEmptyState,
  EventErrorState,
  EventSkeleton,
  EventStatusBadge,
} from '../../components/events/EventPrimitives';
import { canonicalEventStatus } from '../../components/events/eventUtils';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useAuthStore } from '../../stores/authStore';
import type { Club, ClubEvent, CreateEventRequest } from '../../types';
import { EventStatusLabel } from '../../types';
import { getApiError } from '../../utils';

type Action = 'submit' | 'approve' | 'reject' | 'complete' | 'cancel';
type FormMode = 'create' | 'edit' | null;

const actionLabels: Record<Action, string> = {
  submit: 'Gửi duyệt',
  approve: 'Phê duyệt',
  reject: 'Từ chối',
  complete: 'Hoàn thành',
  cancel: 'Hủy sự kiện',
};

export default function EventsPage() {
  const scope = useGsapReveal<HTMLDivElement>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [clubFilter, setClubFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [pendingAction, setPendingAction] = useState<{ event: ClubEvent; action: Action } | null>(null);
  const [referenceTime] = useState(() => Date.now());
  const debouncedSearch = useDebouncedValue(search.trim().toLocaleLowerCase('vi-VN'));
  const isAdmin = user?.role === 'StudentAffairsAdmin';

  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: () => clubApi.getAll() });
  const membershipsQuery = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: clubApi.getMyMemberships,
    enabled: Boolean(user?.id),
  });
  const clubs = useMemo(() => clubsQuery.data?.data.data ?? [], [clubsQuery.data]);
  const memberships = useMemo(() => membershipsQuery.data?.data.data ?? [], [membershipsQuery.data]);
  const manageableClubIds = useMemo(() => new Set(
    memberships
      .filter((membership) => Number(membership.role) === 2 && Number(membership.status) === 1)
      .map((membership) => membership.clubId),
  ), [memberships]);
  const manageableClubs = isAdmin ? clubs : clubs.filter((club) => manageableClubIds.has(club.id));
  const clubMap = useMemo(() => new Map(clubs.map((club) => [club.id, club])), [clubs]);

  const eventsQuery = useQuery({
    queryKey: ['events', clubFilter || 'all', clubs.map((club) => club.id).join(',')],
    queryFn: async () => {
      const sourceClubs = clubFilter ? clubs.filter((club) => club.id === clubFilter) : clubs;
      const responses = await Promise.all(sourceClubs.map(async (club) => {
        const response = await eventApi.getByClub(club.id);
        return response.data.data;
      }));
      return responses.flat();
    },
    enabled: clubsQuery.isSuccess && clubs.length > 0,
  });
  const allEvents = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const visibleEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const status = canonicalEventStatus(event);
      if (!isAdmin && !manageableClubIds.has(event.clubId) && !['Approved', 'Completed'].includes(status)) return false;
      if (statusFilter && status !== statusFilter) return false;
      const timestamp = Date.parse(event.expectedDate);
      if (timeFilter === 'upcoming' && (!Number.isFinite(timestamp) || timestamp < referenceTime)) return false;
      if (timeFilter === 'past' && (!Number.isFinite(timestamp) || timestamp >= referenceTime)) return false;
      const haystack = `${event.title} ${event.description} ${event.location} ${clubMap.get(event.clubId)?.name ?? ''}`.toLocaleLowerCase('vi-VN');
      return !debouncedSearch || haystack.includes(debouncedSearch);
    }).sort((a, b) => Date.parse(a.expectedDate) - Date.parse(b.expectedDate));
  }, [allEvents, clubMap, debouncedSearch, isAdmin, manageableClubIds, referenceTime, statusFilter, timeFilter]);

  const detailQuery = useQuery({
    queryKey: ['event', selectedId],
    queryFn: () => eventApi.getById(selectedId!),
    enabled: Boolean(selectedId),
  });
  const selectedEvent = detailQuery.data?.data.data ?? allEvents.find((event) => event.id === selectedId) ?? null;

  const refreshEvents = async (event: ClubEvent) => {
    await queryClient.invalidateQueries({ queryKey: ['events'] });
    await queryClient.invalidateQueries({ queryKey: ['club-events', event.clubId] });
    await queryClient.invalidateQueries({ queryKey: ['event', event.id] });
  };
  const workflowMutation = useMutation({
    mutationFn: async ({ event, action }: { event: ClubEvent; action: Action }) => {
      await eventApi[action](event.id);
    },
    onSuccess: async (_, values) => {
      toast.success(`${actionLabels[values.action]} thành công.`);
      setPendingAction(null);
      await refreshEvents(values.event);
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể cập nhật sự kiện.')),
  });
  const formMutation = useMutation({
    mutationFn: async (values: CreateEventRequest) => {
      if (formMode === 'edit' && selectedEvent) {
        return eventApi.update(selectedEvent.id, values);
      }
      return eventApi.create(values);
    },
    onSuccess: async (response) => {
      toast.success(formMode === 'edit' ? 'Đã cập nhật sự kiện.' : 'Đã tạo bản nháp sự kiện.');
      setFormMode(null);
      setSelectedId(response.data.data.id);
      await refreshEvents(response.data.data);
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể lưu sự kiện.')),
  });

  const isClubLeader = (event: ClubEvent) => manageableClubIds.has(event.clubId);
  const actionList = (event: ClubEvent): Action[] => {
    const status = canonicalEventStatus(event);
    const actions: Action[] = [];
    if (isClubLeader(event) && ['Draft', 'Rejected'].includes(status)) actions.push('submit');
    if (isAdmin && status === 'PendingApproval') actions.push('approve', 'reject');
    if ((isClubLeader(event) || isAdmin) && status === 'Approved') actions.push('complete');
    if ((isClubLeader(event) && ['Draft', 'PendingApproval'].includes(status)) || (isAdmin && ['PendingApproval', 'Approved'].includes(status))) actions.push('cancel');
    return actions;
  };

  return (
    <div ref={scope} className="events-page">
      <header className="events-header" data-gsap-item>
        <div><p className="events-eyebrow">Academic activities</p><h1>Quản lý Sự kiện & Hoạt động</h1><p>Theo dõi, chuẩn bị, tạo mới và phê duyệt sự kiện theo đúng workflow.</p></div>
        {(isAdmin || manageableClubs.length > 0) && <Button icon={<Plus size={17} />} onClick={() => { setSelectedId(null); setFormMode('create'); }}>Tạo sự kiện</Button>}
      </header>

      {!isAdmin && membershipsQuery.isError && <div className="events-capability-error" role="alert">Không thể xác định ClubLeader membership; thao tác quản lý đang được khóa.</div>}

      <section className="event-filters" aria-label="Bộ lọc sự kiện" data-gsap-item>
        <label className="event-search"><span>Tìm kiếm</span><div><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tiêu đề, địa điểm hoặc CLB..." /></div></label>
        <label><span>Câu lạc bộ</span><select value={clubFilter} onChange={(event) => setClubFilter(event.target.value)}><option value="">Tất cả</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
        <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tất cả</option>{['Draft', 'PendingApproval', 'Approved', 'Rejected', 'Completed', 'Cancelled'].map((status) => <option key={status} value={status}>{EventStatusLabel[status] ?? status}</option>)}</select></label>
        <label><span>Thời gian</span><select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as typeof timeFilter)}><option value="all">Tất cả</option><option value="upcoming">Sắp tới</option><option value="past">Đã qua</option></select></label>
        {(search || clubFilter || statusFilter || timeFilter !== 'all') && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setClubFilter(''); setStatusFilter(''); setTimeFilter('all'); }}>Xóa bộ lọc</Button>}
      </section>

      {clubsQuery.isLoading || eventsQuery.isLoading ? <EventSkeleton /> : clubsQuery.isError || eventsQuery.isError ? (
        <EventErrorState onRetry={() => { clubsQuery.refetch(); eventsQuery.refetch(); }} />
      ) : visibleEvents.length === 0 ? <EventEmptyState /> : (
        <div className="event-grid">{visibleEvents.map((event) => <EventCard key={event.id} event={event} clubName={clubMap.get(event.clubId)?.name} onOpen={() => setSelectedId(event.id)} />)}</div>
      )}

      <Modal isOpen={Boolean(selectedId) && formMode === null} onClose={() => setSelectedId(null)} title="Chi tiết sự kiện" size="lg">
        {detailQuery.isLoading && !selectedEvent ? <EventSkeleton /> : selectedEvent && (
          <div className="event-detail">
            <div className="event-detail__head"><div><p>{clubMap.get(selectedEvent.clubId)?.name ?? 'Câu lạc bộ chưa xác định'}</p><h2>{selectedEvent.title}</h2></div><EventStatusBadge event={selectedEvent} /></div>
            <p className="event-detail__description">{selectedEvent.description || 'Không có mô tả.'}</p>
            <dl>
              <div><dt><CalendarDays size={16} />Thời gian</dt><dd><EventDateTime value={selectedEvent.expectedDate} /></dd></div>
              <div><dt><MapPin size={16} />Địa điểm</dt><dd>{selectedEvent.location || 'Chưa có địa điểm'}</dd></div>
            </dl>
            <div className="event-detail__actions">
              {isClubLeader(selectedEvent) && ['Draft', 'Rejected'].includes(canonicalEventStatus(selectedEvent)) && <Button variant="outline" icon={<Edit3 size={16} />} onClick={() => setFormMode('edit')}>Chỉnh sửa</Button>}
              {actionList(selectedEvent).map((action) => <Button key={action} variant={action === 'reject' || action === 'cancel' ? 'danger' : 'primary'} icon={action === 'submit' ? <Send size={16} /> : action === 'approve' || action === 'complete' ? <CheckCircle2 size={16} /> : <XCircle size={16} />} onClick={() => setPendingAction({ event: selectedEvent, action })}>{actionLabels[action]}</Button>)}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={formMode !== null} onClose={() => !formMutation.isPending && setFormMode(null)} title={formMode === 'edit' ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện'} size="lg">
        <EventForm clubs={formMode === 'edit' && selectedEvent ? [clubMap.get(selectedEvent.clubId)].filter((club): club is Club => Boolean(club)) : manageableClubs} event={formMode === 'edit' ? selectedEvent : null} busy={formMutation.isPending} onCancel={() => setFormMode(null)} onSubmit={(values) => formMutation.mutate(values)} />
      </Modal>

      <Modal isOpen={Boolean(pendingAction)} onClose={() => !workflowMutation.isPending && setPendingAction(null)} title="Xác nhận workflow">
        {pendingAction && <div className="event-confirm"><ShieldCheck size={26} /><h2>{actionLabels[pendingAction.action]} “{pendingAction.event.title}”?</h2><p>Trạng thái hiện tại: <strong>{canonicalEventStatus(pendingAction.event)}</strong>. Giao diện chỉ cập nhật sau khi server xác nhận thành công.</p><div><Button variant="ghost" onClick={() => setPendingAction(null)}>Quay lại</Button><Button variant={pendingAction.action === 'reject' || pendingAction.action === 'cancel' ? 'danger' : 'primary'} loading={workflowMutation.isPending} onClick={() => workflowMutation.mutate(pendingAction)}>Xác nhận</Button></div></div>}
      </Modal>
    </div>
  );
}
