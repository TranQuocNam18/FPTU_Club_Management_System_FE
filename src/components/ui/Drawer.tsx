import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from '../../lib/gsap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { IconButton } from './IconButton';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}

export function Drawer({ open, onClose, triggerRef, children }: DrawerProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Tab' && scopeRef.current) {
        const controls = Array.from(
          scopeRef.current.querySelectorAll<HTMLElement>(
            '[data-drawer-panel] a[href], [data-drawer-panel] button:not(:disabled), [data-drawer-panel] [tabindex="0"]',
          ),
        ).filter((element) => !element.hasAttribute('inert'));
        if (controls.length === 0) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [onClose, open, triggerRef]);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const context = gsap.context(() => {
      const panel = scope.querySelector<HTMLElement>('[data-drawer-panel]');
      const backdrop = scope.querySelector<HTMLElement>('[data-drawer-backdrop]');
      const duration = reducedMotion ? 0 : 0.24;
      gsap.to(panel, {
        x: open ? 0 : '-100%',
        autoAlpha: open ? 1 : 0,
        duration,
        ease: 'power2.out',
      });
      gsap.to(backdrop, {
        autoAlpha: open ? 1 : 0,
        duration: reducedMotion ? 0 : 0.2,
        ease: 'power2.out',
      });
    }, scope);
    return () => context.revert();
  }, [open, reducedMotion]);

  return (
    <div
      ref={scopeRef}
      className={`fixed inset-0 z-50 lg:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Đóng menu bằng lớp nền"
        data-drawer-backdrop
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70"
      />
      <aside
        data-drawer-panel
        role="dialog"
        aria-modal={open || undefined}
        aria-label="Menu điều hướng"
        inert={!open}
        className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        <IconButton ref={closeRef} label="Đóng menu" onClick={onClose} className="absolute right-3 top-3 z-10" tabIndex={open ? 0 : -1}>
          <X size={20} aria-hidden="true" />
        </IconButton>
        {children}
      </aside>
    </div>
  );
}
