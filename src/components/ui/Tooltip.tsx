import { type ReactNode, useId } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
  disabled?: boolean;
}

export function Tooltip({ label, children, disabled = false }: TooltipProps) {
  const id = useId();
  if (disabled) return children;

  return (
    <span className="tooltip-root">
      <span aria-describedby={id}>{children}</span>
      <span id={id} role="tooltip" className="tooltip-content">{label}</span>
    </span>
  );
}
