import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileClock,
  Landmark,
  UsersRound,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardHeader,
  DashboardSection,
  DashboardShell,
  DashboardSkeleton,
  StatCard,
  UnavailableMetric,
} from '../../components/dashboard/DashboardPrimitives';
import { Badge } from '../../components/ui/Badge';
import { clubApi } from '../../api/club.api';
import { eventApi } from '../../api/event.api';
import { reportApi } from '../../api/report.api';
import { useAuthStore } from '../../stores/authStore';
import type { ActivityReport, Club, ClubEvent, ClubMember } from '../../types';
import {
  ClubRoleLabel,
  ClubStatusLabel,
  ClubStatusMap,
  EventStatusMap,
  EventStatusLabel,
  ReportStatusMap,
} from '../../types';
import { formatDate, getRoleLabel, getStatusColor } from '../../utils';
import { useGsapReveal } from '../../hooks/useGsapReveal';

const isApprovedMembership = (membership: ClubMember) => Number(membership.status) === 1;
const isLeader = (membership: ClubMember) => isApprovedMembership(membership) && Number(membership.role) === 2;
const isTreasurer = (membership: ClubMember) => isApprovedMembership(membership) && Number(membership.role) === 3;

function DashboardWelcome({ role }: { role: string }) {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.fullName?.trim() || 'bạn';

  return (
    <DashboardHeader
      eyebrow={getRoleLabel(role)}
      title={`Chào ${displayName}`}
      description="Tổng quan tình hình hoạt động và thông báo mới nhất."
    />
  );
}

function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: clubApi.getAll });
  const membershipsQuery = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: clubApi.getMyMemberships,
    enabled: Boolean(user?.id),
  });

  const clubs = clubsQuery.data?.data.data ?? [];
  const memberships = useMemo(
    () => membershipsQuery.data?.data.data ?? [],
    [membershipsQuery.data],
  );
  const approvedIds = useMemo(
    () => new Set(memberships.filter(isApprovedMembership).map((membership) => membership.clubId)),
    [memberships],
  );
  const pendingIds = useMemo(
    () => new Set(memberships.filter((membership) => Number(membership.status) === 0).map((membership) => membership.clubId)),
    [memberships],
  );
  const myClubs = clubs.filter((club) => approvedIds.has(club.id));
  const discoverClubs = clubs
    .filter((club) => !approvedIds.has(club.id) && !pendingIds.has(club.id) && ClubStatusMap[club.status] === 'Active')
    .slice(0, 6);

  return (
    <>
      <DashboardWelcome role="Student" />
      <div className="dashboard-stats">
        <StatCard label="CLB đang tham gia" value={myClubs.length} supportingText="Số câu lạc bộ bạn đang tham gia" icon={<UsersRound size={20} />} />
        <StatCard label="Yêu cầu đang chờ" value={pendingIds.size} supportingText="Đơn gia nhập đang đợi duyệt" icon={<FileClock size={20} />} tone="warning" />
        <StatCard label="CLB có thể khám phá" value={discoverClubs.length} supportingText="Câu lạc bộ mới sẵn sàng tham gia" icon={<Compass size={20} />} tone="neutral" />
      </div>

      <div className="dashboard-columns">
        <DashboardSection
          title="Câu lạc bộ của tôi"
          description="Danh sách câu lạc bộ bạn đã gia nhập."
          action={{ label: 'Xem tất cả CLB', to: '/clubs' }}
          busy={clubsQuery.isLoading || membershipsQuery.isLoading}
        >
          {clubsQuery.isLoading || membershipsQuery.isLoading ? (
            <DashboardSkeleton cards={2} />
          ) : clubsQuery.isError || membershipsQuery.isError ? (
            <DashboardErrorState
              message="Không thể tải câu lạc bộ hoặc membership của bạn."
              onRetry={() => {
                void clubsQuery.refetch();
                void membershipsQuery.refetch();
              }}
            />
          ) : myClubs.length === 0 ? (
            <DashboardEmptyState
              title="Bạn chưa tham gia câu lạc bộ nào"
              description="Khám phá các câu lạc bộ đang hoạt động và gửi yêu cầu tham gia."
              action={{ label: 'Khám phá câu lạc bộ', to: '/clubs' }}
            />
          ) : (
            <ClubGrid clubs={myClubs} />
          )}
        </DashboardSection>

        <DashboardSection title="Khám phá câu lạc bộ" description="Gợi ý từ danh sách CLB đang hoạt động.">
          {clubsQuery.isLoading ? (
            <DashboardSkeleton cards={2} />
          ) : clubsQuery.isError ? (
            <DashboardErrorState message="Không thể tải danh sách câu lạc bộ." onRetry={() => void clubsQuery.refetch()} />
          ) : discoverClubs.length === 0 ? (
            <DashboardEmptyState title="Chưa có gợi ý phù hợp" description="Không có CLB hoạt động mới để hiển thị ở thời điểm này." />
          ) : (
            <ClubGrid clubs={discoverClubs} compact />
          )}
        </DashboardSection>
      </div>
    </>
  );
}

function ClubGrid({ clubs, compact = false }: { clubs: Club[]; compact?: boolean }) {
  return (
    <div className={compact ? 'dashboard-club-list' : 'dashboard-club-grid'}>
      {clubs.map((club) => (
        <Link to={`/clubs/${club.id}`} className="dashboard-club" key={club.id}>
          <span className="dashboard-club__mark" aria-hidden="true">{club.name.charAt(0).toUpperCase()}</span>
          <span className="min-w-0 flex-1">
            <strong>{club.name}</strong>
            <small>{ClubStatusLabel[club.status] ?? String(club.status)}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}

function ClubManagerDashboard() {
  const user = useAuthStore((state) => state.user);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [dashboardLoadedAt] = useState(() => Date.now());
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: clubApi.getAll });
  const membershipsQuery = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: clubApi.getMyMemberships,
    enabled: Boolean(user?.id),
  });

  const clubs = clubsQuery.data?.data.data ?? [];
  const memberships = membershipsQuery.data?.data.data ?? [];
  const managedMemberships = memberships.filter(
    (membership) => isLeader(membership) || isTreasurer(membership),
  );
  const managedIds = new Set(managedMemberships.map((membership) => membership.clubId));
  const managedClubs = clubs.filter((club) => managedIds.has(club.id));
  const effectiveClubId = managedIds.has(selectedClubId) ? selectedClubId : managedClubs[0]?.id ?? '';
  const selectedMemberships = managedMemberships.filter((membership) => membership.clubId === effectiveClubId);
  const canManageReports = selectedMemberships.some(isLeader);
  const canManageFinance = selectedMemberships.some(isTreasurer);

  const reportsQuery = useQuery({
    queryKey: ['reports', effectiveClubId],
    queryFn: () => reportApi.getByClub(effectiveClubId),
    enabled: Boolean(effectiveClubId && canManageReports),
  });
  const eventsQuery = useQuery({
    queryKey: ['club-events', effectiveClubId],
    queryFn: () => eventApi.getByClub(effectiveClubId),
    enabled: Boolean(effectiveClubId && canManageReports),
  });

  const reports = reportsQuery.data?.data.data ?? [];
  const events = (eventsQuery.data?.data.data ?? []) as ClubEvent[];
  const pendingReports = reports.filter((report) => ReportStatusMap[report.status] === 'PendingApproval');
  const futureEvents = events.filter((event) => {
    const time = Date.parse(event.expectedDate);
    const status = EventStatusMap[event.status] ?? String(event.status);
    return Number.isFinite(time) && time >= dashboardLoadedAt && !['Rejected', 'Cancelled'].includes(status);
  });

  if (clubsQuery.isLoading || membershipsQuery.isLoading) {
    return (
      <>
        <DashboardWelcome role="ClubManager" />
        <DashboardSkeleton cards={3} />
      </>
    );
  }

  if (clubsQuery.isError || membershipsQuery.isError) {
    return (
      <>
        <DashboardWelcome role="ClubManager" />
        <DashboardCard>
          <DashboardErrorState
            message="Không thể xác định câu lạc bộ và quyền hạn của tài khoản."
            onRetry={() => {
              void clubsQuery.refetch();
              void membershipsQuery.refetch();
            }}
          />
        </DashboardCard>
      </>
    );
  }

  if (managedClubs.length === 0) {
    return (
      <>
        <DashboardWelcome role="ClubManager" />
        <DashboardCard>
          <DashboardEmptyState
            title="Bạn chưa quản lý câu lạc bộ nào"
            description="Dashboard quản lý chỉ hiển thị khi bạn có vai trò Chủ nhiệm hoặc Thủ quỹ đã được phê duyệt."
            action={{ label: 'Xem danh sách CLB', to: '/clubs' }}
          />
        </DashboardCard>
      </>
    );
  }

  const roleBadgeNode = (
    <div style={{ display: 'inline-flex', gap: '0.375rem', flexWrap: 'wrap' }}>
      {selectedMemberships.map((membership) => (
        <Badge key={membership.id} className="bg-indigo-100 text-indigo-700">
          {ClubRoleLabel[membership.role] ?? String(membership.role)}
        </Badge>
      ))}
    </div>
  );

  return (
    <>
      <DashboardHeader
        eyebrow={getRoleLabel('ClubManager')}
        badge={roleBadgeNode}
        title={managedClubs.find((club) => club.id === effectiveClubId)?.name ?? 'Dashboard câu lạc bộ'}
        description="Tổng quan hoạt động, sự kiện và báo cáo của câu lạc bộ."
        actions={managedClubs.length > 1 ? (
          <label className="dashboard-selector">
            <span>Chọn câu lạc bộ</span>
            <select value={effectiveClubId} onChange={(event) => setSelectedClubId(event.target.value)}>
              {managedClubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}
            </select>
          </label>
        ) : undefined}
      />

      {canManageReports ? (
        <>
          <div className="dashboard-stats">
            <StatCard label="Báo cáo" value={reports.length} supportingText="Tổng số báo cáo đã tạo" icon={<ClipboardCheck size={20} />} />
            <StatCard label="Báo cáo chờ duyệt" value={pendingReports.length} supportingText="Đang chờ phòng CTSV xét duyệt" icon={<FileClock size={20} />} tone="warning" />
            <StatCard label="Sự kiện sắp tới" value={futureEvents.length} supportingText="Sự kiện sẽ diễn ra trong học kỳ" icon={<CalendarDays size={20} />} tone="success" />
          </div>
          <div className="dashboard-columns">
            <ManagerEvents query={eventsQuery} events={futureEvents} />
            <ManagerReports query={reportsQuery} reports={reports} />
          </div>
        </>
      ) : (
        <DashboardCard>
          <UnavailableMetric>Tài khoản của bạn thuộc vai trò Thủ quỹ với quyền hạn chuyên biệt về Quản lý Tài chính.</UnavailableMetric>
        </DashboardCard>
      )}

      <DashboardSection title="Thao tác nhanh" description="Các lối tắt quản lý dành cho Ban chủ nhiệm.">
        <div className="dashboard-actions">
          {canManageReports && <Link to="/reports"><ClipboardCheck size={19} />Quản lý báo cáo</Link>}
          {canManageReports && <Link to="/events"><CalendarDays size={19} />Quản lý sự kiện</Link>}
          {canManageFinance && <Link to="/finance"><Landmark size={19} />Quản lý tài chính</Link>}
        </div>
      </DashboardSection>
    </>
  );
}

function ManagerEvents({
  query,
  events,
}: {
  query: ReturnType<typeof useQuery>;
  events: ClubEvent[];
}) {
  return (
    <DashboardSection title="Sự kiện sắp tới" description="Danh sách các sự kiện chuẩn bị diễn ra." action={{ label: 'Xem tất cả', to: '/events' }} busy={query.isLoading}>
      {query.isLoading ? <DashboardSkeleton cards={2} /> : query.isError ? (
        <DashboardErrorState message="Không thể tải sự kiện của CLB." onRetry={() => void query.refetch()} />
      ) : events.length === 0 ? (
        <DashboardEmptyState title="Chưa có sự kiện sắp tới" description="Không có sự kiện tương lai phù hợp để hiển thị." />
      ) : (
        <div className="dashboard-data-list">
          {events.slice(0, 5).map((event) => (
            <article key={event.id}>
              <CalendarDays size={18} aria-hidden="true" />
              <div><strong>{event.title}</strong><small>{formatDate(event.expectedDate)} · {event.location}</small></div>
              <Badge className={getStatusColor(String(event.status))}>{EventStatusLabel[event.status] ?? String(event.status)}</Badge>
            </article>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

function ManagerReports({
  query,
  reports,
}: {
  query: ReturnType<typeof useQuery>;
  reports: ActivityReport[];
}) {
  return (
    <DashboardSection title="Báo cáo gần đây" description="Danh sách các báo cáo của câu lạc bộ." action={{ label: 'Xem tất cả', to: '/reports' }} busy={query.isLoading}>
      {query.isLoading ? <DashboardSkeleton cards={2} /> : query.isError ? (
        <DashboardErrorState message="Không thể tải báo cáo của CLB." onRetry={() => void query.refetch()} />
      ) : reports.length === 0 ? (
        <DashboardEmptyState title="Chưa có báo cáo" description="CLB chưa có báo cáo nào trong dữ liệu hiện tại." />
      ) : (
        <div className="dashboard-data-list">
          {reports.slice(0, 5).map((report) => (
            <article key={report.id}>
              <ClipboardCheck size={18} aria-hidden="true" />
              <div><strong>{report.title}</strong><small>{formatDate(report.createdAt)}</small></div>
              <Badge className={getStatusColor(String(report.status))}>{ReportStatusMap[report.status] ?? String(report.status)}</Badge>
            </article>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

function AdminDashboard() {
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: clubApi.getAll });
  const clubs = clubsQuery.data?.data.data ?? [];
  const reportQueries = useQueries({
    queries: clubs.map((club) => ({
      queryKey: ['reports-pending', club.id],
      queryFn: () => reportApi.getByClub(club.id, 1),
      enabled: clubsQuery.isSuccess,
    })),
  });

  const activeClubs = clubs.filter((club) => ClubStatusMap[club.status] === 'Active').length;
  const pendingClubs = clubs.filter((club) => ClubStatusMap[club.status] === 'PendingApproval').length;
  const successfulReportQueries = reportQueries.filter((query) => query.isSuccess);
  const pendingReports = successfulReportQueries.flatMap((query) => query.data?.data.data ?? []);
  const reportsLoading = reportQueries.some((query) => query.isLoading);
  const reportsFailed = reportQueries.some((query) => query.isError);
  const statusData = Object.entries(
    clubs.reduce<Record<string, number>>((counts, club) => {
      const label = ClubStatusLabel[club.status] ?? String(club.status);
      counts[label] = (counts[label] ?? 0) + 1;
      return counts;
    }, {}),
  ).map(([name, value]) => ({ name, value }));
  const chartColors = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'];

  return (
    <>
      <DashboardWelcome role="StudentAffairsAdmin" />
      {clubsQuery.isLoading ? <DashboardSkeleton cards={3} /> : clubsQuery.isError ? (
        <DashboardCard>
          <DashboardErrorState message="Không thể tải danh sách CLB để tổng hợp dashboard." onRetry={() => void clubsQuery.refetch()} />
        </DashboardCard>
      ) : (
        <>
          <div className="dashboard-stats">
            <StatCard label="Tổng số CLB" value={clubs.length} supportingText="Tổng số câu lạc bộ toàn trường" icon={<Building2 size={20} />} />
            <StatCard label="CLB đang hoạt động" value={activeClubs} supportingText="Câu lạc bộ đang hoạt động" icon={<CheckCircle2 size={20} />} tone="success" />
            <StatCard label="CLB chờ duyệt" value={pendingClubs} supportingText="Câu lạc bộ mới đang chờ duyệt" icon={<FileClock size={20} />} tone="warning" />
          </div>

          <div className="dashboard-columns">
            <DashboardSection title="Trạng thái câu lạc bộ" description="Phân bố theo trạng thái hiện tại của từng CLB.">
              {statusData.length === 0 ? (
                <DashboardEmptyState title="Chưa có dữ liệu CLB" description="Không có trạng thái để trực quan hóa." />
              ) : (
                <div className="dashboard-chart">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                        {statusData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="sr-only">
                    {statusData.map((item) => `${item.name}: ${item.value}`).join('; ')}
                  </p>
                  <ul className="dashboard-chart__legend">
                    {statusData.map((item, index) => (
                      <li key={item.name}><span style={{ background: chartColors[index % chartColors.length] }} />{item.name}: {item.value}</li>
                    ))}
                  </ul>
                </div>
              )}
            </DashboardSection>

            <DashboardSection title="Báo cáo chờ duyệt" description="Danh sách các báo cáo đang chờ phê duyệt." action={{ label: 'Mở trang duyệt', to: '/admin/reports' }} busy={reportsLoading}>
              {reportsLoading && pendingReports.length === 0 ? <DashboardSkeleton cards={2} /> : pendingReports.length === 0 && !reportsFailed ? (
                <DashboardEmptyState title="Không có báo cáo chờ duyệt" description="Không có báo cáo chưa duyệt ở thời điểm này." />
              ) : (
                <div className="dashboard-data-list">
                  {pendingReports.slice(0, 5).map((report) => (
                    <article key={report.id}>
                      <ClipboardCheck size={18} aria-hidden="true" />
                      <div><strong>{report.title}</strong><small>{formatDate(report.createdAt)}</small></div>
                      <Badge className="bg-amber-100 text-amber-700">Chờ duyệt</Badge>
                    </article>
                  ))}
                </div>
              )}
              {reportsFailed && (
                <div className="mt-4">
                  <UnavailableMetric>Một số CLB không trả được dữ liệu báo cáo; kết quả hiện tại chỉ phản ánh các request thành công.</UnavailableMetric>
                </div>
              )}
            </DashboardSection>
          </div>
        </>
      )}
    </>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const scopeRef = useGsapReveal<HTMLDivElement>({ animationKey: `dashboard-${user?.role ?? 'anonymous'}` });

  const membershipsQuery = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: clubApi.getMyMemberships,
    enabled: Boolean(user?.id && user?.role !== 'StudentAffairsAdmin'),
  });

  const memberships = membershipsQuery.data?.data.data ?? [];
  const isClubManager =
    user?.role === 'ClubManager' ||
    memberships.some((m) => isLeader(m) || isTreasurer(m));

  return (
    <DashboardShell scopeRef={scopeRef}>
      <div data-gsap-item>
        {user?.role === 'StudentAffairsAdmin' ? (
          <AdminDashboard />
        ) : isClubManager ? (
          <ClubManagerDashboard />
        ) : (
          <StudentDashboard />
        )}
      </div>
    </DashboardShell>
  );
}
