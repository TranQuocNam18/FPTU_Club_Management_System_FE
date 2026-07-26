import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardCheck,
  Edit2,
  MapPin,
  Plus,
  UserMinus,
  UsersRound,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import { eventApi } from '../../api/event.api';
import { reportApi } from '../../api/report.api';
import {
  ClubEmptyState,
  ClubErrorState,
  ClubLogo,
  ClubSection,
  ClubStatusBadge,
  ConfirmDialog,
  MembershipStatusBadge,
} from '../../components/clubs/ClubPrimitives';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useAuthStore } from '../../stores/authStore';
import type { ActivityReport, ClubEvent, ClubMember, CreateEventRequest } from '../../types';
import {
  ClubRoleLabel,
  EventStatusLabel,
  EventStatusMap,
  MembershipStatusMap,
  ReportStatusMap,
} from '../../types';
import { formatDate, formatDateTime, getApiError, getStatusColor } from '../../utils';

type ClubTab = 'overview' | 'members' | 'events' | 'reports';
type EventFormValues = Omit<CreateEventRequest, 'clubId'>;

export default function ClubDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ClubTab>('overview');
  const [eventModal, setEventModal] = useState<'create' | 'edit' | null>(null);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ClubMember | null>(null);
  const scopeRef = useGsapReveal<HTMLDivElement>({ animationKey: `club-detail-${id}` });
  const isAdmin = user?.role === 'StudentAffairsAdmin';
  const isStudent = user?.role === 'Student';

  const clubQuery = useQuery({
    queryKey: ['club', id],
    queryFn: () => clubApi.getById(id),
    enabled: Boolean(id),
  });
  const membershipsQuery = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: clubApi.getMyMemberships,
    enabled: Boolean(user?.id),
  });
  const myMembership = (membershipsQuery.data?.data.data ?? []).find((membership) => membership.clubId === id);
  const isApprovedLeader = Boolean(
    myMembership && Number(myMembership.role) === 2 && Number(myMembership.status) === 1,
  );
  const canManageMembers = isAdmin || isApprovedLeader;
  const canManageEvents = isAdmin || isApprovedLeader;
  const canViewReports = isAdmin || isApprovedLeader;

  const membersQuery = useQuery({
    queryKey: ['club-members', id],
    queryFn: () => clubApi.getMembers(id),
    enabled: Boolean(id && tab === 'members'),
  });
  const eventsQuery = useQuery({
    queryKey: ['club-events', id],
    queryFn: () => eventApi.getByClub(id),
    enabled: Boolean(id && tab === 'events'),
  });
  const reportsQuery = useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportApi.getByClub(id),
    enabled: Boolean(id && tab === 'reports' && canViewReports),
  });

  const members = useMemo(() => membersQuery.data?.data.data ?? [], [membersQuery.data]);
  const events = useMemo(() => (eventsQuery.data?.data.data ?? []) as ClubEvent[], [eventsQuery.data]);
  const reports = useMemo(() => reportsQuery.data?.data.data ?? [], [reportsQuery.data]);
  const pendingMembers = members.filter((member) => MembershipStatusMap[member.status] === 'Pending');
  const approvedMembers = members.filter((member) => MembershipStatusMap[member.status] === 'Approved');

  const invalidateMembers = () => queryClient.invalidateQueries({ queryKey: ['club-members', id] });
  const approveMutation = useMutation({
    mutationFn: (userId: string) => clubApi.approveMember(id, userId),
    onSuccess: async () => { toast.success('Đã duyệt yêu cầu gia nhập.'); await invalidateMembers(); },
    onError: () => toast.error('Không thể duyệt yêu cầu gia nhập.'),
  });
  const rejectMutation = useMutation({
    mutationFn: (userId: string) => clubApi.rejectMember(id, userId),
    onSuccess: async () => { toast.success('Đã từ chối yêu cầu gia nhập.'); await invalidateMembers(); },
    onError: () => toast.error('Không thể từ chối yêu cầu gia nhập.'),
  });
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: number }) => clubApi.updateMemberRole(id, userId, role, 1),
    onSuccess: async () => { toast.success('Đã cập nhật vai trò.'); await invalidateMembers(); },
    onError: () => toast.error('Không thể cập nhật vai trò.'),
  });
  const removeMutation = useMutation({
    mutationFn: (userId: string) => clubApi.removeMember(id, userId),
    onSuccess: async () => {
      toast.success('Đã xóa thành viên khỏi CLB.');
      setRemoveTarget(null);
      await invalidateMembers();
    },
    onError: () => toast.error('Không thể xóa thành viên.'),
  });
  const joinMutation = useMutation({
    mutationFn: () => clubApi.joinClub(id),
    onSuccess: async () => {
      toast.success('Đã gửi yêu cầu gia nhập CLB.');
      await queryClient.invalidateQueries({ queryKey: ['my-memberships', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
    onError: () => toast.error('Không thể gửi yêu cầu gia nhập CLB.'),
  });

  const eventForm = useForm<EventFormValues>();
  const createEventMutation = useMutation({
    mutationFn: (values: EventFormValues) => eventApi.create({ ...values, clubId: id }),
    onSuccess: async () => {
      toast.success('Tạo sự kiện thành công.');
      closeEventModal();
      await queryClient.invalidateQueries({ queryKey: ['club-events', id] });
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể tạo sự kiện.')),
  });
  const updateEventMutation = useMutation({
    mutationFn: (values: EventFormValues) => eventApi.update(editingEvent!.id, values),
    onSuccess: async () => {
      toast.success('Cập nhật sự kiện thành công.');
      closeEventModal();
      await queryClient.invalidateQueries({ queryKey: ['club-events', id] });
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể cập nhật sự kiện.')),
  });
  const cancelEventMutation = useMutation({
    mutationFn: (eventId: string) => eventApi.cancel(eventId),
    onSuccess: async () => {
      toast.success('Đã hủy sự kiện.');
      await queryClient.invalidateQueries({ queryKey: ['club-events', id] });
    },
    onError: () => toast.error('Không thể hủy sự kiện.'),
  });

  function closeEventModal() {
    setEventModal(null);
    setEditingEvent(null);
    eventForm.reset();
  }

  function openEditEvent(event: ClubEvent) {
    setEditingEvent(event);
    eventForm.reset({
      title: event.title,
      description: event.description,
      expectedDate: event.expectedDate.slice(0, 16),
      location: event.location,
    });
    setEventModal('edit');
  }

  if (clubQuery.isLoading) {
    return <div className="club-detail-skeleton" role="status" aria-label="Đang tải thông tin câu lạc bộ"><Skeleton className="h-64 w-full bg-slate-200" /><Skeleton className="mt-5 h-16 w-full bg-slate-200" /></div>;
  }
  if (clubQuery.isError) {
    return <ClubErrorState message="Không thể tải thông tin câu lạc bộ." onRetry={() => void clubQuery.refetch()} />;
  }
  const club = clubQuery.data?.data.data;
  if (!club) {
    return <ClubEmptyState title="Không tìm thấy câu lạc bộ" description="Câu lạc bộ không tồn tại hoặc không còn khả dụng." action={<Link to="/clubs">Quay lại danh sách</Link>} />;
  }

  const tabs: Array<{ id: ClubTab; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'members', label: 'Thành viên' },
    { id: 'events', label: 'Sự kiện' },
    ...(canViewReports ? [{ id: 'reports' as const, label: 'Báo cáo' }] : []),
  ];
  const membershipResolved = !isStudent || membershipsQuery.isSuccess;

  return (
    <div ref={scopeRef} className="club-detail">
      <Link to="/clubs" className="club-detail__back" data-gsap-item><ArrowLeft size={17} aria-hidden="true" />Danh sách câu lạc bộ</Link>

      <header className="club-hero" data-gsap-item>
        <div className="club-hero__identity">
          <ClubLogo club={club} size="lg" />
          <div>
            <div className="club-hero__title"><h1>{club.name}</h1><ClubStatusBadge status={club.status} /></div>
            {club.category && <p>{club.category}</p>}
            {club.establishedDate && <p>Thành lập {formatDate(club.establishedDate)}</p>}
          </div>
        </div>
        <p className="club-hero__description">{club.description || 'CLB chưa cập nhật mô tả.'}</p>
        <div className="club-hero__actions">
          {isStudent && !membershipResolved && <span className="club-join-pending">Đang kiểm tra membership...</span>}
          {isStudent && membershipResolved && myMembership && <MembershipStatusBadge member={myMembership} />}
          {isStudent && membershipResolved && !myMembership && (
            <Button
              loading={joinMutation.isPending}
              disabled={String(club.status) !== '1' && String(club.status) !== 'Active'}
              onClick={() => joinMutation.mutate()}
              icon={<UsersRound size={17} aria-hidden="true" />}
            >
              Gia nhập câu lạc bộ
            </Button>
          )}
          {canManageEvents && <Button variant="outline" onClick={() => { eventForm.reset(); setEventModal('create'); }} icon={<Plus size={17} aria-hidden="true" />}>Tạo sự kiện</Button>}
        </div>
        {isStudent && membershipsQuery.isError && (
          <ClubErrorState message="Không thể xác định membership nên thao tác gia nhập được ẩn để tránh gửi trùng." onRetry={() => void membershipsQuery.refetch()} />
        )}
      </header>

      <div className="club-tabs" role="tablist" aria-label="Nội dung câu lạc bộ" data-gsap-item>
        {tabs.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`club-panel-${item.id}`}
            id={`club-tab-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            key={item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`club-panel-${tab}`} aria-labelledby={`club-tab-${tab}`} tabIndex={0}>
        {tab === 'overview' && (
          <ClubSection title="Thông tin câu lạc bộ" description="Thông tin trực tiếp từ hồ sơ CLB hiện tại.">
            <dl className="club-facts">
              <div><dt>Trạng thái</dt><dd><ClubStatusBadge status={club.status} /></dd></div>
              {club.category && <div><dt>Danh mục</dt><dd>{club.category}</dd></div>}
              {club.establishedDate && <div><dt>Ngày thành lập</dt><dd>{formatDate(club.establishedDate)}</dd></div>}
              {!club.category && !club.establishedDate && <div><dt>Metadata bổ sung</dt><dd>Chưa được API cung cấp.</dd></div>}
            </dl>
          </ClubSection>
        )}
        {tab === 'members' && (
          <MembersPanel
            query={membersQuery}
            members={approvedMembers}
            pendingMembers={pendingMembers}
            canManage={canManageMembers}
            currentUserId={user?.id}
            onApprove={(userId) => approveMutation.mutate(userId)}
            onReject={(userId) => rejectMutation.mutate(userId)}
            onRoleChange={(userId, role) => roleMutation.mutate({ userId, role })}
            onRemove={setRemoveTarget}
            mutationPending={approveMutation.isPending || rejectMutation.isPending || roleMutation.isPending}
          />
        )}
        {tab === 'events' && (
          <EventsPanel
            query={eventsQuery}
            events={events}
            canManage={canManageEvents}
            onCreate={() => { eventForm.reset(); setEventModal('create'); }}
            onEdit={openEditEvent}
            onCancel={(eventId) => cancelEventMutation.mutate(eventId)}
          />
        )}
        {tab === 'reports' && canViewReports && <ReportsPanel query={reportsQuery} reports={reports} />}
      </div>

      <Modal isOpen={eventModal !== null} onClose={closeEventModal} title={eventModal === 'edit' ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện'}>
        <EventForm
          form={eventForm}
          pending={createEventMutation.isPending || updateEventMutation.isPending}
          onCancel={closeEventModal}
          onSubmit={(values) => eventModal === 'edit' ? updateEventMutation.mutate(values) : createEventMutation.mutate(values)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Xóa thành viên"
        description={`Bạn có chắc muốn xóa ${removeTarget?.fullName || 'thành viên này'} khỏi câu lạc bộ?`}
        confirmLabel="Xóa thành viên"
        pending={removeMutation.isPending}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.userId)}
      />
    </div>
  );
}

function MembersPanel({
  query,
  members,
  pendingMembers,
  canManage,
  currentUserId,
  mutationPending,
  onApprove,
  onReject,
  onRoleChange,
  onRemove,
}: {
  query: ReturnType<typeof useQuery>;
  members: ClubMember[];
  pendingMembers: ClubMember[];
  canManage: boolean;
  currentUserId?: string;
  mutationPending: boolean;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onRoleChange: (userId: string, role: number) => void;
  onRemove: (member: ClubMember) => void;
}) {
  if (query.isLoading) return <ClubMembersSkeleton />;
  if (query.isError) return <ClubErrorState message="Không thể tải danh sách thành viên." onRetry={() => void query.refetch()} />;
  return (
    <div className="club-panel-stack">
      {canManage && (
        <ClubSection title="Yêu cầu gia nhập" description="Sử dụng dedicated approve/reject endpoints hiện có.">
          {pendingMembers.length === 0 ? <ClubEmptyState title="Không có yêu cầu đang chờ" description="Hiện chưa có membership Pending." /> : (
            <div className="join-request-list">
              {pendingMembers.map((member) => (
                <article key={member.id}>
                  <MemberIdentity member={member} />
                  <time dateTime={member.joinedAt}>{formatDate(member.joinedAt)}</time>
                  <div>
                    <Button size="sm" variant="outline" disabled={mutationPending} onClick={() => onReject(member.userId)} icon={<X size={15} aria-hidden="true" />}>Từ chối</Button>
                    <Button size="sm" disabled={mutationPending} onClick={() => onApprove(member.userId)} icon={<Check size={15} aria-hidden="true" />}>Duyệt</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </ClubSection>
      )}
      <ClubSection title="Thành viên" description={`${members.length} membership đã được duyệt trong response hiện tại.`}>
        {members.length === 0 ? <ClubEmptyState title="Chưa có thành viên" description="Không có membership Approved để hiển thị." /> : (
          <div className="member-grid">
            {members.map((member) => (
              <article className="member-card" key={member.id}>
                <MemberIdentity member={member} />
                <div className="member-card__meta">
                  {canManage ? (
                    <label>
                      <span className="sr-only">Vai trò của {member.fullName || member.userId}</span>
                      <select value={Number(member.role)} disabled={mutationPending} onChange={(event) => onRoleChange(member.userId, Number(event.target.value))}>
                        <option value={0}>Thành viên</option>
                        <option value={2}>Chủ nhiệm</option>
                        <option value={3}>Thủ quỹ</option>
                      </select>
                    </label>
                  ) : <Badge className="bg-indigo-100 text-indigo-700">{ClubRoleLabel[member.role] ?? `Role ${member.role}`}</Badge>}
                  <time dateTime={member.joinedAt}>Tham gia {formatDate(member.joinedAt)}</time>
                </div>
                {canManage && member.userId !== currentUserId && (
                  <button type="button" className="member-card__remove" onClick={() => onRemove(member)} aria-label={`Xóa ${member.fullName || 'thành viên'} khỏi CLB`}>
                    <UserMinus size={17} aria-hidden="true" />
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </ClubSection>
    </div>
  );
}

function MemberIdentity({ member }: { member: ClubMember }) {
  const name = member.fullName || `Thành viên ${member.userId.slice(0, 8)}`;
  return (
    <div className="member-identity">
      <Avatar name={name} size="md" />
      <div><strong>{name}</strong><small>{ClubRoleLabel[member.role] ?? `Role ${member.role}`}</small></div>
    </div>
  );
}

function EventsPanel({
  query,
  events,
  canManage,
  onCreate,
  onEdit,
  onCancel,
}: {
  query: ReturnType<typeof useQuery>;
  events: ClubEvent[];
  canManage: boolean;
  onCreate: () => void;
  onEdit: (event: ClubEvent) => void;
  onCancel: (eventId: string) => void;
}) {
  if (query.isLoading) return <ClubMembersSkeleton />;
  if (query.isError) return <ClubErrorState message="Không thể tải sự kiện của CLB." onRetry={() => void query.refetch()} />;
  return (
    <ClubSection title="Sự kiện và hoạt động" description="Dữ liệu trực tiếp từ endpoint sự kiện theo CLB." action={canManage ? <Button size="sm" onClick={onCreate} icon={<Plus size={15} aria-hidden="true" />}>Tạo sự kiện</Button> : undefined}>
      {events.length === 0 ? <ClubEmptyState title="Chưa có sự kiện" description="CLB chưa có sự kiện trong dữ liệu hiện tại." /> : (
        <div className="club-event-list">
          {events.map((event) => {
            const canonical = EventStatusMap[event.status] ?? String(event.status);
            const cancellable = !['Completed', 'Cancelled'].includes(canonical);
            return (
              <article key={event.id}>
                <div className="club-event-list__date"><CalendarDays size={19} aria-hidden="true" /><time dateTime={event.expectedDate}>{formatDateTime(event.expectedDate)}</time></div>
                <div><h3>{event.title}</h3><p><MapPin size={14} aria-hidden="true" />{event.location}</p></div>
                <Badge className={getStatusColor(canonical)}>{EventStatusLabel[event.status] ?? canonical}</Badge>
                {canManage && (
                  <div className="club-event-list__actions">
                    <button type="button" onClick={() => onEdit(event)} aria-label={`Chỉnh sửa ${event.title}`}><Edit2 size={17} aria-hidden="true" /></button>
                    {cancellable && <button type="button" onClick={() => onCancel(event.id)} aria-label={`Hủy ${event.title}`}><X size={17} aria-hidden="true" /></button>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </ClubSection>
  );
}

function ReportsPanel({ query, reports }: { query: ReturnType<typeof useQuery>; reports: ActivityReport[] }) {
  if (query.isLoading) return <ClubMembersSkeleton />;
  if (query.isError) return <ClubErrorState message="Không thể tải báo cáo của CLB." onRetry={() => void query.refetch()} />;
  return (
    <ClubSection title="Báo cáo gần đây" description="Chỉ hiển thị bản xem trước; workflow báo cáo không thay đổi." action={<Link className="club-section-link" to="/reports">Mở trang báo cáo</Link>}>
      {reports.length === 0 ? <ClubEmptyState title="Chưa có báo cáo" description="CLB chưa có báo cáo để hiển thị." /> : (
        <div className="club-report-list">
          {reports.slice(0, 6).map((report) => (
            <article key={report.id}>
              <ClipboardCheck size={19} aria-hidden="true" />
              <div><h3>{report.title}</h3><p>{formatDate(report.createdAt)}</p></div>
              <Badge className={getStatusColor(String(report.status))}>{ReportStatusMap[report.status] ?? String(report.status)}</Badge>
            </article>
          ))}
        </div>
      )}
    </ClubSection>
  );
}

function EventForm({
  form,
  pending,
  onCancel,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<EventFormValues>>;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: EventFormValues) => void;
}) {
  const { register, handleSubmit, formState: { errors } } = form;
  return (
    <form className="club-form" onSubmit={handleSubmit(onSubmit)}>
      <label>Tên sự kiện<input {...register('title', { required: 'Vui lòng nhập tên sự kiện.', minLength: { value: 3, message: 'Tối thiểu 3 ký tự.' }, maxLength: { value: 200, message: 'Tối đa 200 ký tự.' } })} />{errors.title && <span role="alert">{errors.title.message}</span>}</label>
      <label>Mô tả<textarea rows={4} {...register('description', { required: 'Vui lòng nhập mô tả.', maxLength: { value: 1000, message: 'Tối đa 1000 ký tự.' } })} />{errors.description && <span role="alert">{errors.description.message}</span>}</label>
      <label>Ngày và giờ dự kiến<input type="datetime-local" {...register('expectedDate', { required: 'Vui lòng chọn ngày.' })} />{errors.expectedDate && <span role="alert">{errors.expectedDate.message}</span>}</label>
      <label>Địa điểm<input {...register('location', { required: 'Vui lòng nhập địa điểm.', maxLength: { value: 250, message: 'Tối đa 250 ký tự.' } })} />{errors.location && <span role="alert">{errors.location.message}</span>}</label>
      <div><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" loading={pending}>Lưu sự kiện</Button></div>
    </form>
  );
}

function ClubMembersSkeleton() {
  return <div className="club-section" role="status" aria-label="Đang tải dữ liệu"><Skeleton className="h-5 w-40 bg-slate-200" /><Skeleton className="mt-5 h-20 w-full bg-slate-200" /><Skeleton className="mt-3 h-20 w-full bg-slate-200" /></div>;
}
