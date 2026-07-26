import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { BarChart3, CalendarDays, Edit2, Plus, Settings2, SlidersHorizontal, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clubApi } from '../../api/club.api';
import { kpiApi, type KpiLeaderboardEntry, type KpiRule } from '../../api/kpi.api';
import { semesterApi } from '../../api/semester.api';
import { ConfirmDialog } from '../../components/clubs/ClubPrimitives';
import {
  KpiEmptyState,
  KpiErrorState,
  KpiHistoryItem,
  KpiLeaderboardRow,
  KpiRankBadge,
  KpiScoreText,
  KpiSkeleton,
  KpiUnavailableState,
} from '../../components/kpi/KpiPrimitives';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useAuthStore } from '../../stores/authStore';
import type { Club } from '../../types';
import { formatDate, getApiError } from '../../utils';

type KpiTab = 'leaderboard' | 'rules';
interface RuleValues { name: string; description: string; maxPoints: string; weight: string }
interface AdjustmentValues { clubId: string; ruleId: string; points: string; reason: string }
interface SemesterValues { code: string; name: string; startDate: string; endDate: string }

export default function KpiPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'StudentAffairsAdmin';
  const queryClient = useQueryClient();
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [activeTab, setActiveTab] = useState<KpiTab>('leaderboard');
  const [selectedEntry, setSelectedEntry] = useState<KpiLeaderboardEntry | null>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [editRule, setEditRule] = useState<KpiRule | null>(null);
  const [deleteRule, setDeleteRule] = useState<KpiRule | null>(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [semesterOpen, setSemesterOpen] = useState(false);
  const scopeRef = useGsapReveal<HTMLDivElement>({ animationKey: `kpi-${user?.role ?? 'anonymous'}` });

  const semestersQuery = useQuery({ queryKey: ['semesters'], queryFn: semesterApi.getAll });
  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: clubApi.getAll });
  const semesters = useMemo(() => semestersQuery.data?.data.data ?? [], [semestersQuery.data]);
  const clubs = useMemo(() => clubsQuery.data?.data.data ?? [], [clubsQuery.data]);
  const effectiveSemesterId = semesters.some((semester) => semester.id === selectedSemesterId)
    ? selectedSemesterId
    : semesters.find((semester) => semester.status === 'Active')?.id ?? semesters[0]?.id ?? '';
  const selectedSemester = semesters.find((semester) => semester.id === effectiveSemesterId);
  const clubMap = new Map(clubs.map((club) => [club.id, club]));

  const leaderboardQuery = useQuery({
    queryKey: ['kpi-leaderboard', effectiveSemesterId],
    queryFn: () => kpiApi.getLeaderboard(effectiveSemesterId),
    enabled: Boolean(effectiveSemesterId),
  });
  const rulesQuery = useQuery({
    queryKey: ['kpi-rules', effectiveSemesterId],
    queryFn: () => kpiApi.getRules(effectiveSemesterId),
    enabled: Boolean(isAdmin && activeTab === 'rules' && effectiveSemesterId),
  });
  const detailQuery = useQuery({
    queryKey: ['kpi-club-score', effectiveSemesterId, selectedEntry?.clubId],
    queryFn: () => kpiApi.getClubScore(selectedEntry!.clubId, effectiveSemesterId),
    enabled: Boolean(selectedEntry && effectiveSemesterId),
  });
  const historyQuery = useQuery({
    queryKey: ['kpi-history', effectiveSemesterId, selectedEntry?.clubId],
    queryFn: () => kpiApi.getClubHistory(selectedEntry!.clubId, effectiveSemesterId),
    enabled: Boolean(selectedEntry && effectiveSemesterId),
  });
  const adjustmentRulesQuery = useQuery({
    queryKey: ['kpi-rules', effectiveSemesterId],
    queryFn: () => kpiApi.getRules(effectiveSemesterId),
    enabled: Boolean(isAdmin && adjustmentOpen && effectiveSemesterId),
  });

  const leaderboard = useMemo(() => leaderboardQuery.data?.data.data ?? [], [leaderboardQuery.data]);
  const rules = useMemo(() => rulesQuery.data?.data.data ?? [], [rulesQuery.data]);
  const detailRules = adjustmentRulesQuery.data?.data.data ?? rules;
  const ruleMap = new Map(detailRules.map((rule) => [rule.id, rule.name]));
  const ruleForm = useForm<RuleValues>();
  const adjustmentForm = useForm<AdjustmentValues>();
  const semesterForm = useForm<SemesterValues>();

  const invalidateSemesterKpi = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['kpi-leaderboard', effectiveSemesterId] }),
    queryClient.invalidateQueries({ queryKey: ['kpi-rules', effectiveSemesterId] }),
  ]);
  const ruleMutation = useMutation({
    mutationFn: (values: RuleValues) => {
      const payload = { semesterId: effectiveSemesterId, name: values.name.trim(), description: values.description.trim(), maxPoints: Number(values.maxPoints), weight: Number(values.weight) };
      return editRule ? kpiApi.updateRule(editRule.id, payload) : kpiApi.createRule(payload);
    },
    onSuccess: async () => {
      toast.success(editRule ? 'Đã cập nhật KPI rule.' : 'Đã tạo KPI rule.');
      setRuleOpen(false); setEditRule(null); ruleForm.reset();
      await invalidateSemesterKpi();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể lưu KPI rule.')),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => kpiApi.deleteRule(id),
    onSuccess: async () => { toast.success('Đã xóa KPI rule.'); setDeleteRule(null); await invalidateSemesterKpi(); },
    onError: (error) => toast.error(getApiError(error, 'Không thể xóa KPI rule.')),
  });
  const adjustmentMutation = useMutation({
    mutationFn: (values: AdjustmentValues) => kpiApi.createAdjustment({ clubId: values.clubId, semesterId: effectiveSemesterId, ruleId: values.ruleId || undefined, points: Number(values.points), reason: values.reason.trim() }),
    onSuccess: async () => {
      toast.success('Đã ghi điều chỉnh KPI.');
      setAdjustmentOpen(false); adjustmentForm.reset();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['kpi-leaderboard', effectiveSemesterId] }),
        queryClient.invalidateQueries({ queryKey: ['kpi-club-score', effectiveSemesterId] }),
        queryClient.invalidateQueries({ queryKey: ['kpi-history', effectiveSemesterId] }),
      ]);
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể ghi điều chỉnh KPI.')),
  });
  const semesterMutation = useMutation({
    mutationFn: (values: SemesterValues) => semesterApi.create({ code: values.code.trim(), name: values.name.trim(), startDate: new Date(values.startDate).toISOString(), endDate: new Date(values.endDate).toISOString() }),
    onSuccess: async () => { toast.success('Đã tạo Semester Draft.'); setSemesterOpen(false); semesterForm.reset(); await queryClient.invalidateQueries({ queryKey: ['semesters'] }); },
    onError: (error) => toast.error(getApiError(error, 'Không thể tạo Semester.')),
  });
  const semesterActionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'activate' | 'close' }) => action === 'activate' ? semesterApi.activate(id) : semesterApi.close(id),
    onSuccess: async () => { toast.success('Đã cập nhật trạng thái Semester.'); await queryClient.invalidateQueries({ queryKey: ['semesters'] }); },
    onError: (error) => toast.error(getApiError(error, 'Không thể cập nhật Semester.')),
  });

  function openCreateRule() { setEditRule(null); ruleForm.reset({ name: '', description: '', maxPoints: '', weight: '1' }); setRuleOpen(true); }
  function openEditRule(rule: KpiRule) { setEditRule(rule); ruleForm.reset({ name: rule.name, description: rule.description, maxPoints: String(rule.maxPoints), weight: String(rule.weight) }); setRuleOpen(true); }
  function openAdjustment() { adjustmentForm.reset({ clubId: '', ruleId: '', points: '', reason: '' }); setAdjustmentOpen(true); }
  function openSemester() { semesterForm.reset({ code: '', name: '', startDate: '', endDate: '' }); setSemesterOpen(true); }

  return <div ref={scopeRef} className="kpi-page">
    <header className="kpi-header" data-gsap-item>
      <div><p className="kpi-eyebrow">Academic performance analytics</p><h1>KPI câu lạc bộ</h1><p>So sánh điểm chính thức theo Semester và kiểm tra từng nguồn thay đổi từ KPI history.</p></div>
      {isAdmin && <div className="kpi-header__actions"><Button variant="outline" onClick={openSemester} icon={<CalendarDays size={16} aria-hidden="true" />}>Tạo Semester</Button><Button onClick={openAdjustment} disabled={!effectiveSemesterId} icon={<SlidersHorizontal size={16} aria-hidden="true" />}>Điều chỉnh điểm</Button></div>}
    </header>

    {semestersQuery.isLoading || clubsQuery.isLoading ? <KpiSkeleton /> : semestersQuery.isError ? (
      <KpiErrorState message="Semester endpoint không khả dụng; KPI query không được gửi với ID giả." onRetry={() => void semestersQuery.refetch()} />
    ) : semesters.length === 0 ? <KpiEmptyState title="Chưa có Semester" description="KPI chưa khả dụng vì backend không trả Semester." action={isAdmin ? <Button onClick={openSemester}>Tạo Semester</Button> : undefined} /> : (
      <>
        <section className="kpi-context" data-gsap-item>
          <label><span>Semester</span><select value={effectiveSemesterId} onChange={(event) => { setSelectedSemesterId(event.target.value); setSelectedEntry(null); }} >{semesters.map((semester) => <option value={semester.id} key={semester.id}>{semester.code} — {semester.name} ({semester.status})</option>)}</select></label>
          {selectedSemester && <div className="kpi-semester"><span className={`semester-status semester-status--${selectedSemester.status.toLowerCase()}`}>{selectedSemester.status}</span><p>{formatDate(selectedSemester.startDate)} — {formatDate(selectedSemester.endDate)}</p>{isAdmin && selectedSemester.status === 'Draft' && <Button size="sm" loading={semesterActionMutation.isPending} onClick={() => semesterActionMutation.mutate({ id: selectedSemester.id, action: 'activate' })}>Activate</Button>}{isAdmin && selectedSemester.status === 'Active' && <Button size="sm" variant="danger" loading={semesterActionMutation.isPending} onClick={() => semesterActionMutation.mutate({ id: selectedSemester.id, action: 'close' })}>Close</Button>}</div>}
        </section>
        <div className="kpi-tabs" role="tablist" aria-label="Khu vực KPI">
          <button type="button" role="tab" aria-selected={activeTab === 'leaderboard'} className={activeTab === 'leaderboard' ? 'is-active' : ''} onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>
          {isAdmin && <button type="button" role="tab" aria-selected={activeTab === 'rules'} className={activeTab === 'rules' ? 'is-active' : ''} onClick={() => setActiveTab('rules')}>KPI Rules</button>}
        </div>
        {activeTab === 'leaderboard' && <section className="kpi-panel" role="tabpanel">
          <div className="kpi-panel__head"><div><BarChart3 size={20} aria-hidden="true" /><div><h2>Leaderboard</h2><p>Thứ hạng và điểm được backend trả trực tiếp, không được frontend tính lại.</p></div></div></div>
          {leaderboardQuery.isLoading ? <KpiSkeleton /> : leaderboardQuery.isError ? <KpiErrorState message="Không thể tải leaderboard cho Semester đã chọn." onRetry={() => void leaderboardQuery.refetch()} /> : leaderboard.length === 0 ? <KpiEmptyState title="Chưa có điểm KPI" description="Không có score history để backend tạo leaderboard trong Semester này." /> : <div className="kpi-leaderboard">{leaderboard.map((entry) => <KpiLeaderboardRow entry={entry} club={clubMap.get(entry.clubId)} onOpen={() => setSelectedEntry(entry)} key={entry.clubId} />)}</div>}
        </section>}
        {isAdmin && activeTab === 'rules' && <section className="kpi-panel" role="tabpanel">
          <div className="kpi-panel__head"><div><Settings2 size={20} aria-hidden="true" /><div><h2>KPI Rules</h2><p>Tiêu chí chính thức của {selectedSemester?.code}; không áp đặt tổng weight ở frontend.</p></div></div><Button onClick={openCreateRule} icon={<Plus size={16} aria-hidden="true" />}>Tạo rule</Button></div>
          {rulesQuery.isLoading ? <KpiSkeleton /> : rulesQuery.isError ? <KpiErrorState message="Không thể tải KPI Rules." onRetry={() => void rulesQuery.refetch()} /> : rules.length === 0 ? <KpiEmptyState title="Chưa có KPI rule" description="Semester hiện tại chưa có rule hoạt động." action={<Button onClick={openCreateRule}>Tạo rule đầu tiên</Button>} /> : <div className="kpi-rules">{rules.map((rule) => <article key={rule.id} data-gsap-item><div><span>{rule.isActive ? 'Đang hoạt động' : 'Không hoạt động'}</span><h2>{rule.name}</h2><p>{rule.description || 'Không có mô tả.'}</p></div><dl><div><dt>Điểm tối đa</dt><dd>{rule.maxPoints}</dd></div><div><dt>Weight</dt><dd>{rule.weight}</dd></div></dl><div className="kpi-rule-actions"><Button size="sm" variant="outline" onClick={() => openEditRule(rule)} icon={<Edit2 size={15} aria-hidden="true" />}>Sửa</Button><Button size="sm" variant="danger" onClick={() => setDeleteRule(rule)} icon={<Trash2 size={15} aria-hidden="true" />}>Xóa</Button></div></article>)}</div>}
        </section>}
      </>
    )}

    <Modal isOpen={Boolean(selectedEntry)} onClose={() => setSelectedEntry(null)} title="Chi tiết KPI câu lạc bộ" size="lg">
      {selectedEntry && <div className="kpi-detail">
        <div className="kpi-detail__summary"><KpiRankBadge rank={selectedEntry.rank} /><div><p>{clubMap.get(selectedEntry.clubId)?.name ?? selectedEntry.clubName ?? selectedEntry.clubId}</p><KpiScoreText score={detailQuery.data?.data.data.totalPoints ?? selectedEntry.totalPoints} /></div><span>{selectedSemester?.code}</span></div>
        {detailQuery.isError && <KpiErrorState message="Club score detail lỗi; leaderboard vẫn khả dụng." onRetry={() => void detailQuery.refetch()} />}
        <KpiUnavailableState title="Criteria breakdown không có trong contract" description="API detail chỉ trả totalPoints; frontend không group history hoặc tự tạo denominator/max score." />
        <section><h3>Score history</h3>{historyQuery.isLoading ? <KpiSkeleton count={2} /> : historyQuery.isError ? <KpiErrorState message="History lỗi độc lập; detail và leaderboard vẫn giữ nguyên." onRetry={() => void historyQuery.refetch()} /> : (historyQuery.data?.data.data ?? []).length === 0 ? <KpiEmptyState title="Chưa có lịch sử điểm" description="Backend không trả history cho club và Semester đã chọn." /> : <ol className="kpi-history">{(historyQuery.data?.data.data ?? []).map((item) => <KpiHistoryItem item={item} ruleName={ruleMap.get(item.ruleId ?? '')} key={item.id} />)}</ol>}</section>
      </div>}
    </Modal>
    <Modal isOpen={ruleOpen} onClose={() => { setRuleOpen(false); setEditRule(null); }} title={editRule ? 'Chỉnh sửa KPI rule' : 'Tạo KPI rule'} size="lg"><RuleForm form={ruleForm} pending={ruleMutation.isPending} onCancel={() => { setRuleOpen(false); setEditRule(null); }} onSubmit={(values) => ruleMutation.mutate(values)} /></Modal>
    <ConfirmDialog open={Boolean(deleteRule)} title="Xóa KPI rule" description={`Rule “${deleteRule?.name ?? ''}” sẽ bị vô hiệu hóa và có thể ảnh hưởng phép tính KPI. Hành động chỉ hoàn tất sau khi server xác nhận.`} confirmLabel="Xóa rule" pending={deleteMutation.isPending} onClose={() => setDeleteRule(null)} onConfirm={() => deleteRule && deleteMutation.mutate(deleteRule.id)} />
    <Modal isOpen={adjustmentOpen} onClose={() => setAdjustmentOpen(false)} title="Manual KPI adjustment" size="lg"><AdjustmentForm form={adjustmentForm} clubs={clubs} rules={adjustmentRulesQuery.data?.data.data ?? []} pending={adjustmentMutation.isPending} onCancel={() => setAdjustmentOpen(false)} onSubmit={(values) => adjustmentMutation.mutate(values)} /></Modal>
    <Modal isOpen={semesterOpen} onClose={() => setSemesterOpen(false)} title="Tạo Semester Draft" size="lg"><SemesterForm form={semesterForm} pending={semesterMutation.isPending} onCancel={() => setSemesterOpen(false)} onSubmit={(values) => semesterMutation.mutate(values)} /></Modal>
  </div>;
}

function RuleForm({ form, pending, onCancel, onSubmit }: { form: ReturnType<typeof useForm<RuleValues>>; pending: boolean; onCancel: () => void; onSubmit: (values: RuleValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = form;
  return <form className="kpi-form" onSubmit={handleSubmit(onSubmit)}><label>Tên rule<input {...register('name', { required: 'Tên rule là bắt buộc.', minLength: { value: 2, message: 'Tối thiểu 2 ký tự.' }, maxLength: { value: 150, message: 'Tối đa 150 ký tự.' } })} />{errors.name && <span role="alert">{errors.name.message}</span>}</label><label>Mô tả<textarea rows={4} maxLength={500} {...register('description')} /></label><div className="kpi-form__grid"><label>Điểm tối đa<input type="number" {...register('maxPoints', { required: 'Điểm tối đa là bắt buộc.', validate: (value) => (Number(value) >= 1 && Number(value) <= 1000) || 'Giá trị từ 1 đến 1000.' })} />{errors.maxPoints && <span role="alert">{errors.maxPoints.message}</span>}</label><label>Weight<input type="number" step="0.1" {...register('weight', { required: 'Weight là bắt buộc.', validate: (value) => (Number(value) >= .1 && Number(value) <= 10) || 'Giá trị từ 0.1 đến 10.' })} />{errors.weight && <span role="alert">{errors.weight.message}</span>}</label></div><div className="kpi-form-actions"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" loading={pending}>Lưu rule</Button></div></form>;
}

function AdjustmentForm({ form, clubs, rules, pending, onCancel, onSubmit }: { form: ReturnType<typeof useForm<AdjustmentValues>>; clubs: Club[]; rules: KpiRule[]; pending: boolean; onCancel: () => void; onSubmit: (values: AdjustmentValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = form;
  return <form className="kpi-form" onSubmit={handleSubmit(onSubmit)}><KpiUnavailableState title="Adjustment có audit trail backend" description="Frontend gửi club, Semester, delta, optional rule và reason; adjustedBy lấy từ JWT." /><label>Câu lạc bộ<select {...register('clubId', { required: 'Vui lòng chọn câu lạc bộ.' })}><option value="">Chọn câu lạc bộ</option>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select>{errors.clubId && <span role="alert">{errors.clubId.message}</span>}</label><label>KPI rule<select {...register('ruleId')}><option value="">Không gắn rule</option>{rules.map((rule) => <option value={rule.id} key={rule.id}>{rule.name}</option>)}</select></label><label>Điểm cộng hoặc trừ<input type="number" step="0.01" {...register('points', { required: 'Điểm là bắt buộc.', validate: (value) => (Number(value) !== 0 && Number(value) >= -1000 && Number(value) <= 1000) || 'Điểm phải khác 0 và trong khoảng -1000 đến 1000.' })} />{errors.points && <span role="alert">{errors.points.message}</span>}</label><label>Lý do<textarea rows={4} maxLength={500} {...register('reason', { required: 'Lý do là bắt buộc.', minLength: { value: 3, message: 'Tối thiểu 3 ký tự.' } })} />{errors.reason && <span role="alert">{errors.reason.message}</span>}</label><div className="kpi-form-actions"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" loading={pending}>Ghi điều chỉnh</Button></div></form>;
}

function SemesterForm({ form, pending, onCancel, onSubmit }: { form: ReturnType<typeof useForm<SemesterValues>>; pending: boolean; onCancel: () => void; onSubmit: (values: SemesterValues) => void }) {
  const { register, handleSubmit, watch, formState: { errors } } = form;
  const startDate = watch('startDate');
  return <form className="kpi-form" onSubmit={handleSubmit(onSubmit)}><label>Semester code<input {...register('code', { required: 'Code là bắt buộc.' })} />{errors.code && <span role="alert">{errors.code.message}</span>}</label><label>Tên Semester<input {...register('name', { required: 'Tên Semester là bắt buộc.' })} />{errors.name && <span role="alert">{errors.name.message}</span>}</label><div className="kpi-form__grid"><label>Bắt đầu<input type="datetime-local" {...register('startDate', { required: 'Ngày bắt đầu là bắt buộc.' })} />{errors.startDate && <span role="alert">{errors.startDate.message}</span>}</label><label>Kết thúc<input type="datetime-local" {...register('endDate', { required: 'Ngày kết thúc là bắt buộc.', validate: (value) => !startDate || new Date(value) > new Date(startDate) || 'Ngày kết thúc phải sau ngày bắt đầu.' })} />{errors.endDate && <span role="alert">{errors.endDate.message}</span>}</label></div><div className="kpi-form-actions"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" loading={pending}>Tạo Draft</Button></div></form>;
}
