import { useSyncExternalStore } from 'react';

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
  // External-store pattern: the server snapshot is always `false`, so SSR
  // markup and the hydration pass agree; React then re-renders immediately
  // from the client snapshot for reduced-motion users.
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const QUERY = '(prefers-reduced-motion: reduce)';

const canQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function';

function subscribe(onStoreChange: () => void): () => void {
  if (!canQuery()) return () => {};
  const mediaQuery = window.matchMedia(QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

const getSnapshot = () => canQuery() && window.matchMedia(QUERY).matches;

const getServerSnapshot = () => false;
