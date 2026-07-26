import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-5 py-8 text-center text-[var(--color-text-muted)]">
      <AlertCircle size={26} className="text-[var(--color-danger)]" aria-hidden="true" />
      <p className="max-w-xs text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={<RotateCcw size={15} aria-hidden="true" />}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
