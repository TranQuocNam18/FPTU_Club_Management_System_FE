import type { ReactNode } from 'react';
import { AlertCircle, Banknote, FileText, Link2, RotateCcw, WalletCards } from 'lucide-react';
import type { BudgetProposal } from '../../api/finance.api';
import { cn, formatCurrency, formatDateTime } from '../../utils';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { financeStatus } from './financeUtils';

export function FinanceStatusBadge({ status }: { status: BudgetProposal['status'] }) {
  const canonical = financeStatus(status);
  const labels: Record<string, string> = {
    Draft: 'Bản nháp',
    Pending: 'Chờ duyệt',
    Approved: 'Đã duyệt',
    PartiallyApproved: 'Duyệt một phần',
    Rejected: 'Đã từ chối',
    Settled: 'Đã quyết toán',
  };
  return <span className={cn('finance-status', `finance-status--${canonical.toLowerCase()}`)}>{labels[canonical] ?? canonical}</span>;
}

export function MoneyText({ value, unavailable = 'Không có trong response' }: { value?: number | null; unavailable?: string }) {
  return value == null ? <span className="finance-unavailable-value">{unavailable}</span> : <span className="money-text">{formatCurrency(value)}</span>;
}

export function ReceiptLink({ url, label = 'Mở biên nhận' }: { url?: string | null; label?: string }) {
  if (!url) return <span className="finance-unavailable-value">Không có receipt URL</span>;
  return <a className="receipt-link" href={url} target="_blank" rel="noreferrer"><Link2 size={15} aria-hidden="true" />{label}</a>;
}

export function FinanceMetricCard({ label, value, description }: { label: string; value?: number | null; description: string }) {
  return (
    <article className="finance-metric" data-gsap-item>
      <div className="finance-metric__icon" aria-hidden="true"><WalletCards size={20} /></div>
      <p>{label}</p>
      <strong>{value == null ? 'Không khả dụng' : formatCurrency(value)}</strong>
      <small>{description}</small>
    </article>
  );
}

export function ProposalCard({
  proposal,
  clubName,
  actions,
  onOpen,
}: {
  proposal: BudgetProposal;
  clubName?: string;
  actions?: ReactNode;
  onOpen: () => void;
}) {
  return (
    <article className="proposal-card" data-gsap-item>
      <button className="proposal-card__main" type="button" onClick={onOpen}>
        <div className="proposal-card__top"><FinanceStatusBadge status={proposal.status} /><span>#{proposal.id.slice(0, 8)}</span></div>
        <h2>{proposal.eventName}</h2>
        <div className="proposal-card__money">
          <div><span>Yêu cầu</span><MoneyText value={proposal.requestedAmount} /></div>
          {proposal.approvedAmount != null && <div><span>Được duyệt</span><MoneyText value={proposal.approvedAmount} /></div>}
        </div>
        <div className="proposal-card__meta">
          {clubName && <span>{clubName}</span>}
          <time dateTime={proposal.proposedDate || proposal.createdAt}>{formatDateTime(proposal.proposedDate || proposal.createdAt)}</time>
        </div>
      </button>
      {actions && <div className="proposal-card__actions">{actions}</div>}
    </article>
  );
}

export function FinanceEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="finance-empty"><Banknote size={30} aria-hidden="true" /><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function FinanceErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="finance-error" role="alert">
      <AlertCircle size={22} aria-hidden="true" />
      <div><h3>Không thể tải dữ liệu tài chính</h3><p>{message}</p></div>
      <Button size="sm" variant="outline" onClick={onRetry} icon={<RotateCcw size={15} aria-hidden="true" />}>Thử lại</Button>
    </div>
  );
}

export function FinanceUnavailableState({ title, description }: { title: string; description: string }) {
  return <div className="finance-unavailable" role="status"><FileText size={21} aria-hidden="true" /><div><strong>{title}</strong><p>{description}</p></div></div>;
}

export function FinanceSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="proposal-grid" role="status" aria-label="Đang tải dữ liệu tài chính">
      {Array.from({ length: count }, (_, index) => <div className="proposal-card finance-skeleton" key={index}><Skeleton className="h-5 w-28 bg-slate-200" /><Skeleton className="mt-4 h-7 w-2/3 bg-slate-200" /><Skeleton className="mt-4 h-16 w-full bg-slate-200" /></div>)}
    </div>
  );
}
