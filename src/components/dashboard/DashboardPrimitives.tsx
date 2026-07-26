import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, BarChart3 } from 'lucide-react';
import { cn } from '../../utils';
import { Skeleton } from '../ui/Skeleton';

export function DashboardShell({
  children,
  scopeRef,
}: {
  children: ReactNode;
  scopeRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={scopeRef} className="dashboard-shell">
      {children}
    </div>
  );
}

export function DashboardHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="dashboard-header" data-dashboard-header>
      <div className="min-w-0">
        <p className="dashboard-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="dashboard-header__actions">{actions}</div>}
    </header>
  );
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
  busy,
}: {
  title: string;
  description?: string;
  action?: { label: string; to: string };
  children: ReactNode;
  className?: string;
  busy?: boolean;
}) {
  return (
    <section className={cn('dashboard-section', className)} data-dashboard-section aria-busy={busy || undefined}>
      <div className="dashboard-section__header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action && (
          <Link className="dashboard-section__link" to={action.to}>
            {action.label}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function DashboardCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('dashboard-card', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  supportingText,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: number | string;
  supportingText: string;
  icon: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'neutral';
}) {
  return (
    <article className="dashboard-stat" data-dashboard-stat>
      <div className={cn('dashboard-stat__icon', `dashboard-stat__icon--${tone}`)} aria-hidden="true">
        {icon}
      </div>
      <div>
        <p className="dashboard-stat__label">{label}</p>
        <p className="dashboard-stat__value">{value}</p>
        <p className="dashboard-stat__support">{supportingText}</p>
      </div>
    </article>
  );
}

export function DashboardEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="dashboard-empty">
      <BarChart3 size={26} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <Link to={action.to}>{action.label}</Link>}
    </div>
  );
}

export function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="dashboard-error" role="alert">
      <AlertCircle size={24} aria-hidden="true" />
      <div>
        <h3>Không thể tải mục này</h3>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onRetry}>Thử lại</button>
    </div>
  );
}

export function DashboardSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="dashboard-skeleton" aria-label="Đang tải dữ liệu dashboard" role="status">
      {Array.from({ length: cards }, (_, index) => (
        <div className="dashboard-card" key={index}>
          <Skeleton className="h-4 w-28 bg-slate-200" />
          <Skeleton className="mt-4 h-8 w-20 bg-slate-200" />
          <Skeleton className="mt-3 h-3 w-40 max-w-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function UnavailableMetric({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-unavailable">
      <AlertCircle size={18} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
