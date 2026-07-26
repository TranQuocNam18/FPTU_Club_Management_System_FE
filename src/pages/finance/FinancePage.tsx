import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Banknote, CheckCircle2, Edit2, Eye, FilterX, Plus, ReceiptText, Search, Send, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { financeApi, type BudgetProposal, type ProposalInput } from '../../api/finance.api';
import { clubApi } from '../../api/club.api';
import {
  FinanceEmptyState,
  FinanceErrorState,
  FinanceMetricCard,
  FinanceSkeleton,
  FinanceStatusBadge,
  FinanceUnavailableState,
  MoneyText,
  ProposalCard,
  ReceiptLink,
} from '../../components/finance/FinancePrimitives';
import { financeStatus } from '../../components/finance/financeUtils';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useAuthStore } from '../../stores/authStore';
import type { Club } from '../../types';
import { formatCurrency, formatDateTime, getApiError } from '../../utils';

type FinanceTab = 'proposals' | 'balance' | 'transactions';
type ReviewMode = 'approve' | 'partial' | 'reject';

interface ProposalValues {
  eventName: string;
  requestedAmount: string;
  budgetDetailsJson: string;
}

interface ReviewValues {
  approvedAmount: string;
  feedback: string;
}

interface SettlementValues {
  actualAmount: string;
  receiptUrl: string;
  description: string;
}

export default function FinancePage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'StudentAffairsAdmin';
  const [selectedClubId, setSelectedClubId] = useState('');
  const [activeTab, setActiveTab] = useState<FinanceTab>('proposals');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetProposal | null>(null);
  const [detailTarget, setDetailTarget] = useState<BudgetProposal | null>(null);
  const [reviewTarget, setReviewTarget] = useState<BudgetProposal | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('approve');
  const [settleTarget, setSettleTarget] = useState<BudgetProposal | null>(null);
  const scopeRef = useGsapReveal<HTMLDivElement>({ animationKey: `finance-${user?.role ?? 'anonymous'}` });

  const clubsQuery = useQuery({ queryKey: ['clubs'], queryFn: clubApi.getAll, enabled: Boolean(user) });
  const membershipsQuery = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: clubApi.getMyMemberships,
    enabled: Boolean(user?.id),
  });
  const clubs = useMemo(() => clubsQuery.data?.data.data ?? [], [clubsQuery.data]);
  const memberships = useMemo(() => membershipsQuery.data?.data.data ?? [], [membershipsQuery.data]);
  const treasurerClubIds = useMemo(() => new Set(
    memberships
      .filter((membership) => Number(membership.role) === 3 && Number(membership.status) === 1)
      .map((membership) => membership.clubId),
  ), [memberships]);
  const availableClubs = useMemo(
    () => isAdmin ? clubs : clubs.filter((club) => treasurerClubIds.has(club.id)),
    [clubs, isAdmin, treasurerClubIds],
  );
  const effectiveClubId = availableClubs.some((club) => club.id === selectedClubId)
    ? selectedClubId
    : availableClubs[0]?.id ?? '';
  const selectedClub = availableClubs.find((club) => club.id === effectiveClubId);
  const hasTreasurerCapability = !isAdmin && treasurerClubIds.has(effectiveClubId);

  const proposalsQuery = useQuery({
    queryKey: ['finance-proposals', effectiveClubId],
    queryFn: () => financeApi.getProposals({ clubId: effectiveClubId, pageSize: 100 }),
    enabled: Boolean(effectiveClubId),
  });
  const balanceQuery = useQuery({
    queryKey: ['finance-balance', effectiveClubId],
    queryFn: () => financeApi.getBalance(effectiveClubId),
    enabled: Boolean(effectiveClubId && activeTab === 'balance'),
  });
  const transactionsQuery = useQuery({
    queryKey: ['finance-transactions', effectiveClubId],
    queryFn: () => financeApi.getTransactions(effectiveClubId),
    enabled: Boolean(effectiveClubId && activeTab === 'transactions'),
  });
  const detailQuery = useQuery({
    queryKey: ['finance-proposal', detailTarget?.id ?? reviewTarget?.id],
    queryFn: () => financeApi.getProposal((detailTarget?.id ?? reviewTarget?.id)!),
    enabled: Boolean(detailTarget || reviewTarget),
  });

  const proposals = useMemo(() => proposalsQuery.data?.data.data ?? [], [proposalsQuery.data]);
  const normalizedSearch = search.trim().toLocaleLowerCase('vi-VN');
  const filteredProposals = useMemo(() => proposals.filter((proposal) => (
    (!normalizedSearch || proposal.eventName.toLocaleLowerCase('vi-VN').includes(normalizedSearch) || proposal.id.toLocaleLowerCase().includes(normalizedSearch))
    && (!statusFilter || financeStatus(proposal.status) === statusFilter)
  )), [normalizedSearch, proposals, statusFilter]);

  const proposalForm = useForm<ProposalValues>();
  const reviewForm = useForm<ReviewValues>();
  const settlementForm = useForm<SettlementValues>();
  const invalidateSelectedClub = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['finance-proposals', effectiveClubId] }),
    queryClient.invalidateQueries({ queryKey: ['finance-balance', effectiveClubId] }),
    queryClient.invalidateQueries({ queryKey: ['finance-transactions', effectiveClubId] }),
  ]);

  const saveProposalMutation = useMutation({
    mutationFn: async (values: ProposalValues) => {
      const payload = {
        eventName: values.eventName.trim(),
        requestedAmount: Number(values.requestedAmount),
        budgetDetailsJson: values.budgetDetailsJson.trim() || null,
      };
      return editTarget
        ? financeApi.updateProposal(editTarget.id, { ...payload, activityId: editTarget.activityId })
        : financeApi.createProposal({ ...payload, clubId: effectiveClubId } satisfies ProposalInput);
    },
    onSuccess: async () => {
      toast.success(editTarget ? 'Đã lưu thay đổi bản nháp.' : 'Đã tạo đề xuất ở trạng thái Draft.');
      setCreateOpen(false);
      setEditTarget(null);
      proposalForm.reset();
      await invalidateSelectedClub();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể lưu đề xuất ngân sách.')),
  });
  const submitMutation = useMutation({
    mutationFn: (id: string) => financeApi.submitProposal(id),
    onSuccess: async () => { toast.success('Đã gửi đề xuất để duyệt.'); await invalidateSelectedClub(); },
    onError: (error) => toast.error(getApiError(error, 'Không thể gửi đề xuất.')),
  });
  const reviewMutation = useMutation({
    mutationFn: (values: ReviewValues) => {
      if (!reviewTarget) throw new Error('Missing proposal');
      if (reviewMode === 'approve') return financeApi.approveProposal(reviewTarget.id);
      if (reviewMode === 'partial') return financeApi.partialApproveProposal(reviewTarget.id, Number(values.approvedAmount), values.feedback.trim());
      return financeApi.rejectProposal(reviewTarget.id, values.feedback.trim());
    },
    onSuccess: async () => {
      toast.success('Đã hoàn tất xét duyệt.');
      setReviewTarget(null);
      reviewForm.reset();
      await invalidateSelectedClub();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể hoàn tất xét duyệt.')),
  });
  const settleMutation = useMutation({
    mutationFn: (values: SettlementValues) => financeApi.settleProposal(settleTarget!.id, {
      actualAmount: Number(values.actualAmount),
      receiptUrl: values.receiptUrl.trim(),
      description: values.description.trim() || undefined,
    }),
    onSuccess: async () => {
      toast.success('Đã quyết toán đề xuất.');
      setSettleTarget(null);
      settlementForm.reset();
      await invalidateSelectedClub();
    },
    onError: (error) => toast.error(getApiError(error, 'Không thể quyết toán đề xuất.')),
  });

  function openCreate() {
    proposalForm.reset({ eventName: '', requestedAmount: '', budgetDetailsJson: '' });
    setCreateOpen(true);
  }
  function openEdit(proposal: BudgetProposal) {
    proposalForm.reset({
      eventName: proposal.eventName,
      requestedAmount: String(proposal.requestedAmount),
      budgetDetailsJson: proposal.budgetDetailsJson ?? '',
    });
    setEditTarget(proposal);
  }
  function openReview(proposal: BudgetProposal) {
    reviewForm.reset({ approvedAmount: '', feedback: '' });
    setReviewMode('approve');
    setReviewTarget(proposal);
  }
  function openSettlement(proposal: BudgetProposal) {
    settlementForm.reset({ actualAmount: '', receiptUrl: '', description: '' });
    setSettleTarget(proposal);
  }

  const clubLoading = clubsQuery.isLoading || (!isAdmin && membershipsQuery.isLoading);
  const clubError = clubsQuery.isError || (!isAdmin && membershipsQuery.isError);

  return (
    <div ref={scopeRef} className="finance-page">
      <header className="finance-header" data-gsap-item>
        <div><p className="finance-eyebrow">{isAdmin ? 'Financial governance' : 'Club treasury operations'}</p><h1>Vận hành tài chính</h1><p>Kiểm tra đề xuất, phê duyệt, số dư, giao dịch và quyết toán từ dữ liệu Gateway.</p></div>
        {hasTreasurerCapability && <Button onClick={openCreate} icon={<Plus size={17} aria-hidden="true" />}>Tạo đề xuất</Button>}
      </header>

      {clubLoading ? <FinanceSkeleton /> : clubError ? (
        <FinanceErrorState message="Không thể xác định câu lạc bộ hoặc Treasurer capability." onRetry={() => { void clubsQuery.refetch(); if (!isAdmin) void membershipsQuery.refetch(); }} />
      ) : availableClubs.length === 0 ? (
        <FinanceEmptyState title="Không có quyền quản lý tài chính" description={isAdmin ? 'Không có câu lạc bộ trong response hiện tại.' : 'Cần approved Treasurer membership role 3; Club Leader không được cấp quyền thay thế.'} />
      ) : (
        <>
          <div className="finance-controls" data-gsap-item>
            <label><span>Câu lạc bộ</span><select value={effectiveClubId} onChange={(event) => setSelectedClubId(event.target.value)}>{availableClubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
            <div className="finance-tabs" role="tablist" aria-label="Khu vực tài chính">
              {([['proposals', 'Đề xuất'], ['balance', 'Số dư'], ['transactions', 'Giao dịch']] as const).map(([value, label]) => (
                <button type="button" role="tab" aria-selected={activeTab === value} className={activeTab === value ? 'is-active' : ''} onClick={() => setActiveTab(value)} key={value}>{label}</button>
              ))}
            </div>
          </div>

          {activeTab === 'proposals' && (
            <section className="finance-tab-panel" role="tabpanel">
              <div className="finance-filterbar" data-gsap-item>
                <label className="finance-search"><span>Tìm kiếm</span><div><Search size={16} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên sự kiện hoặc mã đề xuất..." /></div></label>
                <label><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tất cả</option><option value="Draft">Bản nháp</option><option value="Pending">Chờ duyệt</option><option value="Approved">Đã duyệt</option><option value="PartiallyApproved">Duyệt một phần</option><option value="Rejected">Từ chối</option><option value="Settled">Đã quyết toán</option></select></label>
                {(search || statusFilter) && <Button size="sm" variant="ghost" onClick={() => { setSearch(''); setStatusFilter(''); }} icon={<FilterX size={16} aria-hidden="true" />}>Xóa lọc</Button>}
              </div>
              {proposalsQuery.isLoading ? <FinanceSkeleton /> : proposalsQuery.isError ? (
                <FinanceErrorState message="Proposal endpoint không trả dữ liệu cho câu lạc bộ đã chọn." onRetry={() => void proposalsQuery.refetch()} />
              ) : filteredProposals.length === 0 ? (
                <FinanceEmptyState title={proposals.length ? 'Không có kết quả phù hợp' : 'Chưa có đề xuất ngân sách'} description={proposals.length ? 'Thử xóa hoặc thay đổi bộ lọc.' : 'Không có proposal trong response hiện tại.'} action={hasTreasurerCapability ? <Button onClick={openCreate}>Tạo đề xuất đầu tiên</Button> : undefined} />
              ) : (
                <div className="proposal-grid">
                  {filteredProposals.map((proposal) => {
                    const status = financeStatus(proposal.status);
                    return <ProposalCard key={proposal.id} proposal={proposal} clubName={selectedClub?.name} onOpen={() => setDetailTarget(proposal)} actions={<>
                      <Button size="sm" variant="ghost" onClick={() => setDetailTarget(proposal)} icon={<Eye size={15} aria-hidden="true" />}>Chi tiết</Button>
                      {hasTreasurerCapability && status === 'Draft' && <Button size="sm" variant="outline" onClick={() => openEdit(proposal)} icon={<Edit2 size={15} aria-hidden="true" />}>Sửa</Button>}
                      {hasTreasurerCapability && status === 'Draft' && <Button size="sm" loading={submitMutation.isPending && submitMutation.variables === proposal.id} onClick={() => submitMutation.mutate(proposal.id)} icon={<Send size={15} aria-hidden="true" />}>Gửi duyệt</Button>}
                      {isAdmin && status === 'Pending' && <Button size="sm" onClick={() => openReview(proposal)} icon={<ShieldCheck size={15} aria-hidden="true" />}>Review</Button>}
                      {hasTreasurerCapability && ['Approved', 'PartiallyApproved'].includes(status) && <Button size="sm" onClick={() => openSettlement(proposal)} icon={<ReceiptText size={15} aria-hidden="true" />}>Quyết toán</Button>}
                    </>} />;
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'balance' && <section className="finance-tab-panel" role="tabpanel">
            {balanceQuery.isLoading ? <FinanceSkeleton /> : balanceQuery.isError ? <FinanceErrorState message="Balance endpoint không khả dụng hoặc tài khoản không được cấp quyền." onRetry={() => void balanceQuery.refetch()} /> : balanceQuery.data?.data.data ? (
              <div className="finance-metrics"><FinanceMetricCard label="Đã phân bổ" value={balanceQuery.data.data.data.allocatedAmount} description="Ngân sách được cấp cho câu lạc bộ." /><FinanceMetricCard label="Đã chi" value={balanceQuery.data.data.data.spentAmount} description="Chi phí được ghi nhận bởi Finance service." /><FinanceMetricCard label="Khả dụng" value={balanceQuery.data.data.data.availableAmount} description="Số dư khả dụng theo backend." /></div>
            ) : <FinanceUnavailableState title="Không có dữ liệu số dư" description="Frontend không suy diễn số dư từ proposal hoặc hiển thị số 0 giả." />}
          </section>}

          {activeTab === 'transactions' && <section className="finance-tab-panel" role="tabpanel">
            {transactionsQuery.isLoading ? <FinanceSkeleton /> : transactionsQuery.isError ? <FinanceErrorState message="Transaction endpoint không khả dụng hoặc tài khoản không được cấp quyền." onRetry={() => void transactionsQuery.refetch()} /> : (transactionsQuery.data?.data.data ?? []).length === 0 ? <FinanceEmptyState title="Chưa có giao dịch" description="Không có transaction trong response hiện tại; running balance không được suy diễn ở client." /> : (
              <div className="transaction-list">{(transactionsQuery.data?.data.data ?? []).map((transaction) => <article key={transaction.id} data-gsap-item><div><span className="transaction-type">{transaction.type}</span><h2>{transaction.description}</h2><p>{transaction.referenceId ? `Reference #${transaction.referenceId}` : 'Không có reference trong response'}</p></div><div><MoneyText value={transaction.amount} /><time dateTime={transaction.transactionDate}>{formatDateTime(transaction.transactionDate)}</time><ReceiptLink url={transaction.receiptUrl} /></div></article>)}</div>
            )}
          </section>}
        </>
      )}

      <Modal isOpen={Boolean(detailTarget)} onClose={() => setDetailTarget(null)} title="Chi tiết đề xuất" size="lg">
        {detailQuery.isLoading ? <FinanceSkeleton count={1} /> : detailQuery.isError ? <FinanceErrorState message="Không thể tải proposal detail." onRetry={() => void detailQuery.refetch()} /> : detailTarget && <ProposalDetail proposal={detailQuery.data?.data.data ?? detailTarget} club={selectedClub} />}
      </Modal>
      <Modal isOpen={createOpen || Boolean(editTarget)} onClose={() => { setCreateOpen(false); setEditTarget(null); }} title={editTarget ? 'Chỉnh sửa bản nháp' : 'Tạo đề xuất ngân sách'} size="lg">
        <ProposalForm form={proposalForm} pending={saveProposalMutation.isPending} onCancel={() => { setCreateOpen(false); setEditTarget(null); }} onSubmit={(values) => saveProposalMutation.mutate(values)} />
      </Modal>
      <Modal isOpen={Boolean(reviewTarget)} onClose={() => setReviewTarget(null)} title="Review đề xuất ngân sách" size="lg">
        {reviewTarget && <div className="finance-review"><ProposalDetail proposal={detailQuery.data?.data.data ?? reviewTarget} club={selectedClub} /><ReviewForm proposal={reviewTarget} form={reviewForm} mode={reviewMode} onModeChange={(mode) => { setReviewMode(mode); reviewForm.clearErrors(); }} pending={reviewMutation.isPending} onCancel={() => setReviewTarget(null)} onSubmit={(values) => reviewMutation.mutate(values)} /></div>}
      </Modal>
      <Modal isOpen={Boolean(settleTarget)} onClose={() => setSettleTarget(null)} title="Quyết toán đề xuất" size="lg">
        {settleTarget && <SettlementForm proposal={settleTarget} form={settlementForm} pending={settleMutation.isPending} onCancel={() => setSettleTarget(null)} onSubmit={(values) => settleMutation.mutate(values)} />}
      </Modal>
    </div>
  );
}

function ProposalDetail({ proposal, club }: { proposal: BudgetProposal; club?: Club }) {
  return <div className="proposal-detail">
    <div className="proposal-detail__head"><div><FinanceStatusBadge status={proposal.status} /><p>Proposal #{proposal.id}</p><h2>{proposal.eventName}</h2></div><Banknote size={26} aria-hidden="true" /></div>
    <div className="proposal-workflow" aria-label={`Workflow hiện tại: ${financeStatus(proposal.status)}`}><span className="is-complete">1<strong>Draft</strong></span><span className={financeStatus(proposal.status) !== 'Draft' ? 'is-complete' : ''}>2<strong>Pending</strong></span><span className={['Approved', 'PartiallyApproved', 'Rejected', 'Settled'].includes(financeStatus(proposal.status)) ? 'is-complete' : ''}>3<strong>Review outcome</strong></span></div>
    <dl className="proposal-facts"><div><dt>Câu lạc bộ</dt><dd>{club?.name ?? proposal.clubId}</dd></div><div><dt>Ngày đề xuất</dt><dd>{formatDateTime(proposal.proposedDate || proposal.createdAt)}</dd></div><div><dt>Số tiền yêu cầu</dt><dd><MoneyText value={proposal.requestedAmount} /></dd></div><div><dt>Số tiền duyệt</dt><dd><MoneyText value={proposal.approvedAmount} /></dd></div><div><dt>Proposer</dt><dd>{proposal.proposerId || 'Không có trong response'}</dd></div><div><dt>Reviewer</dt><dd>{proposal.reviewedBy || 'Chưa review'}</dd></div></dl>
    {proposal.feedback && <div className="finance-feedback"><strong>Phản hồi review</strong><p>{proposal.feedback}</p></div>}
    <section><h3>Chi tiết ngân sách</h3><pre>{proposal.budgetDetailsJson || 'Không có budget details trong response.'}</pre></section>
    {financeStatus(proposal.status) === 'Settled' && <section className="settlement-summary"><h3>Quyết toán</h3><p><strong>Chi phí thực tế:</strong> {proposal.actualAmount == null ? 'Không có trong response' : formatCurrency(proposal.actualAmount)}</p><p>{proposal.settlementDescription || 'Không có mô tả quyết toán.'}</p><ReceiptLink url={proposal.receiptUrl} /></section>}
  </div>;
}

function ProposalForm({ form, pending, onCancel, onSubmit }: { form: ReturnType<typeof useForm<ProposalValues>>; pending: boolean; onCancel: () => void; onSubmit: (values: ProposalValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = form;
  return <form className="finance-form" onSubmit={handleSubmit(onSubmit)}>
    <label>Tên sự kiện<input {...register('eventName', { required: 'Vui lòng nhập tên sự kiện.', minLength: { value: 3, message: 'Tối thiểu 3 ký tự.' }, maxLength: { value: 200, message: 'Tối đa 200 ký tự.' } })} />{errors.eventName && <span role="alert">{errors.eventName.message}</span>}</label>
    <label>Số tiền yêu cầu (VND)<input type="number" inputMode="decimal" step="0.01" {...register('requestedAmount', { required: 'Vui lòng nhập số tiền.', validate: (value) => Number(value) > 0 || 'Số tiền phải lớn hơn 0.' })} />{errors.requestedAmount && <span role="alert">{errors.requestedAmount.message}</span>}</label>
    <label>Chi tiết ngân sách<textarea rows={8} maxLength={5000} {...register('budgetDetailsJson')} /><small>Contract hiện tại nhận chuỗi budgetDetailsJson; frontend không tự tạo line item schema.</small></label>
    <div className="finance-form-actions"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" loading={pending}>Lưu Draft</Button></div>
  </form>;
}

function ReviewForm({ proposal, form, mode, onModeChange, pending, onCancel, onSubmit }: { proposal: BudgetProposal; form: ReturnType<typeof useForm<ReviewValues>>; mode: ReviewMode; onModeChange: (mode: ReviewMode) => void; pending: boolean; onCancel: () => void; onSubmit: (values: ReviewValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = form;
  return <form className="finance-form review-form" onSubmit={handleSubmit(onSubmit)}>
    <fieldset><legend>Kết quả review</legend><div className="finance-review-options">{([['approve', 'Duyệt toàn bộ'], ['partial', 'Duyệt một phần'], ['reject', 'Từ chối']] as const).map(([value, label]) => <label className={mode === value ? 'is-selected' : ''} key={value}><input type="radio" name="finance-review-mode" checked={mode === value} onChange={() => onModeChange(value)} />{label}</label>)}</div></fieldset>
    {mode === 'partial' && <label>Số tiền duyệt<input type="number" inputMode="decimal" step="0.01" {...register('approvedAmount', { validate: (value) => mode !== 'partial' || (Number(value) > 0 && Number(value) < proposal.requestedAmount) || `Số tiền phải lớn hơn 0 và nhỏ hơn ${formatCurrency(proposal.requestedAmount)}.` })} />{errors.approvedAmount && <span role="alert">{errors.approvedAmount.message}</span>}</label>}
    {mode !== 'approve' && <label>Phản hồi<textarea rows={4} maxLength={1000} {...register('feedback', { validate: (value) => value.trim().length >= 3 || 'Phản hồi tối thiểu 3 ký tự.' })} />{errors.feedback && <span role="alert">{errors.feedback.message}</span>}</label>}
    <div className="finance-form-actions"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" loading={pending} icon={mode === 'approve' ? <CheckCircle2 size={16} aria-hidden="true" /> : undefined}>Xác nhận</Button></div>
  </form>;
}

function SettlementForm({ proposal, form, pending, onCancel, onSubmit }: { proposal: BudgetProposal; form: ReturnType<typeof useForm<SettlementValues>>; pending: boolean; onCancel: () => void; onSubmit: (values: SettlementValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = form;
  const ceiling = proposal.approvedAmount ?? proposal.requestedAmount;
  return <form className="finance-form" onSubmit={handleSubmit(onSubmit)}>
    <FinanceUnavailableState title="Receipt sử dụng URL metadata" description="Backend không có upload adapter; form không hiển thị file picker hoặc tiến trình upload." />
    <label>Chi phí thực tế<input type="number" inputMode="decimal" step="0.01" {...register('actualAmount', { required: 'Vui lòng nhập chi phí thực tế.', validate: (value) => (Number(value) > 0 && Number(value) <= ceiling) || `Chi phí phải lớn hơn 0 và không vượt ${formatCurrency(ceiling)}.` })} />{errors.actualAmount && <span role="alert">{errors.actualAmount.message}</span>}</label>
    <label>Receipt URL<input type="url" {...register('receiptUrl', { required: 'Receipt URL là bắt buộc.', pattern: { value: /^https?:\/\/\S+$/i, message: 'Vui lòng nhập URL http(s) hợp lệ.' } })} />{errors.receiptUrl && <span role="alert">{errors.receiptUrl.message}</span>}</label>
    <label>Mô tả<textarea rows={4} maxLength={500} {...register('description')} /></label>
    <div className="finance-form-actions"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="submit" loading={pending}>Quyết toán</Button></div>
  </form>;
}
