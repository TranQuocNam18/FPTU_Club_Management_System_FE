import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, DollarSign, FileText, Plus, Send, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { financeApi } from '../../api/finance.api';
import { clubApi } from '../../api/club.api';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, Skeleton } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../utils';
import { getApiErrorMessage } from '../../utils/apiError';
import type { BudgetProposal, Club } from '../../types';

const createSchema = z.object({
  clubId: z.string().min(1, 'Select a club.'),
  eventName: z.string().trim().min(3, 'Event name must contain at least 3 characters.'),
  requestedAmount: z.number().positive('Requested amount must be greater than zero.'),
  budgetDetailsJson: z.string().trim().min(5, 'Add a short budget breakdown.'),
});

type CreateForm = z.infer<typeof createSchema>;
type ReviewMode = 'approve' | 'partial' | 'reject';

const statusStyle: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  PartiallyApproved: 'bg-sky-100 text-sky-800',
  Rejected: 'bg-rose-100 text-rose-800',
  Settled: 'bg-indigo-100 text-indigo-800',
};

export default function FinancePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'Admin';
  const canCreate = user?.role === 'ClubManager' || user?.role === 'Student';
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [reviewTarget, setReviewTarget] = useState<BudgetProposal | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('approve');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [feedback, setFeedback] = useState('');

  const proposalsQuery = useQuery({
    queryKey: ['finance-proposals', statusFilter],
    queryFn: () => financeApi.getProposals({
      status: statusFilter === 'All' ? undefined : statusFilter,
      page: 1,
      pageSize: 100,
    }),
  });
  const proposals: BudgetProposal[] = proposalsQuery.data?.data?.data ?? [];

  const clubsQuery = useQuery({
    queryKey: ['clubs', 'finance-form'],
    queryFn: clubApi.getAll,
    enabled: canCreate,
  });
  const clubs: Club[] = clubsQuery.data?.data?.data ?? [];

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { clubId: '', eventName: '', requestedAmount: 0, budgetDetailsJson: '' },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['finance-proposals'] });

  const createMutation = useMutation({
    mutationFn: financeApi.createProposal,
    onSuccess: () => {
      toast.success('Budget proposal draft created.');
      refresh();
      setShowCreate(false);
      createForm.reset();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to create the proposal.')),
  });

  const submitMutation = useMutation({
    mutationFn: financeApi.submitProposal,
    onSuccess: () => {
      toast.success('Proposal submitted for approval.');
      refresh();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to submit the proposal.')),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewTarget) throw new Error('No proposal selected.');
      if (reviewMode === 'approve') return financeApi.approveProposal(reviewTarget.id);
      if (reviewMode === 'partial') {
        return financeApi.partialApproveProposal(reviewTarget.id, Number(approvedAmount), feedback.trim());
      }
      return financeApi.rejectProposal(reviewTarget.id, feedback.trim());
    },
    onSuccess: () => {
      toast.success('Budget proposal reviewed.');
      refresh();
      closeReview();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to review the proposal.')),
  });

  const closeReview = () => {
    setReviewTarget(null);
    setReviewMode('approve');
    setApprovedAmount('');
    setFeedback('');
  };

  const openReview = (proposal: BudgetProposal) => {
    setReviewTarget(proposal);
    setReviewMode('approve');
    setApprovedAmount(String(proposal.requestedAmount));
    setFeedback('');
  };

  const canSubmitReview = reviewMode === 'approve'
    || (reviewMode === 'partial'
      && Number(approvedAmount) > 0
      && Number(approvedAmount) < (reviewTarget?.requestedAmount ?? 0)
      && feedback.trim().length >= 3)
    || (reviewMode === 'reject' && feedback.trim().length >= 3);

  const stats = {
    total: proposals.length,
    pending: proposals.filter((proposal) => proposal.status === 'Pending').length,
    approved: proposals.filter((proposal) => ['Approved', 'PartiallyApproved'].includes(proposal.status)).length,
    approvedAmount: proposals.reduce((sum, proposal) => sum + (proposal.approvedAmount ?? 0), 0),
  };

  if (proposalsQuery.isLoading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-24 w-full" /><Skeleton className="h-56 w-full" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-cyan-700">Finance operations</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Budget proposals</h1>
          <p className="mt-1 text-sm text-slate-600">Create, submit and review event funding requests.</p>
        </div>
        {canCreate && <Button icon={<Plus size={17} />} onClick={() => setShowCreate(true)}>New proposal</Button>}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Budget proposal summary">
        {[
          { label: 'Visible proposals', value: stats.total, icon: FileText, tone: 'bg-cyan-50 text-cyan-700' },
          { label: 'Pending review', value: stats.pending, icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Approved amount', value: formatCurrency(stats.approvedAmount), icon: DollarSign, tone: 'bg-indigo-50 text-indigo-700' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex min-h-20 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={19} /></div>
            <div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="truncate text-lg font-semibold text-slate-950">{value}</p></div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Proposal queue</h2>
          <select className="input-field max-w-52" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
            {['All', 'Draft', 'Pending', 'Approved', 'PartiallyApproved', 'Rejected'].map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>

        {proposals.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white">
            <EmptyState icon={<FileText size={44} />} title="No proposals found" description="Change the status filter or create a new proposal draft." />
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <article key={proposal.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{proposal.eventName}</h3>
                      <Badge className={statusStyle[proposal.status] ?? 'bg-slate-100 text-slate-700'}>{proposal.status}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{proposal.budgetDetailsJson || 'No budget breakdown provided.'}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span>Requested <strong className="text-slate-800">{formatCurrency(proposal.requestedAmount)}</strong></span>
                      {proposal.approvedAmount != null && <span>Approved <strong className="text-emerald-700">{formatCurrency(proposal.approvedAmount)}</strong></span>}
                      <span>Created {formatDate(proposal.proposedDate)}</span>
                    </div>
                    {proposal.feedback && <p className="mt-3 border-l-2 border-slate-300 pl-3 text-sm text-slate-600">{proposal.feedback}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!isAdmin && proposal.status === 'Draft' && (
                      <Button size="sm" icon={<Send size={15} />} loading={submitMutation.isPending} onClick={() => submitMutation.mutate(proposal.id)}>Submit</Button>
                    )}
                    {isAdmin && proposal.status === 'Pending' && (
                      <Button size="sm" variant="secondary" onClick={() => openReview(proposal)}>Review</Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create budget proposal">
        <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Club
            <select {...createForm.register('clubId')} className="input-field mt-1">
              <option value="">Select a club you manage</option>
              {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">Event name
            <input {...createForm.register('eventName')} className="input-field mt-1" placeholder="Annual technology workshop" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Requested amount
            <input {...createForm.register('requestedAmount', { valueAsNumber: true })} type="number" min="1" className="input-field mt-1" placeholder="5000000" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Budget breakdown
            <textarea {...createForm.register('budgetDetailsJson')} rows={5} className="input-field mt-1 resize-none" placeholder="Venue: 2,000,000; equipment: 1,500,000; communication: 1,500,000" />
          </label>
          {Object.values(createForm.formState.errors)[0]?.message && <p className="text-sm text-rose-600">{Object.values(createForm.formState.errors)[0]?.message}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" loading={createMutation.isPending}>Create draft</Button></div>
        </form>
      </Modal>

      <Modal isOpen={!!reviewTarget} onClose={closeReview} title="Review budget proposal">
        {reviewTarget && (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{reviewTarget.eventName}</p>
              <p className="mt-1 text-sm text-slate-600">Requested: <strong>{formatCurrency(reviewTarget.requestedAmount)}</strong></p>
            </div>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Review decision">
              {([
                ['approve', 'Full approval', CheckCircle2],
                ['partial', 'Partial', DollarSign],
                ['reject', 'Reject', XCircle],
              ] as const).map(([mode, label, Icon]) => (
                <button key={mode} type="button" onClick={() => setReviewMode(mode)} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-2 text-xs font-medium ${reviewMode === mode ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Icon size={17} />{label}
                </button>
              ))}
            </div>
            {reviewMode === 'partial' && (
              <label className="block text-sm font-medium text-slate-700">Approved amount
                <input type="number" min="1" max={reviewTarget.requestedAmount - 1} value={approvedAmount} onChange={(event) => setApprovedAmount(event.target.value)} className="input-field mt-1" />
              </label>
            )}
            {reviewMode !== 'approve' && (
              <label className="block text-sm font-medium text-slate-700">Feedback
                <textarea rows={4} value={feedback} onChange={(event) => setFeedback(event.target.value)} className="input-field mt-1 resize-none" placeholder={reviewMode === 'reject' ? 'Explain why this request is rejected.' : 'Explain the partial approval.'} />
              </label>
            )}
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={closeReview}>Cancel</Button><Button variant={reviewMode === 'reject' ? 'danger' : 'primary'} disabled={!canSubmitReview} loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate()}>Confirm decision</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
