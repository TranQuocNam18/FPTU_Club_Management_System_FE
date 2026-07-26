import React from 'react';
import { cn } from '../../utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ id, label, error, hint, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} data-gsap-item>
      <label htmlFor={id} className="text-[13px] font-semibold text-[var(--color-text)]">
        {label}
        {required && <span className="ml-1 text-[var(--color-danger)]" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-rose-300">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-[var(--color-text-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
}
