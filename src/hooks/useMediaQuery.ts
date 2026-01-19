import { useState, useEffect } from 'react';

/**
 * Hook that tracks whether a media query matches.
 * Uses the native `matchMedia` API for efficient media query tracking.
 *
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns Boolean indicating whether the media query matches
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 *   const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
 *   const isDesktop = useMediaQuery('(min-width: 1024px)');
 *
 *   return (
 *     <div>
 *       {isMobile && <MobileLayout />}
 *       {isTablet && <TabletLayout />}
 *       {isDesktop && <DesktopLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with null to indicate SSR/initial state
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Handler for media query changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers use addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

/**
 * Preset breakpoint hooks following common responsive design patterns
 */

/** Returns true when viewport is smaller than 640px (mobile) */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

/** Returns true when viewport is 640px-767px (large mobile / small tablet) */
export function useIsSmallTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 767px)');
}

/** Returns true when viewport is 768px-1023px (tablet) */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/** Returns true when viewport is 1024px or larger (desktop) */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/** Returns true when viewport is 1280px or larger (large desktop) */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

/** Returns true when viewport is smaller than 1024px (mobile/tablet) */
export function useIsMobileOrTablet(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}
