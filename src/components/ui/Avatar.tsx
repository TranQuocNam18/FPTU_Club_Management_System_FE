import { cn } from '../../utils';

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

export function Avatar({ name = 'User', src, size = 'md', className }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-300/20 bg-indigo-400/15 font-semibold text-indigo-100',
        size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm',
        className,
      )}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials}
    </span>
  );
}
