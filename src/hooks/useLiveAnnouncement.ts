'use client';

import * as React from 'react';

/**
 * State for an `aria-live` region that re-announces even when the same
 * message is emitted twice in a row. Setting identical React state bails out
 * (and identical DOM text isn't a mutation), so screen readers would stay
 * silent for repeated actions like "moved down" — this clears the region
 * first, then sets the message a tick later.
 *
 * @example
 * ```tsx
 * const [announcement, announce] = useLiveAnnouncement();
 * // announce('Item moved down');
 * // <div aria-live="polite" className="sr-only">{announcement}</div>
 * ```
 */
export function useLiveAnnouncement(): [string, (message: string) => void] {
  const [message, setMessage] = React.useState('');
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const announce = React.useCallback((next: string) => {
    setMessage('');
    if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(next), 50);
  }, []);

  React.useEffect(
    () => () => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    },
    []
  );

  return [message, announce];
}
