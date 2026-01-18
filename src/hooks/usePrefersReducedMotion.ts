import { useEffect, useState } from 'react';

/**
 * Hook that detects if the user prefers reduced motion.
 * Useful for disabling animations for accessibility.
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *   return (
 *     <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
