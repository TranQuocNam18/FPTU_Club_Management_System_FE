import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useReducedMotion } from './useReducedMotion';

export function useGsapPopover<T extends HTMLElement>() {
  const scope = useRef<T>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = scope.current;
    if (!element) return;

    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(element, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        element,
        { autoAlpha: 0, y: -6 },
        { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out' },
      );
    }, element);

    return () => context.revert();
  }, [reducedMotion]);

  return scope;
}
