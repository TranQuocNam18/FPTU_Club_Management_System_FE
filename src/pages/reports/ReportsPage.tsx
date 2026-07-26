import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  CheckCircle2,
  Clock3,
  Edit2,
  Eye,
  FilterX,
  Plus,
  Search,
  Send,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import { reportApi } from '../../api/report.api';
import { semesterApi } from '../../api/semester.api';
import {
  EvidenceList,
  ReportCard,
  ReportEmptyState,
  ReportErrorState,
  ReportSkeleton,
  ReportStatusBadge,
  ReportTypeBadge,
  ReportWorkflow,
  ReviewOutcomeIcon,
} from '../../components/reports/ReportPrimitives';
import { SmartReportAssistantPanel } from '../../components/reports/SmartReportAssistantPanel';
import { reportStatus, reportType } from '../../components/reports/reportUtils';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useAuthStore } from '../../stores/authStore';
import type { ActivityReport, Club, Semester } from '../../types';
import { ReportTypeMap } from '../../types';
import { formatDate, getApiError } from '../../utils';

interface CreateReportForm {
  semesterId: string;
  title: string;
  content: string;
  type: string;
}

interface EditReportValues {
  title: string;
  content: string;
  type: string;
}

type ReviewAction = 'Approve' | 'RequestRevision' | 'Reject';

interface ReportHistoryItem {
  id: string;
  reportId: string;
  revisionNumber: number;
  previousStatus: string;
  newStatus: string;
  feedback?: string;
  changedBy: string;
  changedAt: string;
}

interface ReportHistoryState {
  items: ReportHistoryItem[];
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
}

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [selectedClubId, setSelectedClubId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [detailTarget, setDetailTarget] = useState<ActivityReport | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ActivityReport | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ActivityReport | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction>('Approve');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState('');
  const scopeRef = useGsapReveal<HTMLDivElement>({ animationKey: `reports-${user?.role ?? 'anonymous'}` });
  const isAdmin = user?.role === 'StudentAffairsAdmin';
  const isClubActor = !isAdmin && Boolean(user);

  const clubsQuery = useQuery({
    queryKey: ['clubs'],
    queryFn: clubApi.getAll,
    enabled: isAdmin || isClubActor,
  });
  const membershipsQuery = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: clubApi.getMyMemberships,
    enabled: isClubActor && Boolean(user?.id),
  });
  const allClubs = useMemo(() => clubsQuery.data?.data.data ?? [], [clubsQuery.data]);
  const memberships = useMemo(() => membershipsQuery.data?.data.data ?? [], [membershipsQuery.data]);
  const availableClubs = useMemo(() => {
    if (isAdmin) return allClubs;
    const leaderIds = new Set(
      memberships
        .filter((membership) => Number(membership.role) === 2 && Number(membership.status) === 1)
        .map((membership) => membership.clubId),
    );
    return allClubs.filter((club) => leaderIds.has(club.id));
  }, [allClubs, isAdmin, memberships]);
  const canSubmitReports = isClubActor && availableClubs.length > 0;
  const effectiveClubId = availableClubs.some((club) => club.id === selectedClubId)
    ? selectedClubId
    : availableClubs[0]?.id ?? '';
  const selectedClub = availableClubs.find((club) => club.id === effectiveClubId);

  const reportsQuery = useQuery({
    queryKey: ['reports', effectiveClubId],
    queryFn: () => reportApi.getByClub(effectiveClubId),
    enabled: Boolean(effectiveClubId),
  });
  const semestersQuery = useQuery({
    queryKey: ['semesters'],
    queryFn: semesterApi.getAll,
    enabled: (isAdmin || canSubmitReports) && availableClubs.length > 0,
  });
  const reports = useMemo(() => reportsQuery.data?.data.data ?? [], [reportsQuery.data]);
  const semesters = useMemo(() => semestersQuery.data?.data.data ?? [], [semestersQuery.data]);
  const activeSemesters = semesters.filter((semester) => semester.status === 'Active');
  const semesterMap = new Map(semesters.map((semester) => [semester.id, semester]));
  const normalizedSearch = search.trim().toLocaleLowerCase('vi-VN');
  const filteredReports = useMemo(
    () => reports.filter((report) => {
      const matchesSearch = !normalizedSearch
        || report.title.toLocaleLowerCase('vi-VN').includes(normalizedSearch)
        || report.content.toLocaleLowerCase('vi-VN').includes(normalizedSearch);
      return matchesSearch
        && (!statusFilter || reportStatus(report) === statusFilter)
        && (!typeFilter || reportType(report) === typeFilter)
        && (!semesterFilter || report.semesterId === semesterFilter);
    }),
    [normalizedSearch, reports, semesterFilter, statusFilter, typeFilter],
  );

  const historyReportId = detailTarget?.id ?? reviewTarget?.id;
  const historyQuery = useQuery({
    queryKey: ['report-history', historyReportId],
    queryFn: () => reportApi.history(historyReportId!),
    enabled: Boolean(historyReportId),
  });
  const historyState: ReportHistoryState = {
    items: historyQuery.data?.data.data ?? [],
    isLoading: historyQuery.isLoading,
    isError: historyQuery.isError,
    retry: () => void historyQuery.refetch(),
  };

  const createForm = useForm<CreateReportForm>({ defaultValues: { type: '2', semesterId: '' } });
  const editForm = useForm<EditReportValues>({ defaultValues: { type: '2' } });

  const invalidateReports = () => queryClient.invalidateQueries({ queryKey: ['reports', effectiveClubId] });
  const createMutation = useMutation({
    mutationFn: async (values: CreateReportForm) => {
      return reportApi.create({
        clubId: effectiveClubId,
        semesterId: values.semesterId,
        title: values.title,
        content: values.content,
        type: Number(values.type),
      });
    },
    onSuccess: async () => {
      toast.success('Đã lưu bản nháp báo cáo.');
      setCreateOpen(false);
      createForm.reset({ type: '2', semesterId: '' });
      await invalidateReports();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể tạo và nộp báo cáo.')),
  });
  const editMutation = useMutation({
    mutationFn: async (values: EditReportValues) => {
      if (!editTarget) throw new Error('Missing report');
      await reportApi.update(editTarget.id, { title: values.title, content: values.content, type: Number(values.type) });
      if (reportStatus(editTarget) === 'RequestRevision') await reportApi.submit(editTarget.id);
    },
    onSuccess: async () => {
      toast.success(reportStatus(editTarget!) === 'RequestRevision' ? 'Đã cập nhật và gửi lại báo cáo.' : 'Đã lưu bản nháp.');
      setEditTarget(null);
      editForm.reset();
      await invalidateReports();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể cập nhật báo cáo.')),
  });
  const submitMutation = useMutation({
    mutationFn: (reportId: string) => reportApi.submit(reportId),
    onSuccess: async () => { toast.success('Đã gửi báo cáo để duyệt.'); await invalidateReports(); },
    onError: (error) => toast.error(getApiError(error, 'Không thể gửi báo cáo.')),
  });
  const reviewMutation = useMutation({
    mutationFn: () => reportApi.review(reviewTarget!.id, {
      action: reviewAction,
      reviewNote: reviewNote.trim() || undefined,
    }),
    onSuccess: async () => {
      toast.success(reviewAction === 'Approve' ? 'Đã duyệt báo cáo.' : reviewAction === 'RequestRevision' ? 'Đã yêu cầu chỉnh sửa.' : 'Đã từ chối báo cáo.');
      closeReview();
      await invalidateReports();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể hoàn tất review.')),
  });

  function openCreate() {
    createForm.reset({ type: '2', semesterId: activeSemesters[0]?.id ?? '' });
    setCreateOpen(true);
  }

  function openEdit(report: ActivityReport) {
    editForm.reset({ title: report.title, content: report.content, type: reportTypeNumber(report) });
    setEditTarget(report);
  }

  function openReview(report: ActivityReport) {
    setReviewTarget(report);
    setReviewAction('Approve');
    setReviewNote('');
    setReviewError('');
  }

  function closeReview() {
    setReviewTarget(null);
    setReviewNote('');
    setReviewError('');
    setReviewAction('Approve');
  }

  function submitReview() {
    if (reviewAction !== 'Approve' && reviewNote.trim().length < 3) {
      setReviewError('Phản hồi ít nhất 3 ký tự là bắt buộc khi yêu cầu sửa hoặc từ chối.');
      return;
    }
    setReviewError('');
    reviewMutation.mutate();
  }

  const clubDataLoading = clubsQuery.isLoading || (isClubActor && membershipsQuery.isLoading);
  const clubDataError = clubsQuery.isError || (isClubActor && membershipsQuery.isError);

  return (
    <div ref={scopeRef} className="reports-page">
      <header className="reports-header" data-gsap-item>
        <div>
          <p className="reports-eyebrow">{isAdmin ? 'Administrative review' : 'Operational reporting'}</p>
          <h1>{isAdmin ? 'Kiểm duyệt báo cáo' : 'Báo cáo câu lạc bộ'}</h1>
          <p>{isAdmin ? 'Đọc, đối chiếu và xử lý các báo cáo đang chờ theo từng câu lạc bộ.' : 'Soạn, gửi và theo dõi revision của báo cáo hoạt động.'}</p>
        </div>
        {canSubmitReports && effectiveClubId && (
          <Button onClick={openCreate} disabled={!semestersQuery.isSuccess || activeSemesters.length === 0} icon={<Plus size={17} aria-hidden="true" />}>Tạo báo cáo</Button>
        )}
      </header>

      {!isAdmin && membershipsQuery.isSuccess && !canSubmitReports ? (
        <ReportEmptyState title="Không có quyền lập báo cáo" description="Bạn cần là Chủ nhiệm đã được duyệt của một câu lạc bộ." />
      ) : clubDataLoading ? (
        <ReportSkeleton count={3} />
      ) : clubDataError ? (
        <ReportErrorState
          message="Không thể xác định câu lạc bộ hoặc capability của tài khoản."
          onRetry={() => {
            void clubsQuery.refetch();
            if (isClubActor) void membershipsQuery.refetch();
          }}
        />
      ) : availableClubs.length === 0 ? (
        <ReportEmptyState
          title={isAdmin ? 'Chưa có câu lạc bộ' : 'Bạn chưa có quyền nộp báo cáo'}
          description={isAdmin ? 'Không có CLB để mở review queue.' : 'Cần approved ClubLeader membership; Treasurer và legacy role không được phép nộp.'}
        />
      ) : (
        <>
          <div className="reports-toolbar" data-gsap-item>
            <label><span>Câu lạc bộ</span><select value={effectiveClubId} onChange={(event) => setSelectedClubId(event.target.value)}>{availableClubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
            <label className="reports-search"><span>Tìm kiếm</span><div><Search size={16} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tiêu đề hoặc nội dung..." /></div></label>
            <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tất cả</option><option value="Draft">Bản nháp</option><option value="PendingApproval">Chờ duyệt</option><option value="Approved">Đã duyệt</option><option value="RequestRevision">Yêu cầu sửa</option><option value="Rejected">Từ chối</option></select></label>
            <label><span>Loại</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">Tất cả</option><option value="Activity">Hoạt động</option><option value="Financial">Tài chính</option><option value="General">Tổng hợp</option></select></label>
            <label><span>Semester</span><select value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)}><option value="">Tất cả</option>{semesters.map((semester) => <option value={semester.id} key={semester.id}>{semester.code} — {semester.name}</option>)}</select></label>
            {(search || statusFilter || typeFilter || semesterFilter) && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setSemesterFilter(''); }} icon={<FilterX size={16} aria-hidden="true" />}>Xóa lọc</Button>}
          </div>

          {canSubmitReports && semestersQuery.isError && (
            <ReportErrorState message="Semester endpoint lỗi; form tạo báo cáo bị khóa để tránh submit thiếu semester." onRetry={() => void semestersQuery.refetch()} />
          )}
          {canSubmitReports && semestersQuery.isSuccess && activeSemesters.length === 0 && (
            <div className="report-unavailable" role="status">Không có Active Semester. Không thể tạo báo cáo mới.</div>
          )}

          {reportsQuery.isLoading ? <ReportSkeleton /> : reportsQuery.isError ? (
            <ReportErrorState message="Không thể tải báo cáo của câu lạc bộ đã chọn." onRetry={() => void reportsQuery.refetch()} />
          ) : filteredReports.length === 0 ? (
            <ReportEmptyState
              title={reports.length === 0 ? 'Chưa có báo cáo' : 'Không có kết quả phù hợp'}
              description={reports.length === 0 ? 'Câu lạc bộ chưa có báo cáo trong response hiện tại.' : 'Thử xóa hoặc thay đổi bộ lọc.'}
              action={canSubmitReports && activeSemesters.length > 0 ? <Button onClick={openCreate}>Tạo báo cáo đầu tiên</Button> : undefined}
            />
          ) : (
            <div className="report-list">
              {filteredReports.map((report) => {
                const canonical = reportStatus(report);
                const editable = canSubmitReports && ['Draft', 'RequestRevision'].includes(canonical);
                const pending = canonical === 'PendingApproval';
                return (
                  <ReportCard
                    report={report}
                    clubName={selectedClub?.name}
                    semesterName={report.semesterId ? semesterMap.get(report.semesterId)?.name : undefined}
                    onOpen={() => setDetailTarget(report)}
                    actions={
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setDetailTarget(report)} icon={<Eye size={16} aria-hidden="true" />}>Chi tiết</Button>
                        {editable && <Button size="sm" variant="outline" onClick={() => openEdit(report)} icon={<Edit2 size={16} aria-hidden="true" />}>{canonical === 'RequestRevision' ? 'Sửa và gửi lại' : 'Sửa'}</Button>}
                        {canSubmitReports && canonical === 'Draft' && <Button size="sm" loading={submitMutation.isPending && submitMutation.variables === report.id} onClick={() => submitMutation.mutate(report.id)} icon={<Send size={15} aria-hidden="true" />}>Gửi duyệt</Button>}
                        {isAdmin && pending && <Button size="sm" onClick={() => openReview(report)}>Review</Button>}
                      </>
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal isOpen={Boolean(detailTarget)} onClose={() => setDetailTarget(null)} title="Chi tiết báo cáo" size="lg">
        {detailTarget && (
          <ReportDetail
            report={detailTarget}
            club={selectedClub}
            semester={detailTarget.semesterId ? semesterMap.get(detailTarget.semesterId) : undefined}
            history={historyState}
          />
        )}
      </Modal>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Tạo báo cáo" size="xl">
        {semestersQuery.isLoading ? <ReportSkeleton count={2} /> : semestersQuery.isError ? (
          <ReportErrorState message="Không thể tải Active Semester." onRetry={() => void semestersQuery.refetch()} />
        ) : activeSemesters.length === 0 ? (
          <ReportEmptyState title="Không có Active Semester" description="Form bị khóa vì semesterId là field bắt buộc." />
        ) : (
          <ReportForm
            mode="create"
            form={createForm}
            clubId={effectiveClubId}
            semesters={activeSemesters}
            pending={createMutation.isPending}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(values) => createMutation.mutate(values)}
          />
        )}
      </Modal>

      <Modal isOpen={Boolean(editTarget)} onClose={() => setEditTarget(null)} title={editTarget && reportStatus(editTarget) === 'RequestRevision' ? 'Chỉnh sửa và gửi lại' : 'Chỉnh sửa bản nháp'} size="lg">
        {editTarget?.reviewNote && <div className="revision-feedback"><Clock3 size={19} aria-hidden="true" /><div><strong>Phản hồi cần xử lý</strong><p>{editTarget.reviewNote}</p></div></div>}
        <EditReportForm form={editForm} pending={editMutation.isPending} onCancel={() => setEditTarget(null)} onSubmit={(values) => editMutation.mutate(values)} />
      </Modal>

      <Modal isOpen={Boolean(reviewTarget)} onClose={closeReview} title="Review báo cáo" size="lg">
        {reviewTarget && (
          <div className="review-report">
            <ReportDetail report={reviewTarget} club={selectedClub} semester={reviewTarget.semesterId ? semesterMap.get(reviewTarget.semesterId) : undefined} history={historyState} />
            <fieldset>
              <legend>Kết quả review</legend>
              <div className="review-actions">
                {([
                  ['Approve', 'Duyệt', CheckCircle2],
                  ['RequestRevision', 'Yêu cầu sửa', Clock3],
                  ['Reject', 'Từ chối', XCircle],
                ] as const).map(([value, label, Icon]) => (
                  <label className={reviewAction === value ? 'is-selected' : ''} key={value}>
                    <input type="radio" name="review-action" value={value} checked={reviewAction === value} onChange={() => { setReviewAction(value); setReviewError(''); }} />
                    <Icon size={18} aria-hidden="true" />{label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="review-note">Phản hồi {reviewAction !== 'Approve' && <span>(bắt buộc)</span>}<textarea rows={4} maxLength={500} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} /></label>
            {reviewError && <p className="report-form-error" role="alert">{reviewError}</p>}
            <div className="report-form-actions"><Button variant="outline" onClick={closeReview}>Hủy</Button><Button loading={reviewMutation.isPending} onClick={submitReview} icon={<ReviewOutcomeIcon action={reviewAction} />}>Xác nhận</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ReportDetail({
  report,
  club,
  semester,
  history,
}: {
  report: ActivityReport;
  club?: Club;
  semester?: Semester;
  history?: ReportHistoryState;
}) {
  return (
    <div className="report-detail">
      <div className="report-detail__head">
        <div><div><ReportStatusBadge status={report.status} /><ReportTypeBadge type={report.type} /></div><h2>{report.title}</h2></div>
        <ReportWorkflow status={report.status} />
      </div>
      <dl className="report-detail__facts">
        <div><dt>Câu lạc bộ</dt><dd>{club?.name ?? report.clubName ?? 'Không có trong response'}</dd></div>
        <div><dt>Semester</dt><dd>{semester ? `${semester.code} — ${semester.name}` : report.semesterId ?? 'Không có trong response'}</dd></div>
        <div><dt>Ngày tạo</dt><dd>{formatDate(report.createdAt, 'dd/MM/yyyy HH:mm')}</dd></div>
        <div><dt>Revision</dt><dd>{report.revisionNumber}</dd></div>
      </dl>
      {report.reviewNote && <div className="revision-feedback"><Clock3 size={19} aria-hidden="true" /><div><strong>Phản hồi review</strong><p>{report.reviewNote}</p></div></div>}
      <section><h3>Nội dung báo cáo</h3><p className="report-detail__content">{report.content}</p></section>
      <section><h3>Evidence</h3><EvidenceList attachments={report.attachments} /></section>
      {history && (
        <section>
          <h3>Lịch sử revision</h3>
          {history.isLoading ? <ReportSkeleton count={1} /> : history.isError ? (
            <ReportErrorState message="Không thể tải lịch sử revision." onRetry={history.retry} />
          ) : history.items.length === 0 ? (
            <p className="report-unavailable">Chưa có transition history.</p>
          ) : (
            <ol className="report-history">
              {history.items.map((item) => (
                <li key={item.id}><span>{item.revisionNumber}</span><div><strong>{item.previousStatus} → {item.newStatus}</strong><time dateTime={item.changedAt}>{formatDate(item.changedAt, 'dd/MM/yyyy HH:mm')}</time>{item.feedback && <p>{item.feedback}</p>}</div></li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

function ReportForm({
  form,
  clubId,
  semesters,
  pending,
  onCancel,
  onSubmit,
}: {
  mode: 'create';
  form: ReturnType<typeof useForm<CreateReportForm>>;
  clubId: string;
  semesters: Semester[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateReportForm) => void;
}) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;
  const semesterId = watch('semesterId') ?? '';
  const selectedType = watch('type') ?? '2';
  const title = watch('title') ?? '';
  const content = watch('content') ?? '';
  return (
    <form className="report-form" onSubmit={handleSubmit(onSubmit)}>
      <label>Active Semester<select {...register('semesterId', { required: 'Vui lòng chọn Active Semester.' })}><option value="">Chọn semester</option>{semesters.map((semester) => <option value={semester.id} key={semester.id}>{semester.code} — {semester.name}</option>)}</select>{errors.semesterId && <span role="alert">{errors.semesterId.message}</span>}</label>
      <label>Loại báo cáo<select {...register('type', { required: true })}><option value="1">Tài chính</option><option value="2">Hoạt động</option><option value="3">Tổng hợp</option></select></label>
      <SmartReportAssistantPanel
        key={`${clubId}:${semesterId}:${selectedType}`}
        clubId={clubId}
        semesterId={semesterId}
        reportType={Number(selectedType)}
        title={title}
        content={content}
        onApplyDraft={(generatedTitle, generatedContent) => {
          setValue('title', generatedTitle, { shouldDirty: true, shouldValidate: true });
          setValue('content', generatedContent, { shouldDirty: true, shouldValidate: true });
        }}
      />
      <label>Tiêu đề<input {...register('title', { required: 'Vui lòng nhập tiêu đề.', minLength: { value: 5, message: 'Tối thiểu 5 ký tự.' }, maxLength: { value: 200, message: 'Tối đa 200 ký tự.' } })} />{errors.title && <span role="alert">{errors.title.message}</span>}</label>
      <label>Nội dung<textarea rows={9} {...register('content', { required: 'Vui lòng nhập nội dung.', minLength: { value: 20, message: 'Tối thiểu 20 ký tự.' } })} />{errors.content && <span role="alert">{errors.content.message}</span>}</label>
      <p className="report-form-note">Nội dung chỉ được lưu thành Draft. Bạn quyết định thời điểm gửi duyệt bằng action trên thẻ báo cáo.</p>
      <div className="report-form-actions"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" loading={pending} icon={<Send size={16} aria-hidden="true" />}>Lưu bản nháp</Button></div>
    </form>
  );
}

function EditReportForm({
  form,
  pending,
  onCancel,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<EditReportValues>>;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (values: EditReportValues) => void;
}) {
  const { register, handleSubmit, formState: { errors } } = form;
  return (
    <form className="report-form" onSubmit={handleSubmit(onSubmit)}>
      <label>Loại báo cáo<select {...register('type', { required: true })}><option value="1">Tài chính</option><option value="2">Hoạt động</option><option value="3">Tổng hợp</option></select></label>
      <label>Tiêu đề<input {...register('title', { required: 'Vui lòng nhập tiêu đề.', minLength: { value: 5, message: 'Tối thiểu 5 ký tự.' }, maxLength: { value: 200, message: 'Tối đa 200 ký tự.' } })} />{errors.title && <span role="alert">{errors.title.message}</span>}</label>
      <label>Nội dung<textarea rows={9} {...register('content', { required: 'Vui lòng nhập nội dung.', minLength: { value: 20, message: 'Tối thiểu 20 ký tự.' } })} />{errors.content && <span role="alert">{errors.content.message}</span>}</label>
      <div className="report-form-actions"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" loading={pending}>Lưu thay đổi</Button></div>
    </form>
  );
}

function reportTypeNumber(report: ActivityReport) {
  const canonical = ReportTypeMap[report.type] ?? String(report.type);
  return canonical === 'Financial' ? '1' : canonical === 'Activity' ? '2' : '3';
}
