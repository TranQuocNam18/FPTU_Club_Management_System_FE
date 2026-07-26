import type { ReactNode } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, FileText, RotateCcw, XCircle } from 'lucide-react';
import type { ActivityReport } from '../../types';
import { ReportStatusMap, ReportTypeMap } from '../../types';
import { cn, formatDate } from '../../utils';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

export function ReportStatusBadge({ status }: { status: ActivityReport['status'] }) {
  const canonical = ReportStatusMap[status] ?? String(status);
  const labels: Record<string, string> = {
    Draft: 'Bản nháp',
    PendingApproval: 'Chờ duyệt',
    Approved: 'Đã duyệt',
    RequestRevision: 'Yêu cầu chỉnh sửa',
    Rejected: 'Đã từ chối',
  };
  return <span className={cn('report-status', `report-status--${canonical.toLowerCase()}`)}>{labels[canonical] ?? canonical}</span>;
}

export function ReportTypeBadge({ type }: { type: ActivityReport['type'] }) {
  const canonical = ReportTypeMap[type] ?? String(type || 'General');
  const labels: Record<string, string> = { Financial: 'Tài chính', Activity: 'Hoạt động', General: 'Tổng hợp' };
  return <span className="report-type">{labels[canonical] ?? canonical}</span>;
}

export function ReportWorkflow({ status }: { status: ActivityReport['status'] }) {
  const canonical = ReportStatusMap[status] ?? String(status);
  const steps = [
    { id: 'Draft', label: 'Bản nháp' },
    { id: 'PendingApproval', label: 'Chờ duyệt' },
    { id: 'Approved', label: 'Đã duyệt' },
  ];
  const activeIndex = canonical === 'Draft' ? 0 : canonical === 'PendingApproval' ? 1 : canonical === 'Approved' ? 2 : 1;
  return (
    <div className="report-workflow" aria-label={`Workflow hiện tại: ${canonical}`}>
      {steps.map((step, index) => (
        <div className={cn(index <= activeIndex && 'is-complete', step.id === canonical && 'is-current')} key={step.id}>
          <span>{index + 1}</span><p>{step.label}</p>
        </div>
      ))}
      {canonical === 'RequestRevision' && <div className="report-workflow__outcome report-workflow__outcome--revision"><Clock3 size={17} aria-hidden="true" />Cần chỉnh sửa</div>}
      {canonical === 'Rejected' && <div className="report-workflow__outcome report-workflow__outcome--rejected"><XCircle size={17} aria-hidden="true" />Đã từ chối</div>}
    </div>
  );
}

export function ReportCard({
  report,
  clubName,
  semesterName,
  actions,
  onOpen,
}: {
  report: ActivityReport;
  clubName?: string;
  semesterName?: string;
  actions?: ReactNode;
  onOpen: () => void;
}) {
  return (
    <article className="report-card" data-gsap-item>
      <button type="button" className="report-card__main" onClick={onOpen}>
        <div className="report-card__icon" aria-hidden="true"><FileText size={20} /></div>
        <div className="report-card__content">
          <div className="report-card__badges"><ReportStatusBadge status={report.status} /><ReportTypeBadge type={report.type} /></div>
          <h2>{report.title}</h2>
          <p>{report.content}</p>
          <div className="report-card__meta">
            {clubName && <span>{clubName}</span>}
            {semesterName && <span>{semesterName}</span>}
            <time dateTime={report.createdAt}>{formatDate(report.createdAt)}</time>
          </div>
        </div>
        <ArrowRight size={18} aria-hidden="true" />
      </button>
      {actions && <div className="report-card__actions">{actions}</div>}
    </article>
  );
}

export function EvidenceList({ attachments }: { attachments?: ActivityReport['attachments'] }) {
  if (!attachments?.length) return <p className="report-unavailable">Không có evidence URL trong response hiện tại.</p>;
  return (
    <ul className="evidence-list">
      {attachments.map((attachment) => (
        <li key={attachment.id}>
          <FileText size={17} aria-hidden="true" />
          <span>{attachment.fileName || 'Evidence'}</span>
          <a href={attachment.url} target="_blank" rel="noreferrer">Mở evidence</a>
        </li>
      ))}
    </ul>
  );
}

export function ReportEmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="report-empty"><FileText size={28} aria-hidden="true" /><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function ReportErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="report-error" role="alert">
      <AlertCircle size={23} aria-hidden="true" />
      <div><h3>Không thể tải dữ liệu</h3><p>{message}</p></div>
      <Button size="sm" variant="outline" onClick={onRetry} icon={<RotateCcw size={15} aria-hidden="true" />}>Thử lại</Button>
    </div>
  );
}

export function ReportSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="report-list" role="status" aria-label="Đang tải báo cáo">
      {Array.from({ length: count }, (_, index) => (
        <div className="report-card" key={index}>
          <Skeleton className="h-5 w-32 bg-slate-200" /><Skeleton className="mt-4 h-6 w-2/3 bg-slate-200" /><Skeleton className="mt-3 h-12 w-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function ReviewOutcomeIcon({ action }: { action: 'Approve' | 'RequestRevision' | 'Reject' }) {
  if (action === 'Approve') return <CheckCircle2 size={18} aria-hidden="true" />;
  if (action === 'RequestRevision') return <Clock3 size={18} aria-hidden="true" />;
  return <XCircle size={18} aria-hidden="true" />;
}
