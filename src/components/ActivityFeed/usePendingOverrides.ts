'use client';

import * as React from 'react';

/**
 * Optimistic per-id state for async callbacks: `run` sets an override, awaits
 * the action, then drops it — on success the caller's props take over, on
 * rejection the previous value shows again. Surfacing the error is the caller's job.
 */
export function usePendingOverrides<V>(): [
  ReadonlyMap<string, V>,
  (id: string, value: V, action: () => void | Promise<void>) => Promise<void>,
] {
  const [overrides, setOverrides] = React.useState<ReadonlyMap<string, V>>(
    () => new Map()
  );

  const run = React.useCallback(
    async (id: string, value: V, action: () => void | Promise<void>) => {
      setOverrides((prev) => new Map(prev).set(id, value));
      try {
        await action();
      } catch {
        // Restored below; the caller owns error reporting.
      } finally {
        setOverrides((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
    },
    []
  );

  return [overrides, run];
}
