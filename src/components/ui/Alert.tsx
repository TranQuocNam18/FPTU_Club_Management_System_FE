import { AlertCircle } from 'lucide-react';

interface AlertProps {
  title: string;
  message?: string;
}

export function Alert({ title, message }: AlertProps) {
  return (
    <div role="alert" className="flex gap-3 rounded-[var(--radius-md)] border border-rose-400/25 bg-[var(--color-danger-soft)] p-3.5 text-rose-100">
      <AlertCircle size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {message && <p className="mt-1 text-[13px] leading-5 text-rose-200/85">{message}</p>}
      </div>
    </div>
  );
}
