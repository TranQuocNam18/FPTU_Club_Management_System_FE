import React from 'react';
import { cn } from '../../utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-55';

  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
    secondary: 'bg-[var(--color-primary-soft)] text-indigo-100 hover:bg-indigo-400/20',
    danger: 'bg-[var(--color-danger)] text-slate-950 hover:brightness-110',
    ghost: 'bg-transparent text-[var(--color-text-muted)] hover:bg-white/[0.06] hover:text-white',
    outline: 'border border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-white/[0.05]',
  };

  const sizes = {
    sm: 'min-h-9 px-3 text-sm',
    md: 'min-h-11 px-4 text-sm',
    lg: 'min-h-12 px-5 text-base',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : icon}
      {loading && <span className="sr-only">Đang xử lý</span>}
      {children}
    </button>
  );
}
