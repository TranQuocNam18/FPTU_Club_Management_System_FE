import { cn } from '../../utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[var(--radius-sm)] bg-white/[0.08]', className)} aria-hidden="true" />;
}
