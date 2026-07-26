import { forwardRef, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '../../utils';
import { useGsapPopover } from '../../hooks/useGsapPopover';

interface DropdownPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: 'left' | 'right';
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

export const DropdownPanel = forwardRef<HTMLDivElement, DropdownPanelProps>(function DropdownPanel(
  { children, align = 'right', className, ...props },
  forwardedRef,
) {
  const panelRef = useGsapPopover<HTMLDivElement>();
  return (
    <div
      ref={(element) => {
        panelRef.current = element;
        assignRef(forwardedRef, element);
      }}
      className={cn(
        'absolute top-[calc(100%+0.625rem)] z-40 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-card)]',
        align === 'right' ? 'right-0' : 'left-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
