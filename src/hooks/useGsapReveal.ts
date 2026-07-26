import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { useReducedMotion } from './useReducedMotion';

interface GsapRevealOptions {
  animationKey?: string;
  includeShell?: boolean;
}

export function useGsapReveal<T extends HTMLElement>({
  animationKey = 'initial',
  includeShell = false,
}: GsapRevealOptions = {}) {
  const scope = useRef<T>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = scope.current;
    if (!element) return;

    const context = gsap.context(() => {
      const items = Array.from(element.querySelectorAll<HTMLElement>('[data-gsap-item]'));
      const brand = includeShell
        ? element.querySelector<HTMLElement>('[data-gsap-brand]')
        : null;
      const card = includeShell
        ? element.querySelector<HTMLElement>('[data-gsap-card]')
        : null;

      if (prefersReducedMotion) {
        gsap.set([brand, card, ...items].filter(Boolean), {
          autoAlpha: 1,
          clearProps: 'transform',
        });
        return;
      }

      const isMobile = window.matchMedia('(max-width: 900px)').matches;
      const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (brand) {
        timeline.fromTo(
          brand,
          { autoAlpha: 0, x: isMobile ? -6 : -16 },
          { autoAlpha: 1, x: 0, duration: isMobile ? 0.4 : 0.52 },
          0,
        );
      }

      if (card) {
        timeline.fromTo(
          card,
          { autoAlpha: 0, y: isMobile ? 8 : 16 },
          { autoAlpha: 1, y: 0, duration: isMobile ? 0.4 : 0.48 },
          0.04,
        );
      }

      if (items.length > 0) {
        timeline.fromTo(
          items,
          { autoAlpha: 0, y: isMobile ? 5 : 10 },
          {
            autoAlpha: 1,
            y: 0,
            duration: isMobile ? 0.28 : 0.36,
            stagger: isMobile ? 0.025 : 0.05,
          },
          includeShell ? 0.12 : 0,
        );
      }
    }, element);

    return () => context.revert();
  }, [animationKey, includeShell, prefersReducedMotion]);

  return scope;
}
