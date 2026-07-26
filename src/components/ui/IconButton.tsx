import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = 'md', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors duration-150 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'size-9' : 'size-11',
        className,
      )}
      {...props}
    />
  ),
);

IconButton.displayName = 'IconButton';
